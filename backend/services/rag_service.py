import os
from dotenv import load_dotenv
from google import genai

# Load .env explicitly
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

document_store = {}

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks

def add_document(doc_id: str, text: str, filename: str):
    chunks = chunk_text(text)
    document_store[doc_id] = {
        "filename": filename,
        "chunks": chunks,
        "text": text[:5000],
    }
    return len(chunks)

def get_relevant_chunks(doc_id: str, query: str, top_k: int = 5) -> list[str]:
    if doc_id not in document_store:
        return []
    chunks = document_store[doc_id]["chunks"]
    query_lower = query.lower()
    scored = []
    for chunk in chunks:
        score = sum(1 for word in query_lower.split() if word in chunk.lower())
        scored.append((score, chunk))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in scored[:top_k]]

def query_document(doc_id: str, question: str) -> dict:
    if doc_id not in document_store:
        return {"error": "Document not found"}
    relevant_chunks = get_relevant_chunks(doc_id, question)
    context = "\n\n".join(relevant_chunks)
    filename = document_store[doc_id]["filename"]
    prompt = f"""You are a financial analyst assistant analyzing the document: {filename}

Based on the following excerpts from the document, answer the question concisely and accurately.
Focus on financial metrics, risks, and business insights.

Document excerpts:
{context}

Question: {question}

Provide a clear, structured answer. If the information is not in the excerpts, say so."""

    response = client.models.generate_content(
        model='gemini-2.0-flash-lite',
        contents=prompt,
    )
    return {
        "answer": response.text,
        "sources": relevant_chunks[:2],
        "document": filename,
    }

def list_documents() -> list[dict]:
    return [
        {"id": doc_id, "filename": info["filename"], "chunks": len(info["chunks"])}
        for doc_id, info in document_store.items()
    ]
