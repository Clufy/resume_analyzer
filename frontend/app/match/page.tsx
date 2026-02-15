"use client";

import React, { useState, useEffect } from "react";
import { type JobMatchResponse, getResumes, getResumeById, type Resume, getAnalysis, type AnalysisResponse } from "@/lib/api";
import { useResume } from "@/context/resume_context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loader2, CheckCircle2, AlertCircle, Briefcase, FileText, ArrowRight, Sparkles, XCircle, Upload, Bot, ThumbsUp, ThumbsDown, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";

function getScoreLabel(score: number) {
  if (score >= 80) return { text: "Excellent Match", color: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 60) return { text: "Good Fit", color: "text-amber-600 dark:text-amber-400" };
  return { text: "Needs Improvement", color: "text-red-600 dark:text-red-400" };
}

export default function MatchPage() {
  const { resume, setResume } = useResume();
  const [jd, setJD] = useState<string>("");
  const [result, setResult] = useState<JobMatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New state for resume picker
  const [resumesList, setResumesList] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingResume, setLoadingResume] = useState(false);

  // AI Analysis state
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchList = async () => {
      try {
        const list = await getResumes();
        setResumesList(list);
      } catch (err) {
        console.error("Failed to fetch resumes list", err);
      } finally {
        setLoadingResumes(false);
      }
    };
    fetchList();
  }, []);

  const handleMatch = async () => {
    if (!resume) {
      setError("Please upload a resume first.");
      return;
    }
    if (!jd.trim()) {
      setError("Please enter a job description.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await import("@/lib/api").then(m => m.createMatch(resume.id, jd));

      setResult(data);
    } catch (err) {
      console.error("Match error:", err);
      setError(err instanceof Error ? err.message : "Failed to match resume. Please try again.");
    } finally {
      setLoading(false);
      setLoading(false);
    }
  };

  const handleAnalysis = async () => {
    if (!resume) return;
    setLoadingAnalysis(true);
    try {
      const data = await getAnalysis(resume.id, jd);
      setAnalysis(data);
    } catch (err) {
      console.error("Analysis error:", err);
      // We don't block the UI, just maybe show a toast or log it
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const scoreLabel = result ? getScoreLabel(result.match_score) : null;

  return (
    <div className="container mx-auto py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Job <span className="gradient-text">Match Analysis</span>
        </h1>
        <p className="text-muted-foreground">
          Compare your resume against a job description to see how well you match.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        <div className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Selected Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingResumes ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="resume-select" className="text-sm font-medium text-muted-foreground">Select from uploaded resumes</label>
                    <select
                      id="resume-select"
                      className="w-full p-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                      onChange={async (e) => {
                        const id = Number(e.target.value);
                        if (id) {
                          setLoadingResume(true);
                          try {
                            const params = await getResumeById(id);
                            setResume(params);
                          } catch (err) {
                            console.error("Failed to fetch resume", err);
                            setError("Failed to load selected resume");
                          } finally {
                            setLoadingResume(false);
                          }
                        }
                      }}
                      value={resume?.id || ""}
                    >
                      <option value="" disabled>Select a resume...</option>
                      {resumesList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.filename} ({new Date(r.created_at || "").toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or upload new</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => router.push("/upload")}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New Resume
                  </Button>

                  {resume && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-3 animate-fade-in">
                      <div className="p-2 bg-primary/10 rounded-full text-primary mt-0.5">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-medium truncate text-sm">{resume.filename}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {resume.skills.slice(0, 3).map(s => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 bg-background rounded-full border text-muted-foreground">
                              {s}
                            </span>
                          ))}
                          {resume.skills.length > 3 && (
                            <span className="text-[10px] text-muted-foreground self-center">+{resume.skills.length - 3}</span>
                          )}
                        </div>
                      </div>
                      {loadingResume && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Job Description
              </CardTitle>
              <CardDescription>Paste the job description here.</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[300px] p-4 text-sm rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-y transition-all duration-200"
                placeholder="Paste job description..."
                value={jd}
                onChange={(e) => setJD(e.target.value)}
              />
              {error && (
                <div className="mt-4 bg-red-500/10 text-red-700 dark:text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm animate-scale-in border border-red-500/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <Button
                className="w-full mt-4"
                onClick={handleMatch}
                disabled={loading || !resume || !jd.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Run Analysis <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>


        <div className="space-y-6">
          {result ? (
            <Card className="border-primary/20 shadow-lg animate-scale-in">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Match Results
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">

                {/* Score Circle */}
                <div className="text-center">
                  <div className="relative inline-flex flex-col items-center justify-center">
                    <svg className="w-36 h-36 transform -rotate-90">
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={result.match_score >= 60 ? "#10b981" : "#ef4444"} />
                          <stop offset="100%" stopColor={result.match_score >= 80 ? "#06b6d4" : result.match_score >= 60 ? "#f59e0b" : "#f87171"} />
                        </linearGradient>
                      </defs>
                      <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-muted/50" />
                      <circle cx="72" cy="72" r="60" stroke="url(#scoreGradient)" strokeWidth="10" fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={376.99}
                        strokeDashoffset={376.99 - (result.match_score / 100) * 376.99}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <span className="text-3xl font-bold">{result.match_score}%</span>
                    </div>
                  </div>
                  {scoreLabel && (
                    <p className={`text-sm font-semibold mt-3 ${scoreLabel.color}`}>{scoreLabel.text}</p>
                  )}
                </div>

                {/* Matched Skills */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Matched Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.jd_skills.filter(s => !result.missing_skills.includes(s)).map(skill => (
                      <Badge key={skill} variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {skill}
                      </Badge>
                    ))}
                    {result.jd_skills.filter(s => !result.missing_skills.includes(s)).length === 0 && (
                      <span className="text-sm text-muted-foreground italic">No matching skills found.</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-700 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    Missing Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missing_skills.map(skill => (
                      <Badge key={skill} variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        {skill}
                      </Badge>
                    ))}
                    {result.missing_skills.length === 0 && (
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        No missing skills!
                      </span>
                    )}
                  </div>
                </div>


                {/* AI Analysis Section */}
                <div className="pt-6 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Bot className="h-4 w-4 text-indigo-500" />
                      AI Coach Insight
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAnalysis}
                      disabled={loadingAnalysis}
                      className="border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                    >
                      {loadingAnalysis ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-3 w-3" />
                          {analysis ? "Refresh Analysis" : "Get Detailed Feedback"}
                        </>
                      )}
                    </Button>
                  </div>

                  {analysis && (
                    <div className="space-y-4 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 animate-fade-in">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="text-sm text-foreground italic border-l-2 border-indigo-300 pl-3 mb-4">
                          {analysis.summary}
                        </p>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-2">
                              <ThumbsUp className="h-3 w-3" /> Strengths
                            </h4>
                            <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                              {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>

                          <div>
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-amber-600 dark:text-amber-400 mb-2">
                              <ThumbsDown className="h-3 w-3" /> Weaknesses
                            </h4>
                            <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                              {analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-indigo-200/30">
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-2">
                            <Lightbulb className="h-3 w-3" /> Improvement Plan
                          </h4>
                          <ul className="space-y-2">
                            {analysis.suggestions.map((s, i) => (
                              <li key={i} className="text-sm flex gap-2 items-start">
                                <span className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="text-muted-foreground">{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-8 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/5">
              <div className="text-center space-y-3">
                <div className="p-4 bg-muted/50 rounded-full inline-block mb-2">
                  <Briefcase className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <p className="font-medium">Ready to Analyze</p>
                <p className="text-sm max-w-xs mx-auto">
                  Upload a resume and paste a job description to see specific skill gaps and match scoring.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
