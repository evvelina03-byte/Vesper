from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from services.rag_service import add_document, query_document, list_documents
import PyPDF2
import io
import uuid

router = APIRouter(prefix="/documents", tags=["AI Assistant"])

class QueryRequest(BaseModel):
    document_id: str
    question: str

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
    
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    
    doc_id = str(uuid.uuid4())
    num_chunks = add_document(doc_id, text, file.filename)
    
    return {
        "document_id": doc_id,
        "filename": file.filename,
        "chunks": num_chunks,
        "characters": len(text),
        "message": f"Document processed successfully into {num_chunks} chunks",
    }

@router.post("/query")
async def query(request: QueryRequest):
    result = query_document(request.document_id, request.question)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.get("/")
def get_documents():
    return list_documents()
