"use client";

import React from "react";
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

interface MatchRadarChartProps {
    matchScore: number;
    jdSkillsCount: number;
    matchedSkillsCount: number;
    missingSkillsCount: number;
    analysisScore?: number;
    className?: string;
}

export function MatchRadarChart({
    matchScore,
    jdSkillsCount,
    matchedSkillsCount,
    missingSkillsCount,
    analysisScore,
    className = "",
}: MatchRadarChartProps) {
    const skillCoverage =
        jdSkillsCount > 0
            ? Math.round((matchedSkillsCount / jdSkillsCount) * 100)
            : matchScore;

    const gapScore =
        jdSkillsCount > 0
            ? Math.max(0, Math.round(100 - (missingSkillsCount / jdSkillsCount) * 100))
            : 100;

    const data = [
        {
            subject: "Skill Match",
            score: Math.round(matchScore),
            fullMark: 100,
        },
        {
            subject: "Skill Coverage",
            score: skillCoverage,
            fullMark: 100,
        },
        {
            subject: "AI Quality",
            score: analysisScore ?? Math.round(matchScore * 0.9),
            fullMark: 100,
        },
        {
            subject: "Skill Gap",
            score: gapScore,
            fullMark: 100,
        },
        {
            subject: "Completeness",
            score: Math.min(100, Math.round(matchScore * 1.1)),
            fullMark: 100,
        },
    ];

    return (
        <div className={className}>
            <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid
                        stroke="currentColor"
                        className="text-border/50"
                        strokeOpacity={0.6}
                    />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem",
                            fontSize: "12px",
                            color: "hsl(var(--foreground))",
                        }}
                        formatter={(value: number | undefined) => [`${value ?? 0}%`, "Score"]}
                    />
                    <Radar
                        name="Match"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.15}
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", r: 3 }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
