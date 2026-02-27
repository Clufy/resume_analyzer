from supabase import Client
from app.core.exceptions import AppException

class ResumeRepository:
    def __init__(self, db: Client):
        self.db = db

    def create(self, data: dict):
        response = self.db.table("resumes").insert(data).execute()
        if not response.data:
            raise AppException(status_code=500, message="Failed to save resume", details="Empty response from DB")
        return response.data[0]

    def get_by_id(self, resume_id: int):
        # Exclude embeddings — they're large float arrays not needed for matching/analysis
        response = (
            self.db.table("resumes")
            .select("id, filename, text, skills, education, experience, created_at")
            .eq("id", resume_id)
            .limit(1)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def get_all(self, limit: int, offset: int):
        response = self.db.table("resumes").select("id, filename, skills, education, experience, created_at").range(offset, offset + limit - 1).execute()
        return response.data or []

    def delete(self, resume_id: int):
        self.db.table("matches").delete().eq("resume_id", resume_id).execute()
        response = self.db.table("resumes").delete().eq("id", resume_id).execute()
        return response.data

    def count(self):
        response = self.db.table("resumes").select("id", count="exact").execute()
        return response.count if response.count is not None else len(response.data)
