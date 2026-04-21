import os
from supabase import create_client, Client
from datetime import datetime
import json

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def init_db():
    """Initialize database tables if they don't exist"""
    try:
        supabase.table("documents").select("id").limit(1).execute()
    except Exception as e:
        print(f"Database initialization check: {str(e)}")
        pass


def save_document(filename: str, file_path: str, file_type: str) -> dict:
    """Save document metadata to database"""
    try:
        data = {
            "filename": filename,
            "file_path": file_path,
            "file_type": file_type,
            "uploaded_at": datetime.utcnow().isoformat(),
        }
        response = supabase.table("documents").insert(data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise Exception(f"Failed to save document to database: {str(e)}")


def save_embeddings(
    doc_id: str, chunk_text: str, embedding: list, chunk_index: int, level: int
) -> dict:
    """Save document chunks and embeddings"""
    try:
        data = {
            "document_id": doc_id,
            "chunk_text": chunk_text,
            "embedding": embedding,
            "chunk_index": chunk_index,
            "hierarchy_level": level,
            "created_at": datetime.utcnow().isoformat(),
        }
        response = supabase.table("embeddings").insert(data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise Exception(f"Failed to save embeddings to database: {str(e)}")


def save_prompt_response(
    prompt: str,
    response: str,
    role: str,
    top_documents: list,
    accuracy_scores: list,
    is_cached: bool = False,
    cached_response_id: str = None,
) -> dict:
    """Save prompt and response to database"""
    try:
        data = {
            "prompt": prompt,
            "response": response,
            "role": role,
            "top_documents": json.dumps(top_documents),
            "accuracy_scores": json.dumps(accuracy_scores),
            "is_cached": is_cached,
            "cached_response_id": cached_response_id,
            "created_at": datetime.utcnow().isoformat(),
        }
        response_data = supabase.table("prompt_responses").insert(data).execute()
        return response_data.data[0] if response_data.data else None
    except Exception as e:
        raise Exception(f"Failed to save prompt response to database: {str(e)}")


def check_duplicate_prompt(prompt: str) -> dict:
    """Check if prompt exists in database"""
    try:
        response = supabase.table("prompt_responses").select("*").eq("prompt", prompt).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error checking duplicate prompt: {str(e)}")
        return None


def get_all_documents() -> list:
    """Get all uploaded documents"""
    try:
        response = supabase.table("documents").select("*").execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"Error retrieving documents: {str(e)}")
        return []


def search_embeddings(query_embedding: list, limit: int = 3) -> list:
    """Search for similar embeddings using vector similarity"""
    try:
        response = supabase.rpc("search_embeddings", {"query_embedding": query_embedding, "match_count": limit}).execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"Error searching embeddings: {str(e)}")
        return []


def get_prompt_history() -> list:
    """Get all stored prompts and responses"""
    try:
        response = (
            supabase.table("prompt_responses")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        return response.data if response.data else []
    except Exception as e:
        print(f"Error retrieving prompt history: {str(e)}")
        return []
