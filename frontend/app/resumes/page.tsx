"use client";

import React, { useEffect, useState } from "react";
import { getResumes, deleteResume, type Resume } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileText, Calendar, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const SKILL_COLORS = [
    "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
];

export default function ResumesPage() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [filteredResumes, setFilteredResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const data = await getResumes();
                setResumes(data);
                setFilteredResumes(data);
            } catch (error) {
                console.error("Failed to fetch resumes", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResumes();
    }, []);

    useEffect(() => {
        const lowerSearch = search.toLowerCase();
        const filtered = resumes.filter(
            (r) =>
                r.filename.toLowerCase().includes(lowerSearch) ||
                r.skills.some((s) => s.toLowerCase().includes(lowerSearch))
        );
        setFilteredResumes(filtered);
    }, [search, resumes]);

    return (
        <div className="container mx-auto py-8 space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Your <span className="gradient-text">Resumes</span>
                    </h1>
                    <p className="text-muted-foreground">Manage and view your uploaded resumes.</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search resumes..."
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
                ) : filteredResumes.length > 0 ? (
                    filteredResumes.map((resume) => (
                        <Card key={resume.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:scale-110 transition-transform duration-200">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {resume.created_at ? new Date(resume.created_at).toLocaleDateString() : "Just now"}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!confirm("Are you sure you want to delete this resume?")) return;
                                            try {
                                                await deleteResume(resume.id);
                                                setResumes(prev => prev.filter(r => r.id !== resume.id));
                                            } catch (err) {
                                                console.error("Failed to delete", err);
                                                alert("Failed to delete resume");
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardTitle className="text-lg mt-3 truncate group-hover:text-primary transition-colors" title={resume.filename}>
                                    {resume.filename}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium mb-2 text-muted-foreground">Top Skills</p>
                                        <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                                            {resume.skills.slice(0, 5).map((skill, idx) => (
                                                <span
                                                    key={skill}
                                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${SKILL_COLORS[idx % SKILL_COLORS.length]}`}
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {resume.skills.length > 5 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{resume.skills.length - 5} more
                                                </Badge>
                                            )}
                                            {resume.skills.length === 0 && (
                                                <span className="text-xs text-muted-foreground italic">No skills extracted</span>
                                            )}
                                        </div>
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
                        <h3 className="text-lg font-medium">No resumes found</h3>
                        <p className="text-muted-foreground mt-1">
                            Try adjusting your search or upload a new resume.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
