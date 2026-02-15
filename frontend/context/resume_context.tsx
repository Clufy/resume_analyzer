// context/resume_context.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { ResumeResponse } from "../lib/api"; // ✅ updated import

interface ResumeContextType {
  resume: ResumeResponse | null;
  setResume: (resume: ResumeResponse | null) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resume, setResume] = useState<ResumeResponse | null>(null);

  return (
    <ResumeContext.Provider value={{ resume, setResume }}>
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const context = useContext(ResumeContext);
  if (!context) throw new Error("useResume must be used within ResumeProvider");
  return context;
}