export interface Chunk {
  text: string;
  level: number;
}

export class HierarchicalChunker {
  private chunkSize: number;
  private overlap: number;

  constructor(chunkSize: number = 500, overlap: number = 100) {
    this.chunkSize = chunkSize;
    this.overlap = overlap;
  }

  chunkText(text: string): Chunk[] {
    const chunks: Chunk[] = [];
    const paragraphs = text.split('\n\n');

    for (const para of paragraphs) {
      if (para.trim().length === 0) continue;

      if (para.length <= this.chunkSize) {
        chunks.push({ text: para.trim(), level: 0 });
      } else {
        const sentences = para.split(/(?<=[.!?])\s+/);
        const sentenceGroups = this.groupSentences(sentences);

        for (const group of sentenceGroups) {
          if (group.length <= this.chunkSize) {
            chunks.push({ text: group, level: 1 });
          } else {
            const tokenChunks = this.chunkByTokens(group);
            for (const tokenChunk of tokenChunks) {
              chunks.push({ text: tokenChunk, level: 2 });
            }
          }
        }
      }
    }

    return chunks;
  }

  private groupSentences(sentences: string[]): string[] {
    const groups: string[] = [];
    let currentGroup = '';

    for (const sentence of sentences) {
      if (currentGroup.length + sentence.length <= this.chunkSize) {
        currentGroup += sentence + ' ';
      } else {
        if (currentGroup.trim()) {
          groups.push(currentGroup.trim());
        }
        currentGroup = sentence + ' ';
      }
    }

    if (currentGroup.trim()) {
      groups.push(currentGroup.trim());
    }

    return groups;
  }

  private chunkByTokens(text: string): string[] {
    const tokens = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const token of tokens) {
      if (currentChunk.length + token.length <= this.chunkSize) {
        currentChunk += token + ' ';
      } else {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = token + ' ';
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

function cleanExtractedText(text: string): string {
  if (!text) return '';

  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    .replace(/[^\x20-\x7E\n\r\t\u00A0-\uFFFF]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/ \n /g, '\n')
    .trim();
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist');

    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
      } catch (e) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });

    const pdf = await loadingTask.promise;

    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    const cleanedText = cleanExtractedText(fullText);

    if (!cleanedText || cleanedText.length < 10) {
      throw new Error('Failed to extract readable text from PDF file. The file may be corrupted, password-protected, or contain only images.');
    }

