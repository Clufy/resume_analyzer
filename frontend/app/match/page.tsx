"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  type JobMatchResponse,
  getResumes,
  getResumeById,
  type Resume,
  getAnalysis,
  type AnalysisResponse,
} from "@/lib/api";
import { useResume } from "@/context/resume_context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";

// Defer recharts (~118 KB) — not needed on first paint and can't SSR
const MatchRadarChart = dynamic(
  () => import("@/components/ui/MatchRadarChart").then((m) => m.MatchRadarChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] w-full animate-pulse rounded-xl bg-muted/40" />
    ),
  }
);

import {
  Loader2, CheckCircle2, AlertCircle, Briefcase, FileText,
  ArrowRight, Sparkles, XCircle, Upload, Bot, ThumbsUp,
  ThumbsDown, Lightbulb, Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function MatchPage() {
  const { resume, setResume } = useResume();
  const [jd, setJD] = useState<string>("");
  const [result, setResult] = useState<JobMatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resumesList, setResumesList] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingResume, setLoadingResume] = useState(false);

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
        toast.error("Could not load resume list.");
      } finally {
        setLoadingResumes(false);
      }
    };
    fetchList();
  }, []);

  const handleMatch = async () => {
    if (!resume) {
      toast.warning("Please select or upload a resume first.");
      return;
    }
    if (!jd.trim()) {
      toast.warning("Please enter a job description.");
      return;
    }
    if (jd.trim().length > 5000) {
      toast.error("Job description is too long (max 5,000 characters).");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const data = await import("@/lib/api").then((m) =>
        m.createMatch(resume.id, jd)
      );
      setResult(data);
      toast.success("Analysis complete!");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to run analysis. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysis = async () => {
    if (!resume) return;
    setLoadingAnalysis(true);
    try {
      const data = await getAnalysis(resume.id, jd || undefined);
      setAnalysis(data);
      if (data.error) {
        toast.warning("AI analysis returned with an error — Ollama may be offline.");
      } else {
        toast.success("AI coaching complete!");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error("AI analysis failed. Is Ollama running?");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const matchedSkills = result
    ? result.jd_skills.filter((s) => !result.missing_skills.includes(s))
    : [];

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
        {/* ─── Left Column: Inputs ─── */}
        <div className="space-y-6">
          {/* Resume picker */}
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
                    <label
                      htmlFor="resume-select"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Select from uploaded resumes
                    </label>
                    <select
                      id="resume-select"
                      className="w-full p-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                      onChange={async (e) => {
                        const id = Number(e.target.value);
                        if (id) {
                          setLoadingResume(true);
                          try {
                            const data = await getResumeById(id);
                            setResume(data);
                          } catch {
                            toast.error("Failed to load selected resume.");
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
                          {resume.skills.slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] px-1.5 py-0.5 bg-background rounded-full border text-muted-foreground"
                            >
                              {s}
                            </span>
                          ))}
                          {resume.skills.length > 4 && (
                            <span className="text-[10px] text-muted-foreground self-center">
                              +{resume.skills.length - 4}
                            </span>
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

          {/* JD textarea */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Job Description
              </CardTitle>
              <CardDescription>
                Paste the full job description below (max 5,000 characters).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[260px] p-4 text-sm rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-y transition-all duration-200"
                placeholder="Paste job description here..."
                value={jd}
                maxLength={5000}
                onChange={(e) => setJD(e.target.value)}
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${jd.length > 4800 ? "text-amber-500" : "text-muted-foreground"}`}>
                  {jd.length} / 5,000
                </span>
              </div>
              {error && (
                <div className="mt-3 bg-red-500/10 text-red-700 dark:text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm animate-scale-in border border-red-500/20">
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

        {/* ─── Right Column: Results ─── */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Score + Radar */}
              <Card className="border-primary/20 shadow-lg animate-scale-in">
                <CardHeader className="bg-muted/30 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Match Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Score Ring + Radar side by side */}
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <ScoreRing score={result.match_score} size={150} />
                    <div className="flex-1 w-full">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1 text-center">
                        Skill Breakdown
                      </p>
                      <MatchRadarChart
                        matchScore={result.match_score}
                        jdSkillsCount={result.jd_skills.length}
                        matchedSkillsCount={matchedSkills.length}
                        missingSkillsCount={result.missing_skills.length}
                        analysisScore={analysis?.score}
                      />
                    </div>
                  </div>

                  {/* Matched Skills */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Matched Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {matchedSkills.map((skill) => (
                        <Badge key={skill} variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {skill}
                        </Badge>
                      ))}
                      {matchedSkills.length === 0 && (
                        <span className="text-sm text-muted-foreground italic">
                          No matching skills detected.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  {result.missing_skills.length > 0 && (
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-700 dark:text-red-400">
                        <XCircle className="h-4 w-4" />
                        Missing Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.missing_skills.map((skill) => (
                          <Badge key={skill} variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Coach Card */}
              <Card className="border-indigo-200/40 dark:border-indigo-800/30 animate-slide-up">
                <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bot className="h-5 w-5 text-indigo-500" />
                      AI Coach Insight
                    </CardTitle>
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
                          {analysis ? "Refresh" : "Get Feedback"}
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  {!analysis && !loadingAnalysis && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bot className="mx-auto h-10 w-10 mb-3 opacity-30" />
                      <p className="text-sm">
                        Click <strong>Get Feedback</strong> to get personalised AI coaching on this resume.
                      </p>
                      <p className="text-xs mt-1 opacity-70">Requires Ollama running locally.</p>
                    </div>
                  )}
                  {loadingAnalysis && (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                      <p className="text-sm">AI is reviewing your resume...</p>
                    </div>
                  )}
                  {analysis && !loadingAnalysis && (
                    <div className="space-y-5 animate-fade-in">
                      {/* Summary */}
                      <p className="text-sm text-foreground/80 italic border-l-2 border-indigo-300 pl-3">
                        {analysis.summary}
                      </p>

                      {/* Scores row */}
                      {(analysis.score > 0 || analysis.match_percentage !== null) && (
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1.5">
                            <span className="text-muted-foreground">Resume Score:</span>
                            <span className="font-bold text-foreground">{analysis.score}/100</span>
                          </div>
                          {analysis.match_percentage !== null && (
                            <div className="flex items-center gap-1.5 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full px-3 py-1.5">
                              <span>JD Match:</span>
                              <span className="font-bold">{analysis.match_percentage}%</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Strengths & Weaknesses */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-2">
                            <ThumbsUp className="h-3 w-3" /> Strengths
                          </h4>
                          <ul className="space-y-1.5">
                            {analysis.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-amber-600 dark:text-amber-400 mb-2">
                            <ThumbsDown className="h-3 w-3" /> Areas to Improve
                          </h4>
                          <ul className="space-y-1.5">
                            {analysis.weaknesses.map((w, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                                <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Action Plan */}
                      {analysis.suggestions.length > 0 && (
                        <div className="pt-3 border-t">
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-2">
                            <Lightbulb className="h-3 w-3" /> Action Plan
                          </h4>
                          <ol className="space-y-2">
                            {analysis.suggestions.map((s, i) => (
                              <li key={i} className="text-sm flex gap-2.5 items-start">
                                <span className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="text-muted-foreground">{s}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Keywords to Add */}
                      {analysis.keywords_to_add && analysis.keywords_to_add.length > 0 && (
                        <div className="pt-3 border-t">
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-primary mb-2">
                            <Tag className="h-3 w-3" /> Keywords to Add
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.keywords_to_add.map((kw, i) => (
                              <span
                                key={i}
                                className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center p-8 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/5">
              <div className="text-center space-y-3">
                <div className="p-4 bg-muted/50 rounded-full inline-block mb-2">
                  <Briefcase className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <p className="font-medium">Ready to Analyze</p>
                <p className="text-sm max-w-xs mx-auto">
                  Select a resume, paste a job description, and run analysis to see your match score and skill gaps.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
