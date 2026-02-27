import httpx
import logging
import json
import re
import asyncio
from app.core.config import settings

logger = logging.getLogger(__name__)

OLLAMA_API_URL = f"{settings.ollama_base_url}/api/generate"
DEFAULT_MODEL = settings.ollama_model


def _extract_json(text: str) -> str:
    """Clean and extract a JSON object from LLM text output."""
    text = text.strip()

    # Remove markdown fences if present
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        return match.group(1)

    # Find first { and last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        return text[start : end + 1]

    return text


async def analyze_resume(resume_text: str, job_description: str | None = None) -> dict:
    """
    Analyzes a resume using a local LLM via Ollama.
    Returns a dictionary with structured analysis including AI-generated insights.
    """

    prompt = f"""You are an expert AI Resume Coach and Career Advisor. Analyze the following resume.

RESUME TEXT:
{resume_text[:4000]}
"""

    if job_description:
        prompt += f"""
JOB DESCRIPTION:
{job_description[:2000]}

Task: Compare the resume against this job description and provide targeted feedback.
"""
    else:
        prompt += """
Task: Provide a comprehensive critique and improvement suggestions for this resume.
"""

    prompt += """
Respond with ONLY a valid JSON object using this exact structure:
{
    "summary": "A 2-3 sentence professional summary of the candidate's profile.",
    "strengths": ["3-5 specific strengths found in the resume"],
    "weaknesses": ["3-5 specific areas for improvement"],
    "suggestions": ["3-5 actionable steps to improve the resume"],
    "keywords_to_add": ["3-5 high-value keywords or technologies missing from the resume that would strengthen it"],
    "score": 75,
    "match_percentage": 80
}

Rules:
- "score" is an integer 0-100 rating the overall resume quality.
- "match_percentage" is an integer 0-100 rating how well the resume matches the job description. Set to null if no job description was provided.
- "keywords_to_add" are specific technical skills, certifications, or buzzwords the candidate should add.
- Return RAW JSON only — NO markdown code blocks, NO introductory text, NO explanations outside the JSON.
"""

    payload = {
        "model": DEFAULT_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }

    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(OLLAMA_API_URL, json=payload)

                if response.status_code == 200:
                    result = response.json()
                    generated_text = result.get("response", "")

                    if not generated_text:
                        raise ValueError("Empty response from LLM")

                    cleaned_text = _extract_json(generated_text)

                    try:
                        analysis = json.loads(cleaned_text)
                        # Ensure all expected fields have defaults
                        analysis.setdefault("keywords_to_add", [])
                        analysis.setdefault("match_percentage", None)
                        analysis.setdefault("strengths", [])
                        analysis.setdefault("weaknesses", [])
                        analysis.setdefault("suggestions", [])
                        return analysis
                    except json.JSONDecodeError as e:
                        logger.error(
                            f"Failed to parse LLM response. Raw: {generated_text[:200]}... Error: {e}"
                        )
                        return {
                            "summary": "Could not parse AI analysis. The model may have returned malformed output.",
                            "strengths": [],
                            "weaknesses": [],
                            "suggestions": ["Please try again. If the issue persists, ensure Ollama is running the correct model."],
                            "keywords_to_add": [],
                            "score": 0,
                            "match_percentage": None,
                        }

                elif response.status_code >= 500:
                    logger.warning(
                        f"Ollama returned {response.status_code}. Attempt {attempt + 1}/3."
                    )
                    await asyncio.sleep(2)
                    continue
                else:
                    logger.error(f"Ollama error {response.status_code}: {response.text}")
                    response.raise_for_status()

        except httpx.ConnectError:
            logger.error("Could not connect to Ollama. Is it running?")
            return {
                "error": "Ollama is not running. Please install Ollama and run 'ollama serve'.",
                "summary": "AI service unavailable.",
                "strengths": [],
                "weaknesses": [],
                "suggestions": [],
                "keywords_to_add": [],
                "score": 0,
                "match_percentage": None,
            }
        except Exception as e:
            logger.error(f"LLM Analysis failed attempt {attempt + 1}: {e}")
            if attempt == 2:
                return {
                    "error": f"Analysis failed after 3 attempts: {str(e)}",
                    "summary": "Analysis could not be completed.",
                    "strengths": [],
                    "weaknesses": [],
                    "suggestions": [],
                    "keywords_to_add": [],
                    "score": 0,
                    "match_percentage": None,
                }
