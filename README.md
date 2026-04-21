# Generic Chatbot for Any XYZ Department

A production-ready React chatbot application with document ingestion, hierarchical chunking, LLM integration, and comprehensive prompt history management powered by Supabase and OpenAI.

## Features

### 1. Title & Branding
- Professional header: "Generic Chatbot for Any XYZ Department"
- Clean, modern interface with gradient backgrounds

### 2. Document Upload & Processing
- Support for PDF, DOCX, and TXT files
- Drag-and-drop file upload
- Automatic document processing and embedding generation
- Real-time upload progress indicators

### 3. Hierarchical Chunking Strategy
- Three-level chunking: Paragraph → Sentence → Token
- Optimized for context preservation
- Configurable chunk sizes (default 500 characters)
- Vector embeddings using OpenAI's text-embedding-3-small

### 4. Dual-Window Display
- **Prompt Window**: Clean textarea for entering questions
- **Results Window**: Displays AI responses with formatting
- **Documents Window**: Shows top 3 most relevant source documents with relevance scores

### 5. Role-Based LLM Personas
- **Auditor**: Compliance and regulatory focus
- **Risk Manager**: Risk assessment and mitigation
- **Manager**: Operational efficiency and decision support
- **GRC**: Governance, Risk, and Compliance expertise

### 6. Accuracy Scoring
- High Confidence (90%+): Green badge
- Medium Confidence (70-89%): Orange badge
- Low Confidence (<70%): Red badge
- Displayed prominently above each result

### 7. Database-Backed Storage
- All prompts and responses stored in Supabase
- Full prompt history with timestamps
- Searchable and filterable history

### 8. Smart Caching & Comparison
- Automatic duplicate prompt detection
- Choose between cached or fresh results
- Side-by-side comparison view for old vs new responses
- Clear notification when questions have been asked before

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- OpenAI API key

### Environment Setup

Create a `.env` file:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### Installation

```bash
npm install
npm run dev
```

The application will start at `http://localhost:5173`

## Usage Guide

### Step 1: Select a Role
Choose your desired LLM persona from the dropdown:
- Auditor
- Risk Manager
- Manager
- GRC

### Step 2: Upload Documents
1. Click the file upload button
2. Select one or multiple files (PDF, DOCX, or TXT)
3. Wait for processing (embeddings are generated automatically)
4. Uploaded documents appear in the sidebar

### Step 3: Ask Questions
1. Type your question in the prompt window
2. Click "Submit Prompt"
3. The system searches your documents and generates a response

### Step 4: Review Results
- **Accuracy Badge**: Shows confidence level
- **Response**: AI-generated answer based on your documents
- **Top 3 Documents**: Most relevant source chunks with relevance percentages

### Step 5: Handle Duplicate Questions
If you ask a question that's been asked before:
- Get notified with an amber alert
- Choose "Use Cached Results" for instant answers
- Choose "Get New Results" to fetch fresh responses
- Compare old vs new results side-by-side

### Step 6: Browse History
- Click on any previous prompt in the history sidebar
- Automatically loads the prompt and role
- Re-run or modify as needed

## Technical Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vite** for build tooling

### Backend & Data
- **Supabase** for database and authentication
- **pgvector** extension for semantic search
- **OpenAI API** for embeddings and chat completions

### Database Schema

#### documents
Stores uploaded file metadata

#### embeddings
Stores document chunks with vector embeddings
- Uses pgvector for efficient similarity search
- Hierarchical levels tracked (0=paragraph, 1=sentence, 2=token)

#### prompt_responses
Stores all Q&A pairs with metadata
- Unique constraint on prompts for duplicate detection
- References to cached responses
- Top documents and accuracy scores as JSON

### Key Components

#### Document Processing
- `HierarchicalChunker`: Splits text into multi-level chunks
- Extracts text from PDF, DOCX, and TXT files
- Generates embeddings for each chunk

#### LLM Integration
- Role-based system prompts
- Context-aware responses using retrieved documents
- Confidence scoring for each response

#### Caching & Comparison
- Checks for duplicate prompts before API calls
- Offers user choice between cached and fresh results
- Side-by-side comparison UI

## File Structure

```
src/
├── App.tsx                      # Main application component
├── lib/
│   ├── supabase.ts             # Supabase client and database functions
│   ├── embeddings.ts           # OpenAI integration and LLM utilities
│   └── documentProcessor.ts    # Hierarchical chunking logic
├── index.css                   # Global styles
└── main.tsx                    # Application entry point

supabase/
└── migrations/
    ├── create_documents_table.sql
    ├── create_embeddings_table.sql
    ├── create_prompt_responses_table.sql
    └── create_search_embeddings_function.sql
```

## Security Features

- Row Level Security (RLS) enabled on all tables
- API keys stored in environment variables
- Authenticated access required for all operations
- Secure vector similarity search function

## Performance

- Efficient vector search using pgvector's IVFFlat index
- Lazy loading for history (shows last 50 prompts)
- Optimized chunk sizes for context vs speed
- Parallel embedding generation for multiple documents

## Future Enhancements

- File type support for images and spreadsheets
- Advanced filtering and search in history
- Custom role creation
- Export functionality for Q&A pairs
- Batch document processing
- Multi-language support

## Troubleshooting

### Build Errors
Run `npm run build` to check for TypeScript errors

### Missing API Keys
Check your `.env` file and ensure all required keys are present

### Supabase Connection Issues
Verify your Supabase URL and anon key are correct

### OpenAI API Errors
Ensure your OpenAI API key has sufficient credits

## License

MIT
