import logging
from fastapi import APIRouter, Depends, File, UploadFile, Request, Query
from app.database.database import get_db
from app.repositories.resume_repository import ResumeRepository
from app.services.resume_service import ResumeService
from app.schemas.resume import ResumeParseResponse
from app.core.rate_limit import limiter

router = APIRouter()

def get_service(db=Depends(get_db)) -> ResumeService:
    repo = ResumeRepository(db)
    return ResumeService(repo)

@router.post("/upload", response_model=ResumeParseResponse)
@limiter.limit("5/minute")
async def upload_resume(
    request: Request, 
    file: UploadFile = File(...), 
    service: ResumeService = Depends(get_service)
):
    return await service.process_upload(file)

@router.get("/resume/{resume_id}", response_model=ResumeParseResponse)
@limiter.limit("30/minute")
async def get_resume(
    request: Request, 
    resume_id: int, 
    service: ResumeService = Depends(get_service)
):
    return service.get_resume(resume_id)

@router.get("/resumes")
@limiter.limit("50/minute")
async def list_resumes(
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    service: ResumeService = Depends(get_service)
):
    # Map dictionary to response model later or return list of dicts. 
    # The existing schema for list items might need to be imported or we just return the raw dicts
    # The frontend expects certain fields.
    return service.list_resumes(limit, offset)

@router.delete("/resume/{resume_id}")
@limiter.limit("10/minute")
async def delete_resume(
    request: Request, 
    resume_id: int, 
    service: ResumeService = Depends(get_service)
):
    service.delete_resume(resume_id)
    return {"message": "Resume deleted successfully"}
