from pydantic import BaseModel


class DocumentMeta(BaseModel):
    doc_id: str
    name: str
    size: int
    chunks: int
    uploaded_at: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentMeta]
    total: int


class UploadResponse(BaseModel):
    doc_id: str
    name: str
    chunks: int
    message: str
