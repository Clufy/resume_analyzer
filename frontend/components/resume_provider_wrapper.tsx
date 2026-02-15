// components/ResumeProviderWrapper.tsx (client component)
"use client";

import { ReactNode } from "react";
import { ResumeProvider } from "../context/resume_context";

export default function ResumeProviderWrapper({ children }: { children: ReactNode }) {
  return <ResumeProvider>{children}</ResumeProvider>;
}
