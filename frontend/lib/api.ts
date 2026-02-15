export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 2,
  retryDelay = 500
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");

  const fetchWithRetry = async (attempt: number): Promise<T> => {
    try {
      const isFormData = options.body instanceof FormData;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...(options.headers || {}),
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error: ${res.status} ${res.statusText} - ${text}`);
      }

      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return text as unknown as T;
      }
    } catch (err) {
      if (attempt < retries) {
        console.warn(`API call failed, retrying in ${retryDelay}ms...`, err);
        await new Promise((r) => setTimeout(r, retryDelay));
        return fetchWithRetry(attempt + 1);
      }
      console.error("API call failed after retries:", err);
      throw err;
    }
  };

  return fetchWithRetry(0);
}



export interface Resume {
  id: number;
  filename: string;
  skills: string[];
  education: string[];
  experience: string[];
  created_at?: string;
}

export interface Match {
  id: number;
  jd_text: string;
  jd_skills: string[];
  match_score: number;
  missing_skills: string[];
  resume_filename?: string;
  created_at?: string;
}

export interface ResumeResponse {
  id: number;
  filename: string;
  text: string;
  skills: string[];
  education: string[];
  experience: string[];
  embeddings: number[];
  created_at?: string;
}

export interface Stats {
  total_resumes: number;
  total_matches: number;
  avg_score: number;
  success_rate: number;
}

export const getStats = async (): Promise<Stats> => {
  return apiCall<Stats>("/resume/stats");
};

export const getResumes = async (): Promise<Resume[]> => {
  return apiCall<Resume[]>("/resume/resumes");
};

export const getResumeById = async (id: number): Promise<ResumeResponse> => {
  return apiCall<ResumeResponse>(`/resume/resume/${id}`);
};

export const getMatches = async (): Promise<Match[]> => {
  return apiCall<Match[]>("/resume/matches");
};


export interface JobDescriptionRequest {
  description: string;
}

export interface JobMatchResponse {
  jd_text: string;
  jd_skills: string[];
  match_score: number;
  missing_skills: string[];
}

export interface AnalysisResponse {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score: number;
  error?: string;
}

export interface MatchRequest {
  resume_id: number;
  job_description: string;
}

export const getAnalysis = async (resumeId: number, jd?: string): Promise<AnalysisResponse> => {
  return apiCall<AnalysisResponse>("/resume/analyze", {
    method: "POST",
    body: JSON.stringify({ resume_id: resumeId, job_description: jd }),
  });
};

export const createMatch = async (resumeId: number, jd: string): Promise<JobMatchResponse> => {
  return apiCall<JobMatchResponse>("/resume/match", {
    method: "POST",
    body: JSON.stringify({ resume_id: resumeId, job_description: jd }),
  });
};

export const deleteResume = async (id: number): Promise<{ message: string }> => {
  return apiCall<{ message: string }>(`/resume/resume/${id}`, {
    method: "DELETE",
  });
};

export const deleteMatch = async (id: number): Promise<{ message: string }> => {
  return apiCall<{ message: string }>(`/resume/match/${id}`, {
    method: "DELETE",
  });
};
