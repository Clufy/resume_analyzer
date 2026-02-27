import httpx
import logging

from app.schemas.resume import JobMatchResponse, ResumeParseResponse, AnalysisResponse, MatchRequest, AnalyzeRequest

from fastapi import APIRouter, Depends, Request, HTTPException
from app.database.database import get_db
from app.repositories.match_repository import MatchRepository
from app.repositories.resume_repository import ResumeRepository
from app.services.match_service import MatchService
from app.core.rate_limit import limiter
from app.core.auth import get_api_key
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(dependencies=[Depends(get_api_key)])

def get_service(db=Depends(get_db)) -> MatchService:
    match_repo = MatchRepository(db)
    resume_repo = ResumeRepository(db)
    return MatchService(match_repo, resume_repo)

@router.post("/match", response_model=JobMatchResponse)
@limiter.limit("5/minute")
async def match_resume_to_job(
    request: Request,
    body: MatchRequest,
    service: MatchService = Depends(get_service)
):
    match_data, job, jd_entities = await service.create_match(body.resume_id, body.job_description)
    
    return JobMatchResponse(
        jd_text=job["description"],
        jd_skills=jd_entities.get("skills", []),
        match_score=match_data["match_score"],
        missing_skills=match_data["missing_skills"],
    )

@router.get("/matches")
@limiter.limit("50/minute")
async def list_matches(
    request: Request,
    service: MatchService = Depends(get_service)
):
    return service.list_matches()

@router.get("/match/{match_id}")
@limiter.limit("30/minute")
async def get_match(
    request: Request,
    match_id: int,
    service: MatchService = Depends(get_service)
):
    """Retrieve a single match by ID for the detail view."""
    match = service.match_repo.get_match_detail(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@router.delete("/match/{match_id}")
@limiter.limit("10/minute")
async def delete_match(
    request: Request,
    match_id: int,
    service: MatchService = Depends(get_service)
):
    service.delete_match(match_id)
    return {"message": "Match deleted successfully"}

@router.get("/stats")
@limiter.limit("50/minute")
async def get_stats(
    request: Request,
    service: MatchService = Depends(get_service)
):
    return service.get_stats()

@router.post("/analyze")
@limiter.limit("5/minute")
async def analyze_resume_endpoint(
    request: Request,
    body: AnalyzeRequest,
    service: MatchService = Depends(get_service)
):
    """Analyze a resume using the local LLM, optionally compared against a job description."""
    return await service.analyze_resume(body.resume_id, body.job_description)


@router.get("/ollama/status")
@limiter.limit("20/minute")
async def ollama_status(request: Request):
    """Check if the Ollama LLM service is reachable."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.ollama_base_url}/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                return {
                    "status": "online",
                    "model": settings.ollama_model,
                    "available_models": models,
                }
    except (httpx.ConnectError, httpx.TimeoutException) as e:
        logger.info(f"Ollama is offline: {e}")

    return {
        "status": "offline",
        "model": settings.ollama_model,
        "available_models": [],
    }
