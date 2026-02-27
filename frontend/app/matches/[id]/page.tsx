"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getMatchById, deleteMatch, type MatchDetail } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScoreRing } from "@/components/ui/ScoreRing";

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
    ArrowLeft, Briefcase, FileText, Calendar, CheckCircle2,
    XCircle, Loader2, Trash2, AlertCircle,
} from "lucide-react";

export default function MatchDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const [match, setMatch] = useState<MatchDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchMatch = async () => {
            try {
                const data = await getMatchById(id);
                setMatch(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load match.");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchMatch();
    }, [id]);

    // Must be declared before any early return to follow Rules of Hooks
    const matchedSkills = useMemo(
        () => match ? match.jd_skills.filter((s) => !match.missing_skills.includes(s)) : [],
        [match]
    );

    const handleDelete = async () => {
        if (!match) return;
        setDeleting(true);
        try {
            await deleteMatch(match.id);
            toast.success("Match deleted.");
            router.push("/matches");
        } catch {
            toast.error("Failed to delete match.");
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="container max-w-4xl mx-auto py-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !match) {
        return (
            <div className="container max-w-4xl mx-auto py-12">
                <div className="flex flex-col items-center justify-center gap-4 py-16 border-2 border-dashed rounded-xl text-muted-foreground">
                    <AlertCircle className="h-10 w-10 text-destructive/60" />
                    <p className="font-medium">{error ?? "Match not found."}</p>
                    <Button variant="outline" onClick={() => router.push("/matches")}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/matches")}
                        className="gap-1.5 text-muted-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Match <span className="gradient-text">Details</span>
                        </h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {match.created_at
                                ? new Date(match.created_at).toLocaleString()
                                : "Unknown date"}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
                >
                    {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                </Button>
            </div>

            {/* Score + Radar */}
            <Card className="border-primary/20 shadow-md">
                <CardHeader className="bg-muted/20 border-b pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Match Score
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                        <ScoreRing score={match.match_score} size={160} />
                        <div className="flex-1 w-full">
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1 text-center">
                                Skill Breakdown
                            </p>
                            <MatchRadarChart
                                matchScore={match.match_score}
                                jdSkillsCount={match.jd_skills.length}
                                matchedSkillsCount={matchedSkills.length}
                                missingSkillsCount={match.missing_skills.length}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Resume & Skills */}
            <div className="grid gap-6 sm:grid-cols-2">
                {/* Resume info */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Resume
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-medium text-sm truncate mb-3">
                            {match.resume_filename ?? "Unknown resume"}
                        </p>
                        {match.resume_skills && match.resume_skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {match.resume_skills.map((s) => (
                                    <span
                                        key={s}
                                        className="text-xs px-2 py-0.5 rounded-full bg-muted border text-muted-foreground"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Matched skills */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Matched Skills
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {matchedSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {matchedSkills.map((s) => (
                                    <Badge key={s} variant="success" className="gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        {s}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No skill matches found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Missing skills */}
            {match.missing_skills.length > 0 && (
                <Card className="border-red-200/40 dark:border-red-900/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400">
                            <XCircle className="h-4 w-4" />
                            Missing Skills
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-1.5">
                            {match.missing_skills.map((s) => (
                                <Badge key={s} variant="destructive" className="gap-1">
                                    <XCircle className="h-3 w-3" />
                                    {s}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Job Description */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        Job Description
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto pr-1 rounded">
                        {match.jd_text || "No job description saved."}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
