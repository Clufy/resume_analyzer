import os
import re
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

_UNSAFE_FILENAME_RE = re.compile(r'[\x00-\x1f\x7f/\\<>:"|?*]')

def _sanitize_filename(filename: str) -> str:
    """Strip path-traversal and control characters; cap length."""
    # Remove directory components
    filename = os.path.basename(filename)
    # Remove control chars and shell-special chars
    filename = _UNSAFE_FILENAME_RE.sub("_", filename)
    # Collapse multiple underscores/dots
    filename = re.sub(r'\.{2,}', '.', filename)
    # Limit total length
    return filename[:255]

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

        safe_filename = _sanitize_filename(file.filename)
        if not safe_filename:
            raise AppException(status_code=400, message="Invalid filename")

        if not safe_filename.lower().endswith((".pdf", ".docx")):
            raise AppException(status_code=400, message="Only PDF or DOCX files allowed")

        if file.content_type not in ALLOWED_MIMES:
             raise AppException(status_code=400, message="Invalid file type")

        file_bytes = await file.read()

        # Reject oversized files before expensive magic-byte check
        max_size = settings.max_upload_size_mb * 1024 * 1024
        if len(file_bytes) > max_size:
             raise AppException(status_code=413, message=f"File too large. Maximum size is {settings.max_upload_size_mb}MB")

        # Security: Validate magic bytes
        import filetype
        kind = filetype.guess(file_bytes)
        if kind is None or kind.mime not in ALLOWED_MIMES:
            raise AppException(status_code=400, message="Invalid file content (magic bytes mismatch)")

        # Storage Upload
        file_url = None
        try:
            file_url = storage_upload(file_bytes, safe_filename)
        except RuntimeError as e:
            logger.warning(f"Storage upload failed: {e}")

        # Processing
        ext = safe_filename.rsplit(".", 1)[-1] if "." in safe_filename else "bin"
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
            "filename": safe_filename,
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
