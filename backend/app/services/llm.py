import httpx
import logging
import json
from app.core.config import settings

logger = logging.getLogger(__name__)

OLLAMA_API_URL = f"{settings.ollama_base_url}/api/generate"
DEFAULT_MODEL = settings.ollama_model

async def analyze_resume(resume_text: str, job_description: str = None) -> dict:
    """
    Analyzes a resume using a local LLM via Ollama.
    Returns a dictionary with structured analysis.
    """
    
    prompt = f"""
    You are an expert AI Resume Coach. Analyze the following resume text.
    
    RESUME TEXT:
    {resume_text[:4000]}  # Truncate to avoid context window issues if needed
    
    """

    if job_description:
        prompt += f"""
        
        JOB DESCRIPTION:
        {job_description[:2000]}
        
        Task: Compare the resume against this job description.
        """
    else:
        prompt += """
        
        Task: Provide a general critique of this resume.
        """

    prompt += """
    
    Provide your response in strictly VALID JSON format with the following structure:
    {
        "summary": "A brief professional summary of the candidate (2-3 sentences).",
        "strengths": ["List of 3-5 key strengths"],
        "weaknesses": ["List of 3-5 areas for improvement"],
        "suggestions": ["List of 3-5 actionable tips to improve the resume"],
        "score": 75  // An integer score from 0-100 based on quality/match
    }
    
    IMPORTANT: 
    - Return RAW JSON only. 
    - Do NOT use markdown code blocks (no ```json ... ```).
    - Do NOT include any introductory or concluding text.
    """

    payload = {
        "model": DEFAULT_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }

    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(OLLAMA_API_URL, json=payload) # Changed OLLAMA_URL to OLLAMA_API_URL
                
                if response.status_code == 200:
                    result = response.json()
                    generated_text = result.get("response", "")
                    
                    if not generated_text:
                         raise ValueError("Empty response from LLM")
                    
                    
                    
                    # Helper to clean and extract JSON
                    def extract_json(text: str) -> str:
                        text = text.strip()
                        
                        # Remove markdown code blocks if present
                        import re
                        # Pattern to find JSON object structure {...}
                        # We use a greedy match on the braces if possible, or usually just strip fences
                        
                        # First try to strip markdown fences
                        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
                        if match:
                            return match.group(1)
                            
                        # If no fences, maybe it just has text around it?
                        # Find first { and last }
                        start = text.find("{")
                        end = text.rfind("}")
                        if start != -1 and end != -1:
                            return text[start:end+1]
                            
                        return text

                    cleaned_text = extract_json(generated_text)
                    
                    try:
                        analysis = json.loads(cleaned_text)
                        return analysis
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse LLM response. Raw: {generated_text[:100]}... Error: {e}")
                        return {
                            "summary": "Could not parse AI analysis.",
                            "strengths": [],
                            "weaknesses": [],
                            "suggestions": ["AI response format error. Please try again or check Ollama."],
                            "score": 0,
                            "raw_text": generated_text
                        }

                elif response.status_code >= 500:
                    logger.warning(f"Ollama returned {response.status_code}. Attempt {attempt+1}/3. Body: {response.text}")
                    import asyncio
                    await asyncio.sleep(2)
                    continue
                else:
                    logger.error(f"Ollama error {response.status_code}: {response.text}")
                    response.raise_for_status()

        except httpx.ConnectError:
            logger.error("Could not connect to Ollama. Is it running?")
            return {
                "error": "Ollama is not running. Please install Ollama and run 'ollama serve'."
            }
        except Exception as e:
            logger.error(f"LLM Analysis failed attempt {attempt+1}: {e}")
            if attempt == 2:
                return {
                    "error": f"Analysis failed: {str(e)}"
                }
