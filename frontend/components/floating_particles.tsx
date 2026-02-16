// components/FloatingParticles.tsx
"use client";

import { useEffect, useState } from "react";

const SKILL_PARTICLES = [
  "Python", "JavaScript", "React", "Node.js", "Django",
  "TypeScript", "SQL", "Docker", "Kubernetes", "AWS",
  "Firebase", "FastAPI", "Flutter", "MongoDB", "CI/CD",
];

export default function FloatingParticles() {
  const [particles, setParticles] = useState<{ x: number, y: number, skill: string, size: number, delay: number }[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 20 }, () => {
      const array = new Uint32Array(5);
      window.crypto.getRandomValues(array);

      return {
        x: (array[0] % 100),
        y: (array[1] % 100),
        skill: SKILL_PARTICLES[array[2] % SKILL_PARTICLES.length],
        size: 12 + (array[3] % 12),
        delay: (array[4] % 10),
      };
    });
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
