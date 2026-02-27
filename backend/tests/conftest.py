"""Pytest configuration and fixtures."""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient

from main import app

# Read the API key from the environment (same source the app uses)
TEST_API_KEY = os.environ.get("API_KEY", "default_unsafe_dev_key")


@pytest.fixture
def client():
    """Unauthenticated test client (for testing auth-free or 403 scenarios)."""
    return TestClient(app)


@pytest.fixture
def auth_client():
    """Authenticated test client — sends X-API-Key on every request."""
    return TestClient(app, headers={"X-API-Key": TEST_API_KEY})


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
