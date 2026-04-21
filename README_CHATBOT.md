# Generic Chatbot for Any XYZ Department

A powerful Streamlit-based chatbot application with document ingestion, hierarchical chunking, LLM integration, and comprehensive prompt history management.

## Features

✅ **Document Upload & Processing**
- Support for PDF, DOCX, and TXT files
- Hierarchical chunking strategy (paragraph → sentence → token levels)
- Automatic embedding generation using OpenAI

✅ **LLM-Powered Responses**
- Role-based personas: Auditor, Risk Manager, Manager, GRC
- Context-aware responses using uploaded documents
- Accuracy/confidence scoring for all responses

✅ **Smart Caching**
- Automatic duplicate prompt detection
- Option to use cached results or fetch fresh responses
- Side-by-side comparison of old vs new results

✅ **Comprehensive History**
- All prompts and responses stored in Supabase
- Filter and view history by role
- Metadata tracking (timestamps, source documents, accuracy scores)

✅ **Vector Similarity Search**
- Semantic search using pgvector
- Top 3 most relevant documents displayed with relevance scores
- Hierarchical level tracking for each chunk

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file with the following variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### 3. Database Setup

The Supabase database tables are automatically created via migrations:
- `documents` - Document metadata
- `embeddings` - Document chunks with vector embeddings
- `prompt_responses` - Prompt history and caching

### 4. Run the Application

```bash
streamlit run app.py
```

The application will start at `http://localhost:8501`

## Usage

### Step 1: Select Role
Choose a role from the sidebar (Auditor, Risk Manager, Manager, or GRC) to define the LLM's persona.

### Step 2: Upload Documents
Upload one or more documents (PDF, DOCX, TXT) using the file uploader in the sidebar. Click "Process Documents" to ingest and embed the files.

### Step 3: Ask Questions
Enter your question in the prompt window on the left and click "Submit Prompt".

### Step 4: View Results
The results window displays:
- **Accuracy Level**: High, Medium, or Low confidence score
- **Response**: The LLM's answer in the selected role
- **Top 3 Documents**: Most relevant source documents with relevance percentages

### Step 5: Handle Duplicate Prompts
If a question has been asked before:
- Option to use cached results (instant)
- Option to get fresh results (new LLM call)
- Side-by-side comparison of old vs new results

## Architecture

### Document Processing
- **Hierarchical Chunking**: Text is split at multiple levels (paragraphs, sentences, tokens) to preserve context
- **Embeddings**: Each chunk is embedded using OpenAI's embedding model
- **Storage**: Embeddings stored in Supabase with pgvector for efficient similarity search

### LLM Integration
- **Role Prompts**: System prompts tailored for each role (Auditor, Risk Manager, Manager, GRC)
- **Context Retrieval**: Top 3 similar documents are included as context
- **Confidence Scoring**: Each response includes a confidence/accuracy score

### Caching Strategy
- **Duplicate Detection**: Prompts are stored with unique constraint
- **Cache Comparison**: Old and new results can be compared side-by-side
- **Smart Options**: Users can choose cached or fresh results

## File Structure

- `app.py` - Main Streamlit application
- `db_utils.py` - Supabase database utilities
- `document_processor.py` - Hierarchical chunking logic
- `llm_utils.py` - OpenAI integration and embedding functions
- `requirements.txt` - Python dependencies

## Database Schema

### documents
- `id` (uuid): Primary key
- `filename` (text): Original filename
- `file_path` (text): Storage path
- `file_type` (text): MIME type
- `uploaded_at` (timestamp): Upload time
- `created_at` (timestamp): Creation time

### embeddings
- `id` (uuid): Primary key
- `document_id` (uuid): Reference to document
- `chunk_text` (text): Text content
- `embedding` (vector): 1536-dimension OpenAI embedding
- `chunk_index` (int): Position in document
- `hierarchy_level` (int): 0=paragraph, 1=sentence, 2=token
- `created_at` (timestamp): Creation time

### prompt_responses
- `id` (uuid): Primary key
- `prompt` (text): User question (unique)
- `response` (text): LLM response
- `role` (text): Selected persona
- `top_documents` (jsonb): References to source documents
- `accuracy_scores` (jsonb): Confidence scores
- `is_cached` (boolean): Whether result is from cache
- `cached_response_id` (uuid): Reference to original response if cached
- `created_at` (timestamp): Creation time

## Security

- Row Level Security (RLS) enabled on all tables
- Only authenticated users can access documents and prompts
- API keys stored in environment variables (not in code)
- Vector search function requires authentication

## Limitations

- Chunk size set to 500 characters (configurable in `document_processor.py`)
- Supports OpenAI API for embeddings and LLM calls
- Requires active internet connection for LLM calls
- File uploads limited to PDF, DOCX, and TXT formats
