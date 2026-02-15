"""Pytest configuration and fixtures."""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    """Test client for API testing."""
    return TestClient(app)


@pytest.fixture
def sample_resume_data():
    """Sample resume data for testing."""
    return {
        "id": 1,
        "filename": "test_resume.pdf",
        "text": "Software Engineer with 5 years experience in Python and FastAPI",
        "skills": ["Python", "FastAPI", "Docker"],
        "education": ["BS Computer Science"],
        "experience": ["Senior Developer at TechCorp"],
    }


@pytest.fixture
def sample_job_description():
    """Sample job description for testing."""
    return {"description": "Looking for a Python developer with FastAPI experience"}
