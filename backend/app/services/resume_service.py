import os
import tempfile
import logging
from typing import cast
from fastapi import UploadFile, HTTPException

from app.core.config import settings
from app.services import parser
from app.services.storage import upload_file as storage_upload
from app.repositories.resume_repository import ResumeRepository
from app.core.exceptions import AppException

logger = logging.getLogger(__name__)

ALLOWED_MIMES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

class ResumeService:
    def __init__(self, repository: ResumeRepository):
        self.repository = repository

    async def process_upload(self, file: UploadFile):
        if not file.filename:
             raise AppException(status_code=400, message="Filename is missing")

        if not file.filename.lower().endswith((".pdf", ".docx")):
            raise AppException(status_code=400, message="Only PDF or DOCX files allowed")

        if file.content_type not in ALLOWED_MIMES:
             raise AppException(status_code=400, message="Invalid file type")

        file_bytes = await file.read()
        max_size = settings.max_upload_size_mb * 1024 * 1024
        if len(file_bytes) > max_size:
             raise AppException(status_code=413, message=f"File too large. Maximum size is {settings.max_upload_size_mb}MB")

        # Storage Upload
        file_url = None
        try:
            file_url = storage_upload(file_bytes, file.filename)
        except RuntimeError as e:
            logger.warning(f"Storage upload failed: {e}")

        # Processing
        ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin"
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}", mode="wb") as tmp:
            tmp.write(cast(bytes, file_bytes))
            tmp_path = tmp.name

        try:
            text = parser.extract_text(tmp_path)
        finally:
            os.unlink(tmp_path)

        entities = parser.extract_entities(text)
        embeddings = parser.get_embeddings(text)

        resume_data = {
            "filename": file.filename,
            "text": text,
            "skills": entities.get("skills", []),
            "education": entities.get("education", []),
            "experience": entities.get("experience", []),
            "embeddings": embeddings,
            "file_url": file_url,
        }

        return self.repository.create(resume_data)

    def get_resume(self, resume_id: int):
        resume = self.repository.get_by_id(resume_id)
        if not resume:
            raise AppException(status_code=404, message="Resume not found")
        return resume

    def list_resumes(self, limit: int, offset: int):
        return self.repository.get_all(limit, offset)

    def delete_resume(self, resume_id: int):
        if not self.repository.get_by_id(resume_id):
            raise AppException(status_code=404, message="Resume not found")
        return self.repository.delete(resume_id)
    
    def get_count(self):
        return self.repository.count()
