// components/FloatingParticles.tsx
"use client";

import { useEffect, useState } from "react";

const SKILL_PARTICLES = [
  "Python", "JavaScript", "React", "Node.js", "Django",
  "TypeScript", "SQL", "Docker", "Kubernetes", "AWS",
  "Firebase", "FastAPI", "Flutter", "MongoDB", "CI/CD",
];

export default function FloatingParticles() {
  const [particles, setParticles] = useState<{x: number, y: number, skill: string, size: number, delay: number}[]>([]);

  useEffect(() => {
    const generated = Array.from({length: 20}, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      skill: SKILL_PARTICLES[Math.floor(Math.random() * SKILL_PARTICLES.length)],
      size: 12 + Math.random() * 12,
      delay: Math.random() * 10,
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute text-white font-semibold opacity-20 animate-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.skill}
        </span>
      ))}
    </div>
  );
}
