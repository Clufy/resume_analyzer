from app.repositories.match_repository import MatchRepository
from app.repositories.resume_repository import ResumeRepository
from app.services import parser
from app.services.llm import analyze_resume
from app.core.exceptions import AppException

class MatchService:
    def __init__(self, match_repo: MatchRepository, resume_repo: ResumeRepository):
        self.match_repo = match_repo
        self.resume_repo = resume_repo

    async def create_match(self, resume_id: int, jd_text: str):
        # Verify resume exists
        resume = self.resume_repo.get_by_id(resume_id)
        if not resume:
            raise AppException(status_code=404, message="Resume not found")

        # Process JD
        jd_entities = parser.extract_entities(jd_text)
        
        # Calculate Match
        match_score, missing = parser.calculate_match(
            resume_text=resume["text"],
            resume_skills=resume.get("skills", []),
            jd_text=jd_text,
            jd_skills=jd_entities.get("skills", [])
        )

        # Save JD
        job = self.match_repo.create_job({
            "description": jd_text,
            "skills": jd_entities.get("skills", [])
        })

        # Save Match
        match_data = {
            "resume_id": resume["id"],
            "jd_id": job["id"],
            "match_score": match_score,
            "missing_skills": missing
        }
        
        return self.match_repo.create_match(match_data), job, jd_entities

    async def analyze_resume(self, resume_id: int, job_description: str = None):
        resume = self.resume_repo.get_by_id(resume_id)
        if not resume:
            raise AppException(status_code=404, message="Resume not found")
            
        return await analyze_resume(resume["text"], job_description)

    def list_matches(self):
        return self.match_repo.get_all_matches()

    def delete_match(self, match_id: int):
        if not self.match_repo.get_match_by_id(match_id):
            raise AppException(status_code=404, message="Match not found")
        return self.match_repo.delete_match(match_id)

    def get_stats(self):
        return self.match_repo.get_stats()
