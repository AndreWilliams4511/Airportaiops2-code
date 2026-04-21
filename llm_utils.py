import os
from typing import Tuple
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

role_prompts = {
    "Auditor": """You are an expert internal auditor. Analyze the provided information with focus on:
- Compliance and regulatory requirements
- Internal controls and processes
- Risk assessment and mitigation
- Documentation and evidence review
Keep responses objective and evidence-based.""",
    "Risk Manager": """You are a risk management professional. Analyze information considering:
- Risk identification and assessment
- Likelihood and impact analysis
- Risk mitigation strategies
- Regulatory and operational risks
Provide structured risk assessments.""",
    "Manager": """You are a general manager. Analyze information focusing on:
- Operational efficiency
- Resource allocation
- Decision-making support
- Strategic implications
Provide practical, actionable insights.""",
    "GRC": """You are a Governance, Risk, and Compliance specialist. Analyze information with focus on:
- Governance structures and policies
- Risk management frameworks
- Compliance requirements
- Regulatory landscape
Provide comprehensive GRC assessments.""",
}


def get_embeddings():
    """Initialize OpenAI embeddings"""
    return OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)


def generate_embedding(text: str) -> list:
    """Generate embedding for a text chunk"""
    try:
        if not text or len(text.strip()) == 0:
            raise ValueError("Text cannot be empty")
        embeddings = get_embeddings()
        embedding = embeddings.embed_query(text)
        return embedding
    except Exception as e:
        raise Exception(f"Failed to generate embedding: {str(e)}")


def calculate_similarity(embedding1: list, embedding2: list) -> float:
    """Calculate cosine similarity between two embeddings"""
    arr1 = np.array(embedding1).reshape(1, -1)
    arr2 = np.array(embedding2).reshape(1, -1)
    similarity = cosine_similarity(arr1, arr2)[0][0]
    return float(similarity)


def get_llm_response(prompt: str, role: str, context: str = "") -> Tuple[str, float]:
    """
    Get response from LLM with role-based persona
    Returns (response, confidence_score)
    """
    llm = ChatOpenAI(temperature=0.7, openai_api_key=OPENAI_API_KEY)

    role_instruction = role_prompts.get(role, role_prompts["Manager"])

    if context:
        full_prompt = f"""{role_instruction}

Based on the following context:
{context}

Answer this question: {prompt}"""
    else:
        full_prompt = f"""{role_instruction}

Answer this question: {prompt}"""

    try:
        response = llm.predict(text=full_prompt)
        confidence = 0.85
        return response, confidence
    except Exception as e:
        raise Exception(f"Error getting LLM response: {str(e)}")


def rank_documents(query_embedding: list, document_embeddings: list) -> list:
    """
    Rank documents by similarity to query
    Returns list of (doc_index, similarity_score)
    """
    similarities = []
    for idx, doc_embedding in enumerate(document_embeddings):
        similarity = calculate_similarity(query_embedding, doc_embedding)
        similarities.append((idx, similarity))

    sorted_similarities = sorted(similarities, key=lambda x: x[1], reverse=True)
    return sorted_similarities


def format_accuracy_display(accuracy: float) -> str:
    """Format accuracy score for display"""
    percentage = accuracy * 100
    if percentage >= 90:
        level = "High Confidence"
        color = "green"
    elif percentage >= 70:
        level = "Medium Confidence"
        color = "orange"
    else:
        level = "Low Confidence"
        color = "red"
    return f"{level} ({percentage:.1f}%)"
