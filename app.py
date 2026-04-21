import streamlit as st
import os
from dotenv import load_dotenv
from pathlib import Path
import json
from datetime import datetime
import re

load_dotenv()

MAX_PROMPT_LENGTH = 10000
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_FILE_TYPES = ["pdf", "docx", "txt"]
MAX_PROMPTS_PER_SESSION = 50
MAX_FILE_UPLOADS_PER_SESSION = 20

from db_utils import (
    init_db,
    save_document,
    save_embeddings,
    save_prompt_response,
    check_duplicate_prompt,
    get_all_documents,
    get_prompt_history,
)
from document_processor import create_hierarchical_chunks
from llm_utils import (
    generate_embedding,
    get_llm_response,
    rank_documents,
    format_accuracy_display,
    calculate_similarity,
)


def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent injection attacks"""
    text = text.strip()
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<[^>]+>', '', text)
    return text


def validate_prompt(prompt: str) -> tuple[bool, str]:
    """Validate user prompt"""
    if not prompt or len(prompt.strip()) == 0:
        return False, "Please enter a prompt"

    if len(prompt) > MAX_PROMPT_LENGTH:
        return False, f"Prompt exceeds maximum length of {MAX_PROMPT_LENGTH} characters"

    return True, ""


def validate_file(uploaded_file) -> tuple[bool, str]:
    """Validate uploaded file"""
    if uploaded_file.size > MAX_FILE_SIZE:
        return False, f"File {uploaded_file.name} exceeds maximum size of 10MB"

    file_ext = Path(uploaded_file.name).suffix.lower()[1:]
    if file_ext not in ALLOWED_FILE_TYPES:
        return False, f"File type {file_ext} not allowed. Allowed types: {', '.join(ALLOWED_FILE_TYPES)}"

    return True, ""


def check_rate_limit(limit_type: str, max_limit: int) -> tuple[bool, str]:
    """Check rate limit for a given action"""
    if limit_type not in st.session_state:
        st.session_state[limit_type] = 0

    if st.session_state[limit_type] >= max_limit:
        return False, f"Rate limit exceeded. Maximum {max_limit} {limit_type} per session"

    return True, ""


def increment_rate_limit(limit_type: str):
    """Increment rate limit counter"""
    if limit_type not in st.session_state:
        st.session_state[limit_type] = 0
    st.session_state[limit_type] += 1


st.set_page_config(
    page_title="Generic Chatbot for Any XYZ Department",
    layout="wide",
    initial_sidebar_state="expanded",
)

init_db()

st.title("Generic Chatbot for Any XYZ Department")
st.markdown("---")

with st.sidebar:
    st.header("Configuration")

    selected_role = st.selectbox(
        "Select LLM Persona Role",
        ["Auditor", "Risk Manager", "Manager", "GRC"],
        help="Choose the role that best fits your inquiry",
    )

    st.subheader("Document Upload")
    uploaded_files = st.file_uploader(
        "Upload documents (PDF, DOCX, TXT)",
        type=["pdf", "docx", "txt"],
        accept_multiple_files=True,
        help="Upload files for the chatbot to ingest and embed",
    )

    if uploaded_files:
        if st.button("Process Documents", key="process_docs"):
            can_upload, error_msg = check_rate_limit("file_uploads", MAX_FILE_UPLOADS_PER_SESSION)
            if not can_upload:
                st.error(error_msg)
            else:
                with st.spinner("Processing documents..."):
                    processed_count = 0
                    for uploaded_file in uploaded_files:
                    is_valid, error_msg = validate_file(uploaded_file)
                    if not is_valid:
                        st.error(error_msg)
                        continue

                    safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '_', uploaded_file.name)
                    file_path = f"/tmp/{safe_filename}"

                    try:
                        with open(file_path, "wb") as f:
                            f.write(uploaded_file.getbuffer())

                        doc_data = save_document(
                            filename=safe_filename,
                            file_path=file_path,
                            file_type=uploaded_file.type,
                        )

                        chunks = create_hierarchical_chunks(file_path)
                        for chunk_idx, (chunk_text, hierarchy_level) in enumerate(chunks):
                            embedding = generate_embedding(chunk_text)
                            save_embeddings(
                                doc_id=doc_data["id"],
                                chunk_text=chunk_text,
                                embedding=embedding,
                                chunk_index=chunk_idx,
                                level=hierarchy_level,
                            )

                        os.remove(file_path)
                        processed_count += 1
                    except Exception as e:
                        st.error(f"Error processing {uploaded_file.name}: {str(e)}")
                        if os.path.exists(file_path):
                            os.remove(file_path)

                    if processed_count > 0:
                        st.success(f"Processed {processed_count} document(s)")
                        increment_rate_limit("file_uploads")

    documents = get_all_documents()
    if documents:
        st.subheader("Uploaded Documents")
        for doc in documents:
            st.text(f"📄 {doc['filename']}")

col1, col2 = st.columns([1, 1], gap="large")

with col1:
    st.subheader("Prompt Window")

    user_prompt = st.text_area(
        "Enter your question",
        height=150,
        placeholder="Type your question here...",
        key="user_prompt",
    )

    if st.button("Submit Prompt", key="submit_prompt", type="primary"):
        is_valid, error_msg = validate_prompt(user_prompt)
        if not is_valid:
            st.warning(error_msg)
        else:
            can_submit, rate_error = check_rate_limit("prompts", MAX_PROMPTS_PER_SESSION)
            if not can_submit:
                st.error(rate_error)
            else:
                sanitized_prompt = sanitize_input(user_prompt)
                increment_rate_limit("prompts")
                with st.spinner("Processing prompt..."):
                    duplicate_response = check_duplicate_prompt(sanitized_prompt)

                    if duplicate_response:
                        st.info("This question has been asked before!")

                        col_a, col_b = st.columns(2)
                        with col_a:
                            use_cached = st.button("Use Cached Results")
                        with col_b:
                            get_new = st.button("Get New Results")

                        if use_cached:
                            st.session_state.show_cached = True
                            st.session_state.cached_result = duplicate_response

            c                    sanitized_prompt, selected_role
                            )

                            top_doc_info = []
                            for doc_idx, similarity in top_docs[:3]:
                                top_doc_info.append(
                                    {"index": doc_idx, "similarity": similarity}
                                )

                            accuracy_scores = [similarity for _, similarity in top_docs[:3]]

                            new_response_id = save_prompt_response(
                                prompt=sanitized_prompt,
                                response=response,
                                role=selected_role,
                                top_documents=top_doc_info,
                                accuracy_scores=accuracy_scores,
                                is_cached=False,
                                cached_response_id=duplicate_response["id"],
                            )

                            st.session_state.new_result = {
                                "response": response,
                                "accuracy": accuracy,
                                "top_docs": top_doc_info,
                                "accuracy_scores": accuracy_scores,
                            }
                            st.session_state.show_comparison = True

                    else:
                        query_embedding = generate_embedding(sanitized_prompt)

                        top_docs = rank_documents(query_embedding, [])

                        response, accuracy = get_llm_response(sanitized_prompt, selected_role)

                        top_doc_info = []
                        for doc_idx, similarity in top_docs[:3]:
                            top_doc_info.append({"index": doc_idx, "similarity": similarity})

                        accuracy_scores = [similarity for _, similarity in top_docs[:3]]

                        save_prompt_response(
                            prompt=sanitized_prompt,
                            response=response,
                            role=selected_role,
                            top_documents=top_doc_info,
                            accuracy_scores=accuracy_scores,
                        )

                        st.session_state.current_result = {
                            "response": response,
                            "accuracy": accuracy,
                            "top_docs": top_doc_info,
                            "accuracy_scores": accuracy_scores,
                        }

with col2:
    st.subheader("Search Results & Top Documents")

    if "current_result" in st.session_state:
        result = st.session_state.current_result

        st.write("**Accuracy Level:**")
        st.success(format_accuracy_display(result["accuracy"]))

        st.write("**Response:**")
        st.write(result["response"])

        st.write("**Top 3 Documents Used:**")
        for i, doc_info in enumerate(result["top_docs"][:3], 1):
            accuracy_pct = doc_info.get("similarity", 0) * 100
            st.write(
                f"{i}. Document #{doc_info['index']} - Relevance: {accuracy_pct:.1f}%"
            )

    if "show_cached" in st.session_state and st.session_state.show_cached:
        cached = st.session_state.cached_result
        st.write("**Cached Results:**")
        st.write(cached["response"])

    if "show_comparison" in st.session_state and st.session_state.show_comparison:
        st.write("---")
        st.write("**New Results (Comparison):**")
        new_result = st.session_state.new_result
        st.write(new_result["response"])
        st.write(
            f"**Accuracy:** {format_accuracy_display(new_result['accuracy'])}"
        )

st.markdown("---")

st.subheader("Prompt History")
history = get_prompt_history()
if history:
    for entry in history[:10]:
        with st.expander(
            f"Q: {entry['prompt'][:60]}... | Role: {entry['role']}"
        ):
            st.write(f"**Role:** {entry['role']}")
            st.write(f"**Response:** {entry['response']}")
            st.write(
                f"**Timestamp:** {entry['created_at']}"
            )
            if entry.get("top_documents"):
                st.write(f"**Top Documents:** {entry['top_documents']}")
else:
    st.info("No prompt history yet. Submit a prompt to get started!")
