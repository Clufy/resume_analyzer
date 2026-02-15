# Resume Analyzer - Backend

FastAPI backend for parsing resumes and matching them with job descriptions.

## 🛠️ Tech Stack

- **Framework**: FastAPI
- **Database**: Supabase (PostgreSQL)
- **NLP**: SpaCy, Sentence-Transformers (all-MiniLM-L6-v2)
- **Parsing**: PyMuPDF (PDF), python-docx (DOCX)
- **Linting**: Ruff
- **Testing**: Pytest

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env` file in `backend/`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
APP_ENV=development
```

### 2. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Run Server

```bash
uvicorn main:app --reload
```
Server running at `http://localhost:8000`.

## 🧪 Testing

Run unittests:
```bash
pytest
```

## 📦 Deployment

Optimized for containerized deployment (Dockerfile included).
Recommended: Render, Railway, or any Docker-compatible PaaS.
