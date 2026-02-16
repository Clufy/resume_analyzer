from app.schemas.resume import JobMatchResponse, JobDescriptionRequest, ResumeParseResponse, AnalysisResponse, MatchRequest

from fastapi import APIRouter, Depends, Request, HTTPException
from app.database.database import get_db
from app.repositories.match_repository import MatchRepository
from app.repositories.resume_repository import ResumeRepository
from app.services.match_service import MatchService
from app.core.rate_limit import limiter
from app.core.auth import get_api_key

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
    # Resume count is in ResumeService, Match stats in MatchService?
    # Ideally we'd inject both or aggregate.
    # For now let's just use MatchService's ability to get match stats 
    # AND we need to get resume counts. 
    # Let's instantiate a ResumeRepository here locally or rely on service to have it.
    
    # MatchService has resume_repo, we can add a method there or just use it.
    # Let's use the underlying repos for this aggregation endpoint if needed, 
    # or better yet, add `get_total_resumes` to MatchService for simplicity given the tight coupling here.
    
    # Wait, `MatchRepository` doesn't know about generic resume counts unless we ask `ResumeRepository`.
    # `MatchService` has `self.resume_repo`.
    
    resume_count = service.resume_repo.count()
    match_stats = service.get_stats()
    
    return {
        "total_resumes": resume_count,
        **match_stats
    }

@router.post("/analyze")
@limiter.limit("5/minute")
async def analyze_resume_endpoint(
    request: Request,
    body: dict,
    service: MatchService = Depends(get_service)
):
    resume_id = body.get("resume_id")
    job_description = body.get("job_description")
    
    if not resume_id:
        raise HTTPException(status_code=400, detail="resume_id is required")
        
    return await service.analyze_resume(resume_id, job_description)
