"""Comprehensive API verification tests."""

import os
import sys
from pathlib import Path

# Add backend directory to python path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest

from main import app

# Create a dummy PDF for testing
TEST_PDF_PATH = "test_resume.pdf"

@pytest.fixture(scope="module")
def pdf_file():
    """Create a dummy PDF file."""
    if not os.path.exists(TEST_PDF_PATH):
        import fitz
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 50), "John Doe\nPython Developer\nSkills: Python, FastAPI, Docker")
        doc.save(TEST_PDF_PATH)
        doc.close()
    yield TEST_PDF_PATH
    if os.path.exists(TEST_PDF_PATH):
        os.remove(TEST_PDF_PATH)

from unittest.mock import MagicMock

from app.database.database import get_db

# ... (fixture) ...

@pytest.fixture
def mock_db():
    """Mock the Supabase client."""
    mock_client = MagicMock()
    
    # Mock insert response for upload
    mock_client.table.return_value.insert.return_value.execute.return_value.data = [{
        "id": 123,
        "filename": "test_resume.pdf",
        "text": "John Doe Python Developer",
        "skills": ["Python"],
        "education": [],
        "experience": [],
        "created_at": "2023-10-27T10:00:00Z"
    }]

    # Mock insert response for job description
    # Mock insert response for match
    
    # We need to handle different tables being called.
    # It's a bit complex with MagicMock.
    
    def side_effect(table_name):
        table_mock = MagicMock()
        if table_name == "resumes":
            table_mock.insert.return_value.execute.return_value.data = [{
                "id": 123,
                "filename": "test_resume.pdf",
                "text": "John Doe Python Developer",
                "skills": ["Python"],
                "education": [],
                "experience": [],
                "created_at": "2023-10-27T10:00:00Z"
            }]
            table_mock.select.return_value.range.return_value.execute.return_value.data = [{
                 "id": 123,
                 "filename": "test_resume.pdf",
                 "skills": ["Python"],
                 "created_at": "2023-10-27T10:00:00Z"
            }]
            table_mock.select.return_value.in_.return_value.execute.return_value.data = [{
                 "id": 123,
                 "filename": "test_resume.pdf"
            }]
            table_mock.select.return_value.order.return_value.limit.return_value.execute.return_value.data = [{
                 "id": 123
            }]

        elif table_name == "job_descriptions":
            table_mock.insert.return_value.execute.return_value.data = [{
                "id": 456,
                "description": "Python Developer",
                "skills": ["Python"]
            }]
            table_mock.select.return_value.in_.return_value.execute.return_value.data = [{
                "id": 456,
                "description": "Python Developer",
                "skills": ["Python"]
            }]

        elif table_name == "matches":
            table_mock.insert.return_value.execute.return_value.data = [{
                "id": 789,
                "match_score": 85.0,
                "missing_skills": []
            }]
            table_mock.select.return_value.execute.return_value.data = [{
                "id": 789,
                "match_score": 85.0,
                "jd_id": 456,
                "resume_id": 123,
                "created_at": "2023-10-27T10:00:00Z"
            }]
        
        return table_mock

    mock_client.table.side_effect = side_effect
    return mock_client


def test_full_flow(client, pdf_file, mock_db):
    """Test the full flow: Upload -> Match -> List."""
    
    # Override dependency
    app.dependency_overrides[get_db] = lambda: mock_db

    # 1. Upload Resume
    with open(pdf_file, "rb") as f:
        resp = client.post(
            "/resume/upload",
            files={"file": (os.path.basename(pdf_file), f, "application/pdf")}
        )

    assert resp.status_code == 200
    resume_data = resp.json()
    assert resume_data["filename"] == os.path.basename(pdf_file)
    assert "Python" in resume_data["skills"]
    resume_id = resume_data["id"]

    # 2. Match Job Description
    jd_payload = {
        "description": "We need a Python Developer with FastAPI and Docker skills."
    }
    # Pass response from upload as resume
    match_resp = client.post(
        "/resume/match",
        json={
            "resume": resume_data,
            "jd": jd_payload
        }
    )
    assert match_resp.status_code == 200
    match_data = match_resp.json()
    assert match_data["match_score"] > 50
    assert "Python" in match_data["jd_skills"]

    # 3. List Resumes
    list_resp = client.get("/resume/resumes")
    assert list_resp.status_code == 200
    resumes = list_resp.json()
    assert len(resumes) > 0
    assert any(r["id"] == resume_id for r in resumes)

    # 4. List Matches
    matches_resp = client.get("/resume/matches")
    assert matches_resp.status_code == 200
    matches = matches_resp.json()
    assert len(matches) > 0
