"""Supabase Storage service for resume file uploads."""

import logging
from uuid import uuid4

from app.database.database import supabase
from app.core.config import settings

logger = logging.getLogger(__name__)

BUCKET_NAME = settings.supabase_storage_bucket


def upload_file(file_bytes: bytes, filename: str) -> str:
    """
    Upload a file to Supabase Storage and return the public URL.

    Args:
        file_bytes: Raw bytes of the file to upload.
        filename: Original filename (used to preserve extension).

    Returns:
        Public URL of the uploaded file.
    """
    # Generate a unique storage path to avoid collisions
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    storage_path = f"{uuid4().hex}.{ext}"

    try:
        supabase.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": _guess_content_type(ext)},
        )
    except Exception as e:
        safe_name = filename.replace("\n", "_").replace("\r", "_")
        logger.error(f"Storage upload failed for {safe_name}: {e}")
        raise RuntimeError(f"Failed to upload file to storage: {e}") from e

    # Build the public URL
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)
    safe_name = filename.replace("\n", "_").replace("\r", "_")
    logger.info(f"Uploaded {safe_name} → {public_url}")
    return public_url


def get_file_url(storage_path: str) -> str:
    """Return the public URL for a file already in storage."""
    return supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)


def _guess_content_type(ext: str) -> str:
    """Map common file extensions to MIME types."""
    return {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }.get(ext.lower(), "application/octet-stream")
