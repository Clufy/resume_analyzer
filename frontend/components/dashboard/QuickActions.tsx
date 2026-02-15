import React from "react";
import Link from "next/link";
import { Plus, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function QuickActions() {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <Link href="/upload" className="block">
                    <div className="p-4 border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer group gradient-border">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform duration-200">
                                <Plus className="h-5 w-5" />
                            </div>
                            <h3 className="font-semibold">Upload New Resume</h3>
                        </div>
                        <p className="text-sm text-muted-foreground pl-[3.25rem]">
                            Parse a resume to extract skills, education, and experience.
                        </p>
                    </div>
                </Link>

                <Link href="/match" className="block">
                    <div className="p-4 border rounded-lg hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-200 cursor-pointer group gradient-border">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform duration-200">
                                <Briefcase className="h-5 w-5" />
                            </div>
                            <h3 className="font-semibold">Run Job Match</h3>
                        </div>
                        <p className="text-sm text-muted-foreground pl-[3.25rem]">
                            Compare a resume against a job description.
                        </p>
                    </div>
                </Link>
            </CardContent>
        </Card>
    );
}
