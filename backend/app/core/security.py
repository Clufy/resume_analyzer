"""Security utilities and middleware."""

import hashlib
import secrets
from datetime import datetime


def generate_file_hash(content: bytes) -> str:
    """Generate SHA256 hash of file content."""
    return hashlib.sha256(content).hexdigest()


def generate_secure_filename(original_filename: str) -> str:
    """Generate a secure filename with timestamp and random suffix."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    random_suffix = secrets.token_hex(4)
    extension = original_filename.rsplit(".", 1)[-1] if "." in original_filename else ""
    base_name = (
        original_filename.rsplit(".", 1)[0] if "." in original_filename else original_filename
    )

    # Sanitize base name
    safe_base = "".join(c for c in base_name if c.isalnum() or c in ("-", "_"))[:50]

    return f"{safe_base}_{timestamp}_{random_suffix}.{extension}"


def validate_file_size(file_size: int, max_size_mb: int = 10) -> bool:
    """Validate file size is within limits."""
    max_bytes = max_size_mb * 1024 * 1024
    return file_size <= max_bytes
