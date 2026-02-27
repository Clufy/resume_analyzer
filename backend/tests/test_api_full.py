"""Comprehensive API verification tests."""

import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

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


from app.database.database import get_db


@pytest.fixture
def mock_db():
    """Mock the Supabase client."""
    mock_client = MagicMock()

    def side_effect(table_name):
        table_mock = MagicMock()
        if table_name == "resumes":
            resume_record = {
                "id": 123,
                "filename": "test_resume.pdf",
                "text": "John Doe Python Developer",
                "skills": ["Python"],
                "education": [],
                "experience": [],
                "created_at": "2023-10-27T10:00:00Z",
            }
            table_mock.insert.return_value.execute.return_value.data = [resume_record]
            table_mock.select.return_value.range.return_value.execute.return_value.data = [resume_record]
            table_mock.select.return_value.in_.return_value.execute.return_value.data = [resume_record]
            table_mock.select.return_value.order.return_value.limit.return_value.execute.return_value.data = [resume_record]
            table_mock.select.return_value.eq.return_value.execute.return_value.data = [resume_record]
            # count() for resume_repo.count()
            table_mock.select.return_value.execute.return_value.count = 1
            table_mock.select.return_value.execute.return_value.data = [resume_record]
        elif table_name == "job_descriptions":
            jd_record = {"id": 456, "description": "Python Developer", "skills": ["Python"]}
            table_mock.insert.return_value.execute.return_value.data = [jd_record]
            table_mock.select.return_value.in_.return_value.execute.return_value.data = [jd_record]
        elif table_name == "matches":
            match_record = {
                "id": 789,
                "match_score": 85.0,
                "missing_skills": [],
                "jd_id": 456,
                "resume_id": 123,
                "created_at": "2023-10-27T10:00:00Z",
            }
            table_mock.insert.return_value.execute.return_value.data = [match_record]
            table_mock.select.return_value.execute.return_value.data = [match_record]
            # Properly mock count for get_stats()
            table_mock.select.return_value.execute.return_value.count = 1
        return table_mock

    mock_client.table.side_effect = side_effect
    return mock_client


# ─── Parser mock helpers ───────────────────────────────────────────────────────

MOCK_PARSER_TEXT = "John Doe Python Developer Skills: Python FastAPI Docker"
MOCK_ENTITIES = {"skills": ["Python", "FastAPI", "Docker"], "education": [], "experience": []}
MOCK_EMBEDDINGS = [0.1] * 384  # all-MiniLM-L6-v2 produces 384-dim embeddings


def test_full_flow(auth_client, pdf_file, mock_db):
    """Test the full flow: Upload -> Match -> List (parser is mocked to avoid heavy ML dep)."""

    # Override DB dependency
    app.dependency_overrides[get_db] = lambda: mock_db

    with (
        patch("app.services.parser.extract_text", return_value=MOCK_PARSER_TEXT),
        patch("app.services.parser.extract_entities", return_value=MOCK_ENTITIES),
        patch("app.services.parser.get_embeddings", return_value=MOCK_EMBEDDINGS),
        patch("app.services.storage.upload_file", return_value="https://example.com/file.pdf"),
    ):
        # 1. Upload Resume
        with open(pdf_file, "rb") as f:
            resp = auth_client.post(
                "/resume/upload",
                files={"file": (os.path.basename(pdf_file), f, "application/pdf")},
            )

    assert resp.status_code == 200, f"Upload failed: {resp.text}"
    resume_data = resp.json()
    assert resume_data["filename"] == os.path.basename(pdf_file)
    assert "Python" in resume_data["skills"]
    resume_id = resume_data["id"]

    with (
        patch("app.services.parser.extract_entities", return_value=MOCK_ENTITIES),
        patch(
            "app.services.parser.calculate_match",
            return_value=(85.0, []),
        ),
    ):
        # 2. Match Job Description
        match_resp = auth_client.post(
            "/resume/match",
            json={
                "resume_id": resume_id,
                "job_description": "We need a Python Developer with FastAPI and Docker skills.",
            },
        )

    assert match_resp.status_code == 200, f"Match failed: {match_resp.text}"
    match_data = match_resp.json()
    assert match_data["match_score"] > 50

    # 3. List Resumes
    list_resp = auth_client.get("/resume/resumes")
    assert list_resp.status_code == 200
    resumes = list_resp.json()
    assert len(resumes) > 0
    assert any(r["id"] == resume_id for r in resumes)

    # 4. List Matches
    matches_resp = auth_client.get("/resume/matches")
    assert matches_resp.status_code == 200

    # Clean up dependency override
    app.dependency_overrides.clear()
