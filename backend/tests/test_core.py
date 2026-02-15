"""Test core utilities."""

from app.core.security import generate_secure_filename, validate_file_size


def test_generate_secure_filename():
    """Test secure filename generation."""
    filename = generate_secure_filename("my resume.pdf")
    assert filename.endswith(".pdf")
    assert " " not in filename
    assert len(filename) > len("my_resume.pdf")


def test_validate_file_size():
    """Test file size validation."""
    # 5MB should pass with 10MB limit
    assert validate_file_size(5 * 1024 * 1024, max_size_mb=10) is True

    # 15MB should fail with 10MB limit
    assert validate_file_size(15 * 1024 * 1024, max_size_mb=10) is False
