import PyPDF2
import docx
from pathlib import Path
from typing import List, Tuple
import re
import os


class HierarchicalChunker:
    """Hierarchical chunking strategy for documents"""

    def __init__(self, chunk_size: int = 500, overlap: int = 100):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def _validate_file_path(self, file_path: str) -> bool:
        """Validate file path to prevent path traversal attacks"""
        try:
            real_path = os.path.realpath(file_path)
            if not os.path.exists(real_path):
                raise ValueError(f"File does not exist: {file_path}")
            if '..' in file_path or file_path.startswith('/'):
                base_path = os.path.realpath('/tmp')
                if not real_path.startswith(base_path):
                    raise ValueError("Invalid file path: potential path traversal")
            return True
        except Exception as e:
            raise ValueError(f"File path validation failed: {str(e)}")

    def chunk_text(self, text: str) -> List[Tuple[str, int]]:
        """
        Chunk text hierarchically by: paragraphs -> sentences -> tokens
        Returns list of (chunk_text, hierarchy_level)
        Level 0: Paragraph level
        Level 1: Sentence level
        Level 2: Token level chunks
        """
        chunks = []

        paragraphs = text.split("\n\n")
        for para in paragraphs:
            if len(para.strip()) == 0:
                continue

            if len(para) <= self.chunk_size:
                chunks.append((para.strip(), 0))
            else:
                sentences = re.split(r"(?<=[.!?])\s+", para)
                sentence_groups = []
                current_group = ""

                for sentence in sentences:
                    if len(current_group) + len(sentence) <= self.chunk_size:
                        current_group += sentence + " "
                    else:
                        if current_group:
                            sentence_groups.append(current_group.strip())
                        current_group = sentence + " "

                if current_group:
                    sentence_groups.append(current_group.strip())

                for group in sentence_groups:
                    if len(group) <= self.chunk_size:
                        chunks.append((group, 1))
                    else:
                        tokens = group.split()
                        token_chunk = ""
                        for token in tokens:
                            if len(token_chunk) + len(token) <= self.chunk_size:
                                token_chunk += token + " "
                            else:
                                if token_chunk:
                                    chunks.append((token_chunk.strip(), 2))
                                token_chunk = token + " "
                        if token_chunk:
                            chunks.append((token_chunk.strip(), 2))

        return chunks

    def process_document(self, file_path: str) -> List[Tuple[str, int]]:
        """Process document and return hierarchical chunks"""
        self._validate_file_path(file_path)
        ext = Path(file_path).suffix.lower()

        if ext == ".pdf":
            return self._process_pdf(file_path)
        elif ext == ".docx":
            return self._process_docx(file_path)
        elif ext == ".txt":
            return self._process_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")

    def _process_pdf(self, file_path: str) -> List[Tuple[str, int]]:
        """Extract text from PDF and chunk hierarchically"""
        text = ""
        try:
            with open(file_path, "rb") as file:
                pdf_reader = PyPDF2.PdfReader(file)
                if len(pdf_reader.pages) == 0:
                    raise ValueError("PDF file is empty")
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text
        except ValueError as ve:
            raise ve
        except Exception as e:
            raise Exception(f"Error processing PDF file '{file_path}': {str(e)}")

        if not text.strip():
            raise ValueError("No text could be extracted from PDF")

        return self.chunk_text(text)

    def _process_docx(self, file_path: str) -> List[Tuple[str, int]]:
        """Extract text from DOCX and chunk hierarchically"""
        text = ""
        try:
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                if para.text.strip():
                    text += para.text + "\n"
        except Exception as e:
            raise Exception(f"Error processing DOCX file '{file_path}': {str(e)}")

        if not text.strip():
            raise ValueError("No text could be extracted from DOCX")

        return self.chunk_text(text)

    def _process_txt(self, file_path: str) -> List[Tuple[str, int]]:
        """Extract text from TXT and chunk hierarchically"""
        try:
            with open(file_path, "r", encoding="utf-8") as file:
                text = file.read()
        except UnicodeDecodeError:
            try:
                with open(file_path, "r", encoding="latin-1") as file:
                    text = file.read()
            except Exception as e:
                raise Exception(f"Error reading TXT file with multiple encodings: {str(e)}")
        except Exception as e:
            raise Exception(f"Error processing TXT file '{file_path}': {str(e)}")

        if not text.strip():
            raise ValueError("TXT file is empty")

        return self.chunk_text(text)


def create_hierarchical_chunks(
    file_path: str, chunk_size: int = 500, overlap: int = 100
) -> List[Tuple[str, int]]:
    """Helper function to create hierarchical chunks from a document"""
    chunker = HierarchicalChunker(chunk_size, overlap)
    return chunker.process_document(file_path)
