"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiCall, type ResumeResponse } from "@/lib/api";
import { useResume } from "@/context/resume_context";
import { FileUpload } from "@/components/ui/FileUpload";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { CheckCircle2, AlertCircle, Upload, Sparkles } from "lucide-react";


export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { setResume } = useResume();
  const router = useRouter();

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const data = await apiCall<ResumeResponse>("/resume/upload", {
        method: "POST",
        body: formData,
      });

      setResume(data);
      setSuccess(true);

      setTimeout(() => {
        router.push("/match");
      }, 1500);

    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload resume. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-10 animate-fade-in">
      <div className="mb-8 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-4">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Upload <span className="gradient-text">Resume</span>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Upload a PDF or DOCX file to extract skills, education, and experience using AI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Resume Upload
          </CardTitle>
          <CardDescription>
            Drag and drop your file below or click to browse.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-500/10 text-red-700 dark:text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm animate-scale-in border border-red-500/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-scale-in">
              <div className="p-4 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full animate-pulse-glow">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Upload Successful!</h3>
                <p className="text-muted-foreground">Redirecting to match page...</p>
              </div>
              <Button onClick={() => router.push("/match")} className="mt-4">
                Proceed to Match
              </Button>
            </div>
          ) : (
            <FileUpload
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
              accept={{
                "application/pdf": [".pdf"],
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
              }}
            />
          )}

          <div className="text-xs text-muted-foreground text-center">
            Supported formats: PDF, DOCX (Max 5MB)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
