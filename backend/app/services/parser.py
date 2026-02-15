import docx
import fitz  # PyMuPDF
import spacy
from sentence_transformers import SentenceTransformer, util

from app.core.config import settings


nlp = spacy.load(settings.spacy_model)


embedding_model = SentenceTransformer(settings.embedding_model)


SKILL_KEYWORDS = [
    "Python",
    "JavaScript",
    "TypeScript",
    "Flutter",
    "Kotlin",
    "Dart",
    "React",
    "Node.js",
    "Django",
    "FastAPI",
    "Azure",
    "Firebase",
    "SQL",
    "PostgreSQL",
    "MongoDB",
    "REST API",
    "Git",
    "Docker",
    "Kubernetes",
    "CI/CD",
    "HTML",
    "CSS",
    "ETL",
    "TensorFlow",
]

EDUCATION_KEYWORDS = [
    "BSc",
    "MSc",
    "Bachelor",
    "Master",
    "PhD",
    "BS",
    "MS",
    "MBA",
    "BE",
    "ME",
    "Diploma",
]

ROLE_SKILL_MAP = {
    "full-stack": [
        "React",
        "Angular",
        "Vue",
        "Node.js",
        "Express",
        "Django",
        "FastAPI",
        "SQL",
        "PostgreSQL",
        "MongoDB",
        "REST API",
        "GraphQL",
        "Git",
        "Docker",
        "CI/CD",
        "HTML",
        "CSS",
        "TypeScript",
        "JavaScript",
    ],
    "frontend": [
        "React",
        "Angular",
        "Vue",
        "JavaScript",
        "TypeScript",
        "CSS",
        "HTML",
        "Tailwind",
        "SASS",
        "Responsive Design",
        "UI/UX",
    ],
    "backend": [
        "Python",
        "Java",
        "Node.js",
        "Django",
        "FastAPI",
        "Spring",
        "SQL",
        "PostgreSQL",
        "MongoDB",
        "REST API",
        "GraphQL",
        "Docker",
        "Redis",
    ],
    "devops": [
        "Docker",
        "Kubernetes",
        "Terraform",
        "CI/CD",
        "Azure",
        "AWS",
        "GCP",
        "Jenkins",
        "GitLab CI",
        "Prometheus",
        "Monitoring",
        "Linux",
    ],
    "data engineer": [
        "Python",
        "SQL",
        "PostgreSQL",
        "MongoDB",
        "ETL",
        "Airflow",
        "TensorFlow",
        "PyTorch",
        "scikit-learn",
        "Spark",
        "Hadoop",
        "Data Warehousing",
        "AWS S3",
        "GCP BigQuery",
    ],
    "data scientist": [
        "Python",
        "R",
        "Pandas",
        "NumPy",
        "SciPy",
        "Scikit-learn",
        "TensorFlow",
        "PyTorch",
        "Matplotlib",
        "Seaborn",
        "Machine Learning",
        "Deep Learning",
        "NLP",
        "Data Analysis",
    ],
    "cloud": [
        "Azure",
        "AWS",
        "GCP",
        "Docker",
        "Kubernetes",
        "Terraform",
        "Serverless",
        "Lambda",
        "CloudFormation",
        "CI/CD",
    ],
    "mobile": [
        "Flutter",
        "Kotlin",
        "Swift",
        "Dart",
        "React Native",
        "Android",
        "iOS",
        "Firebase",
        "REST API",
        "GraphQL",
        "Git",
    ],
    "qa": [
        "Selenium",
        "Postman",
        "JMeter",
        "Cypress",
        "Python",
        "Java",
        "Automation Testing",
        "Unit Testing",
        "Integration Testing",
        "Git",
    ],
}



def extract_text(file_path: str) -> str:
    """Extract text from PDF or DOCX file."""
    if file_path.endswith(".pdf"):
        text = ""
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        return text
    elif file_path.endswith(".docx"):
        doc = docx.Document(file_path)
        return "\n".join([p.text for p in doc.paragraphs])
    else:
        raise ValueError("Unsupported file type, only PDF or DOCX allowed")



