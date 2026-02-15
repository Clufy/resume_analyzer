"use client";

import React, { useEffect, useState } from "react";
import { getMatches, type Match } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Briefcase, FileText, Calendar, Search, XCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { deleteMatch } from "@/lib/api";

export default function MatchesPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const data = await getMatches();
                setMatches(data);
                setFilteredMatches(data);
            } catch (error: unknown) {
                console.error("Failed to fetch matches", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, []);

    useEffect(() => {
        const lowerSearch = search.toLowerCase();
        const filtered = matches.filter(
            (m) =>
                (m.resume_filename && m.resume_filename.toLowerCase().includes(lowerSearch)) ||
                (m.jd_text && m.jd_text.toLowerCase().includes(lowerSearch))
        );
        setFilteredMatches(filtered);
    }, [search, matches]);

    return (
        <div className="container mx-auto py-8 space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Match <span className="gradient-text">History</span>
                    </h1>
                    <p className="text-muted-foreground">View past resume-job match analysis reports.</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search matches..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-children">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="h-24 bg-muted/50 rounded-t-xl" />
                            <CardContent className="h-32 bg-muted/20 rounded-b-xl" />
                        </Card>
                    ))
                ) : filteredMatches.length > 0 ? (
                    filteredMatches.map((match) => (
                        <Card key={match.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                            <CardHeader className="pb-3 border-b bg-muted/20">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform duration-200">
                                            <Briefcase className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base truncate max-w-[150px]" title={match.jd_text}>
                                                Job Match
                                            </CardTitle>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Calendar className="h-3 w-3" />
                                                {match.created_at ? new Date(match.created_at).toLocaleDateString() : "Just now"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={match.match_score >= 80 ? "success" : match.match_score >= 60 ? "warning" : "destructive"}>
                                            {match.match_score}%
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!confirm("Are you sure you want to delete this match?")) return;
                                                try {
                                                    await deleteMatch(match.id);
                                                    setMatches(prev => prev.filter(m => m.id !== match.id));
                                                } catch (err) {
                                                    console.error("Failed to delete", err);
                                                    alert("Failed to delete match");
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium truncate" title={match.resume_filename || "Unknown"}>
                                        {match.resume_filename || "Unknown Resume"}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Missing Skills</p>
                                    <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                                        {match.missing_skills.length > 0 ? (
                                            match.missing_skills.slice(0, 3).map((skill) => (
                                                <Badge key={skill} variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
                                                    <XCircle className="h-2.5 w-2.5" />
                                                    {skill}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                No missing skills!
                                            </span>
                                        )}
                                        {match.missing_skills.length > 3 && (
                                            <span className="text-[10px] text-muted-foreground self-center">
                                                +{match.missing_skills.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-16 text-center border-2 border-dashed rounded-xl bg-muted/5">
                        <div className="p-4 bg-muted/50 rounded-full inline-block mb-3">
                            <Search className="h-6 w-6 text-muted-foreground/60" />
                        </div>
                        <h3 className="text-lg font-medium">No matches found</h3>
                        <p className="text-muted-foreground mt-1">
                            Try adjusting your search or run a new match.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
