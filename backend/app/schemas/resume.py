

from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class ResumeParseResponse(BaseModel):

    id: int
    filename: str
    text: str
    skills: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)
    experience: list[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ResumeListItem(BaseModel):

    id: int
    filename: str
    skills: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)
    experience: list[str] = Field(default_factory=list)
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class JobDescriptionRequest(BaseModel):

    description: str = Field(..., min_length=10, max_length=10000)

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Job description cannot be empty or whitespace")
        return v.strip()


class JobMatchResponse(BaseModel):

    jd_text: str
    jd_skills: list[str] = Field(default_factory=list)
    match_score: float = Field(..., ge=0.0, le=100.0)
    missing_skills: list[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class MatchListItem(BaseModel):

    id: int
    jd_text: str
    jd_skills: list[str] = Field(default_factory=list)
    match_score: float
    missing_skills: list[str] = Field(default_factory=list)
    resume_filename: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class AnalysisResponse(BaseModel):
    summary: str
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    keywords_to_add: list[str] = Field(default_factory=list)
    score: int
    match_percentage: int | None = None
    error: str | None = None


class AnalyzeRequest(BaseModel):
    resume_id: int = Field(..., gt=0)
    job_description: str | None = Field(
        default=None,
        min_length=10,
        max_length=5000,
        description="Optional job description to compare the resume against (max 5000 chars)",
    )

    @field_validator("job_description")
    @classmethod
    def sanitize_job_description(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        return v

class MatchRequest(BaseModel):
    resume_id: int
    job_description: str = Field(..., min_length=10, max_length=10000)

    @field_validator("job_description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Job description cannot be empty or whitespace")
        return v.strip()