def extract_entities(text: str) -> dict:
    doc = nlp(text)
    skills, education, experience = set(), set(), set()
    text_lower = text.lower()

    # Extract experience & education from NLP entities
    for ent in doc.ents:
        if ent.label_ in ["ORG", "WORK_OF_ART"]:
            experience.add(ent.text)
        elif ent.label_ in ["FAC", "GPE"]:
            education.add(ent.text)

    skills.update([kw for kw in SKILL_KEYWORDS if kw.lower() in text_lower])
    education.update([kw for kw in EDUCATION_KEYWORDS if kw.lower() in text_lower])

    # Implied skills from role mentions
    for role, implied_skills in ROLE_SKILL_MAP.items():
        if role in text_lower:
            skills.update(implied_skills)

    skills.update(extract_semantic_skills(text, SKILL_KEYWORDS))

    return {
        "skills": list(skills),
        "education": list(education),
        "experience": list(experience),
    }



def extract_semantic_skills(text: str, skill_list: list, threshold: float = 0.5) -> set:
    """
    Optimized: Returns skills that are semantically present in the text.
    Uses batch encoding and avoids re-encoding in the loop.
    """
    import re
    import torch

    # Split into meaningful sentences/segments
    text_segments = [s.strip() for s in re.split(r"[.\n]", text) if len(s.strip()) > 10]
    if not text_segments:
        return set()

    detected_skills = set()

    # Batch encode everything at once
    segment_embs = embedding_model.encode(text_segments, convert_to_tensor=True, show_progress_bar=False)
    skill_embs = embedding_model.encode(skill_list, convert_to_tensor=True, show_progress_bar=False)

    # Calculate all similarities at once: (num_segments, num_skills)
    cos_sim_matrix = util.cos_sim(segment_embs, skill_embs)

    # For each skill, check if it matches ANY segment above the threshold
    for skill_idx, skill_name in enumerate(skill_list):
        max_sim = torch.max(cos_sim_matrix[:, skill_idx]).item()
        if max_sim >= threshold:
            detected_skills.add(skill_name)

    return detected_skills



def get_embeddings(text: str):
    emb = embedding_model.encode(text, convert_to_tensor=True, show_progress_bar=False)
    return emb.tolist()



def calculate_match(resume_text: str, resume_skills: list, jd_text: str, jd_skills: list):
    """
    Calculate similarity score and identify missing skills.

    Uses a two-pass approach:
    1. Exact match (case-insensitive) — fast and reliable
    2. Semantic similarity — catches synonyms and related terms
    """
    resume_emb = embedding_model.encode(resume_text, convert_to_tensor=True, show_progress_bar=False)
    jd_emb = embedding_model.encode(jd_text, convert_to_tensor=True, show_progress_bar=False)

    similarity_score = util.cos_sim(resume_emb, jd_emb).item()

    missing = []
    if jd_skills:
        # Lowercase sets for fast exact matching
        resume_text_lower = resume_text.lower()
        resume_skills_lower = {s.lower() for s in resume_skills}

        # Separate skills into "found by exact match" and "needs semantic check"
        needs_semantic_check = []
        for jd_skill in jd_skills:
            jd_lower = jd_skill.lower()
            if jd_lower in resume_skills_lower or jd_lower in resume_text_lower:
                continue  # Skill is clearly present
            needs_semantic_check.append(jd_skill)

        # Semantic check for skills not found by exact match
        if needs_semantic_check:
            jd_skill_embs = embedding_model.encode(
                needs_semantic_check, convert_to_tensor=True, show_progress_bar=False
            )

            resume_skill_embs = None
            if resume_skills:
                resume_skill_embs = embedding_model.encode(
                    resume_skills, convert_to_tensor=True, show_progress_bar=False
                )

            for i, jd_skill in enumerate(needs_semantic_check):
                jd_skill_emb = jd_skill_embs[i:i+1]

                # Check similarity to resume text
                sim_to_text = util.cos_sim(jd_skill_emb, resume_emb).item()

                # Check similarity to existing resume skills
                sim_to_skills = 0.0
                if resume_skill_embs is not None:
                    sim_to_skills = util.cos_sim(jd_skill_emb, resume_skill_embs).max().item()

                # If both similarities are low, the skill is missing
                if sim_to_text < 0.65 and sim_to_skills < 0.7:
                    missing.append(jd_skill)

    return round(similarity_score * 100, 2), missing