    return cleanedText;
  } catch (error: any) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to process PDF: ${error.message || 'Unknown error'}`);
  }
}

export async function extractTextFromTXT(file: File): Promise<string> {
  try {
    const text = await file.text();
    const cleanedText = cleanExtractedText(text);

    if (!cleanedText || cleanedText.length < 10) {
      throw new Error('Failed to extract readable text from TXT file. The file may be empty or contain only non-readable characters.');
    }

    return cleanedText;
  } catch (error: any) {
    console.error('TXT extraction error:', error);
    throw new Error(`Failed to process TXT: ${error.message || 'Unknown error'}`);
  }
}

export async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.extractRawText({ arrayBuffer });
    const cleanedText = cleanExtractedText(result.value);

    if (!cleanedText || cleanedText.length < 10) {
      throw new Error('Failed to extract readable text from DOCX file. The file may be corrupted or encrypted.');
    }

    return cleanedText;
  } catch (error: any) {
    console.error('DOCX extraction error:', error);
    throw new Error(`Failed to process DOCX: ${error.message || 'Unknown error'}`);
  }
}

export async function extractTextFromCSV(file: File): Promise<string> {
  try {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('CSV file is empty.');

    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const rows = lines.slice(1).map(line => {
      const values = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || line.split(',');
      return headers.map((h, i) => `${h}: ${(values[i] || '').replace(/^"|"$/g, '').trim()}`).join(', ');
    });

    const cleanedText = cleanExtractedText([headers.join(', '), ...rows].join('\n'));
    if (!cleanedText || cleanedText.length < 5) {
      throw new Error('Failed to extract readable text from CSV file.');
    }
    return cleanedText;
  } catch (error: any) {
    console.error('CSV extraction error:', error);
    throw new Error(`Failed to process CSV: ${error.message || 'Unknown error'}`);
  }
}

export async function extractTextFromExcel(file: File): Promise<string> {
  try {
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const parts: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim()) {
        parts.push(`Sheet: ${sheetName}\n${csv}`);
      }
    }

    const fullText = parts.join('\n\n');
    const cleanedText = cleanExtractedText(fullText);
    if (!cleanedText || cleanedText.length < 5) {
      throw new Error('Failed to extract readable text from Excel file.');
    }
    return cleanedText;
  } catch (error: any) {
    console.error('Excel extraction error:', error);
    throw new Error(`Failed to process Excel file: ${error.message || 'Unknown error'}`);
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop();

  switch (ext) {
    case 'pdf':
      return extractTextFromPDF(file);
    case 'txt':
      return extractTextFromTXT(file);
    case 'docx':
      return extractTextFromDOCX(file);
    case 'csv':
      return extractTextFromCSV(file);
    case 'xlsx':
    case 'xls':
      return extractTextFromExcel(file);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

export function createHierarchicalChunks(text: string): Chunk[] {
  const chunker = new HierarchicalChunker();
  return chunker.chunkText(text);
}

// Strategy 1: Fixed-Size Chunking
export function createFixedSizeChunks(text: string, size: number = 500, overlap: number = 50): Chunk[] {
  const chunks: Chunk[] = [];
  const words = text.split(/\s+/);

  for (let i = 0; i < words.length; i += size - overlap) {
    const chunk = words.slice(i, i + size).join(' ');
    if (chunk.trim()) {
      chunks.push({ text: chunk.trim(), level: 0 });
    }
  }

  return chunks;
}

// Strategy 2: Sentence-Based Chunking
export function createSentenceBasedChunks(text: string, sentencesPerChunk: number = 5): Chunk[] {
  const chunks: Chunk[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());

  for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
    const chunk = sentences.slice(i, i + sentencesPerChunk).join(' ');
    if (chunk.trim()) {
      chunks.push({ text: chunk.trim(), level: 0 });
    }
  }

  return chunks;
}

// Strategy 3: Paragraph-Based Chunking
export function createParagraphBasedChunks(text: string): Chunk[] {
  const chunks: Chunk[] = [];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());

  paragraphs.forEach(para => {
    if (para.trim()) {
      chunks.push({ text: para.trim(), level: 0 });
    }
  });

  return chunks;
}

// Strategy 4: Semantic Chunking (groups related content)
export function createSemanticChunks(text: string, maxSize: number = 800): Chunk[] {
  const chunks: Chunk[] = [];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
  let currentChunk = '';

  paragraphs.forEach(para => {
    if (currentChunk.length + para.length < maxSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    } else {
      if (currentChunk.trim()) {
        chunks.push({ text: currentChunk.trim(), level: 0 });
      }
      currentChunk = para;
    }
  });

  if (currentChunk.trim()) {
    chunks.push({ text: currentChunk.trim(), level: 0 });
  }

  return chunks;
}

// Strategy 5: Recursive Chunking (splits large chunks recursively)
export function createRecursiveChunks(text: string, maxSize: number = 600): Chunk[] {
  const chunks: Chunk[] = [];

  function recursiveSplit(content: string, level: number) {
    if (content.length <= maxSize) {
      chunks.push({ text: content.trim(), level });
      return;
    }

    const separators = ['\n\n', '\n', '. ', ' '];

    for (const sep of separators) {
      if (content.includes(sep)) {
        const parts = content.split(sep);
        const mid = Math.floor(parts.length / 2);
        const left = parts.slice(0, mid).join(sep);
        const right = parts.slice(mid).join(sep);

        if (left.trim()) recursiveSplit(left, level + 1);
        if (right.trim()) recursiveSplit(right, level + 1);
        return;
      }
    }

    chunks.push({ text: content.trim(), level });
  }

  recursiveSplit(text, 0);
  return chunks;
}

// Strategy 6: Document Structure-Aware (preserves headings and sections)
export function createStructureAwareChunks(text: string): Chunk[] {
  const chunks: Chunk[] = [];
  const lines = text.split('\n');
  let currentSection = '';
  let currentHeading = '';

  lines.forEach(line => {
    const trimmed = line.trim();
    const isHeading = /^#{1,6}\s/.test(trimmed) ||
                     (trimmed.length < 100 && trimmed.endsWith(':') && trimmed.length > 3);

    if (isHeading) {
      if (currentSection.trim()) {
        chunks.push({
          text: (currentHeading + '\n' + currentSection).trim(),
          level: 0
        });
      }
      currentHeading = trimmed;
      currentSection = '';
    } else {
      currentSection += (currentSection ? '\n' : '') + trimmed;
    }
  });

  if (currentSection.trim()) {
    chunks.push({
      text: (currentHeading + '\n' + currentSection).trim(),
      level: 0
    });
  }

  return chunks.filter(chunk => chunk.text.length > 10);
}

// Strategy 7: Token-Based Chunking (by word count)
export function createTokenBasedChunks(text: string, tokensPerChunk: number = 300): Chunk[] {
  const chunks: Chunk[] = [];
  const words = text.split(/\s+/).filter(w => w.trim());

  for (let i = 0; i < words.length; i += tokensPerChunk) {
    const chunk = words.slice(i, i + tokensPerChunk).join(' ');
    if (chunk.trim()) {
      chunks.push({ text: chunk.trim(), level: 0 });
    }
  }

  return chunks;
}

// Strategy 8: Sliding Window (overlapping chunks)
export function createSlidingWindowChunks(text: string, windowSize: number = 400, step: number = 200): Chunk[] {
  const chunks: Chunk[] = [];
  const words = text.split(/\s+/).filter(w => w.trim());

  for (let i = 0; i < words.length; i += step) {
    const chunk = words.slice(i, i + windowSize).join(' ');
    if (chunk.trim() && chunk.split(/\s+/).length >= 10) {
      chunks.push({ text: chunk.trim(), level: Math.floor(i / windowSize) });
    }
  }

  return chunks;
}

// Strategy 9: Hybrid Approach (combines multiple strategies)
export function createHybridChunks(text: string): Chunk[] {
  const chunks: Chunk[] = [];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());

  paragraphs.forEach((para, idx) => {
    if (para.length <= 600) {
      chunks.push({ text: para.trim(), level: 0 });
    } else {
      const sentences = para.split(/(?<=[.!?])\s+/).filter(s => s.trim());
      let currentChunk = '';

      sentences.forEach(sentence => {
        if (currentChunk.length + sentence.length <= 600) {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        } else {
          if (currentChunk.trim()) {
            chunks.push({ text: currentChunk.trim(), level: 1 });
          }
          currentChunk = sentence;
        }
      });

      if (currentChunk.trim()) {
        chunks.push({ text: currentChunk.trim(), level: 1 });
      }
    }
  });

  return chunks;
}

// Main function to select chunking strategy
export function createChunks(text: string, strategy: string = '1'): Chunk[] {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot create chunks from empty text');
  }

  let chunks: Chunk[] = [];

  switch (strategy) {
    case '1':
      chunks = createFixedSizeChunks(text);
      break;
    case '2':
      chunks = createSentenceBasedChunks(text);
      break;
    case '3':
      chunks = createParagraphBasedChunks(text);
      break;
    case '4':
      chunks = createSemanticChunks(text);
      break;
    case '5':
      chunks = createRecursiveChunks(text);
      break;
    case '6':
      chunks = createStructureAwareChunks(text);
      break;
    case '7':
      chunks = createTokenBasedChunks(text);
      break;
    case '8':
      chunks = createSlidingWindowChunks(text);
      break;
    case '9':
      chunks = createHybridChunks(text);
      break;
    default:
      chunks = createFixedSizeChunks(text);
  }

  // Filter out empty chunks and ensure minimum length
  const validChunks = chunks.filter(chunk => {
    const trimmed = chunk.text.trim();
    return trimmed.length >= 10 && /\w/.test(trimmed);
  });

  if (validChunks.length === 0) {
    throw new Error('No valid text chunks could be created from the document. The document may contain insufficient readable text.');
  }

  return validChunks;
}
