"use client";

import React, { useEffect, useState } from "react";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

function getScoreColor(score: number): { stroke: string; text: string } {
  if (score >= 80) return { stroke: "#10b981", text: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 60) return { stroke: "#f59e0b", text: "text-amber-600 dark:text-amber-400" };
  return { stroke: "#ef4444", text: "text-red-600 dark:text-red-400" };
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent Match";
  if (score >= 60) return "Good Fit";
  return "Needs Improvement";
}

export function ScoreRing({
  score,
  size = 160,
  strokeWidth = 12,
  label,
  className = "",
}: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const center = size / 2;
  const colors = getScoreColor(score);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/40"
          />
          {/* Animated progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: `drop-shadow(0 0 6px ${colors.stroke}60)`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold leading-none"
            style={{ fontSize: size * 0.2 }}
          >
            {Math.round(animatedScore)}%
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className={`text-sm font-semibold ${colors.text}`}>
          {label ?? getScoreLabel(score)}
        </p>
      </div>
    </div>
  );
}
