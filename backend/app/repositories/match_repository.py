from supabase import Client
from app.core.exceptions import AppException

class MatchRepository:
    def __init__(self, db: Client):
        self.db = db

    def create_job(self, data: dict):
        response = self.db.table("job_descriptions").insert(data).execute()
        if not response.data:
            raise AppException(status_code=500, message="Failed to save job description")
        return response.data[0]

    def create_match(self, data: dict):
        response = self.db.table("matches").insert(data).execute()
        if not response.data:
            raise AppException(status_code=500, message="Failed to save match")
        return response.data[0]

    def get_all_matches(self):
        # Fetch matches
        match_resp = self.db.table("matches").select("*").execute()
        if not match_resp.data:
            return []
        
        matches = match_resp.data
        
        # Fetch related jobs and resumes efficiently
        job_ids = list({m.get("jd_id") for m in matches if m.get("jd_id")})
        resume_ids = list({m.get("resume_id") for m in matches if m.get("resume_id")})

        jobs_dict = {}
        if job_ids:
            jobs_resp = self.db.table("job_descriptions").select("*").in_("id", job_ids).execute()
            jobs_dict = {j["id"]: j for j in jobs_resp.data or []}

        resumes_dict = {}
        if resume_ids:
            resumes_resp = self.db.table("resumes").select("*").in_("id", resume_ids).execute()
            resumes_dict = {r["id"]: r for r in resumes_resp.data or []}

        results = []
        for m in matches:
            job = jobs_dict.get(m.get("jd_id"))
            resume = resumes_dict.get(m.get("resume_id"))
            results.append({
                "id": m["id"],
                "jd_text": job.get("description") if job else "",
                "jd_skills": job.get("skills", []) if job else [],
                "match_score": m.get("match_score"),
                "missing_skills": m.get("missing_skills", []),
                "resume_filename": resume.get("filename") if resume else None,
                "created_at": m.get("created_at"),
            })
            
        return results

    def delete_match(self, match_id: int):
        response = self.db.table("matches").delete().eq("id", match_id).execute()
        return response.data

    def get_match_by_id(self, match_id: int):
        response = self.db.table("matches").select("id").eq("id", match_id).execute()
        if not response.data:
            return None
        return response.data[0]

    def get_stats(self):
        match_res = self.db.table("matches").select("match_score", count="exact").execute()
        total_matches = match_res.count if match_res.count is not None else len(match_res.data)
        
        avg_score = 0.0
        success_rate = 0.0
        
        if match_res.data and total_matches > 0:
            scores = [m["match_score"] for m in match_res.data if m.get("match_score") is not None]
            if scores:
                avg_score = float(f"{sum(scores) / len(scores):.1f}")
                success_count = sum(1 for s in scores if s >= 70)
                success_rate = float(f"{(success_count / len(scores)) * 100:.1f}")
                
        return {
            "total_matches": total_matches,
            "avg_score": avg_score,
            "success_rate": success_rate
        }

    def get_match_detail(self, match_id: int):
        """Fetch a single match with its job description and resume data."""
        match_resp = self.db.table("matches").select("*").eq("id", match_id).execute()
        if not match_resp.data:
            return None

        m = match_resp.data[0]

        job = None
        if m.get("jd_id"):
            jd_resp = self.db.table("job_descriptions").select("*").eq("id", m["jd_id"]).execute()
            if jd_resp.data:
                job = jd_resp.data[0]

        resume = None
        if m.get("resume_id"):
            res_resp = self.db.table("resumes").select("id,filename,skills").eq("id", m["resume_id"]).execute()
            if res_resp.data:
                resume = res_resp.data[0]

        return {
            "id": m["id"],
            "jd_text": job.get("description", "") if job else "",
            "jd_skills": job.get("skills", []) if job else [],
            "match_score": m.get("match_score", 0),
            "missing_skills": m.get("missing_skills", []),
            "resume_filename": resume.get("filename") if resume else None,
            "resume_skills": resume.get("skills", []) if resume else [],
            "created_at": m.get("created_at"),
        }

