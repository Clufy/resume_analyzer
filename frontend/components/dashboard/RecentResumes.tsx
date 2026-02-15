import React from "react";
import Link from "next/link";
import { FileText, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Resume } from "@/lib/api";

interface RecentResumesProps {
    resumes: Resume[];
    loading: boolean;
    onDelete: (id: number) => Promise<void>;
}

export function RecentResumes({ resumes, loading, onDelete }: RecentResumesProps) {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Recent Resumes</CardTitle>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Live
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : resumes.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>No resumes uploaded yet.</p>
                        <Link href="/upload">
                            <Button variant="outline" size="sm" className="mt-4">
                                Upload your first resume
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2 stagger-children">
                        {resumes.map((resume) => (
                            <div
                                key={resume.id}
                                className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-all duration-200 group cursor-default"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform duration-200">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium group-hover:text-primary transition-colors">
                                            {resume.filename}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {resume.created_at
                                                ? new Date(resume.created_at).toLocaleDateString()
                                                : "Just now"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                    <span className="text-xs bg-secondary px-2.5 py-1 rounded-full text-muted-foreground font-medium">
                                        {resume.skills?.length || 0} Skills
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Are you sure you want to delete this resume?")) {
                                                onDelete(resume.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-4">
                    <Link
                        href="/resumes"
                        className="text-sm text-primary hover:underline flex items-center gap-1 group"
                    >
                        View all resumes{" "}
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
