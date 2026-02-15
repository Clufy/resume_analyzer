"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Briefcase, Plus, Sparkles, Zap } from "lucide-react";
import { StatsCard } from "@/components/ui/StatsCard";
import { Button } from "@/components/ui/Button";
import { RecentResumes } from "@/components/dashboard/RecentResumes";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { getStats, getResumes, type Stats, type Resume } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentResumes, setRecentResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsData, resumesData] = await Promise.all([
        getStats(),
        getResumes().catch(() => [])
      ]);
      setStats(statsData);
      setRecentResumes(resumesData.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("dashboard-resumes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "resumes" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to <span className="gradient-text">ResumeAI</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Your AI-powered resume analysis dashboard.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/upload">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Upload Resume
            </Button>
          </Link>
          <Link href="/match">
            <Button variant="outline" className="gap-2">
              <Briefcase className="h-4 w-4" />
              New Match
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-children">
        <StatsCard
          title="Total Resumes"
          value={stats?.total_resumes ?? 0}
          icon={FileText}
          description="Processed resumes"
        />
        <StatsCard
          title="Job Matches"
          value={stats?.total_matches ?? 0}
          icon={Briefcase}
          description="Analysis reports generated"
        />
        <StatsCard
          title="Success Rate"
          value={stats?.total_matches ? `${stats.success_rate}%` : "--"}
          icon={Sparkles}
          description={stats?.total_matches ? "Matches scoring ≥ 70%" : "Run a match to see"}
          className={!stats?.total_matches ? "opacity-60" : ""}
        />
        <StatsCard
          title="Avg. Score"
          value={stats?.total_matches ? `${stats.avg_score}%` : "--"}
          icon={Zap}
          description={stats?.total_matches ? "Across all matches" : "Run a match to see"}
          className={!stats?.total_matches ? "opacity-60" : ""}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <RecentResumes
          resumes={recentResumes}
          loading={loading}
          onDelete={async (id) => {
            try {
              await import("@/lib/api").then(m => m.deleteResume(id));
              setRecentResumes(prev => prev.filter(r => r.id !== id));
              fetchData();
            } catch (err) {
              console.error("Failed to delete resume", err);
              alert("Failed to delete resume");
            }
          }}
        />
        <QuickActions />
      </div>
    </div>
  );
}
