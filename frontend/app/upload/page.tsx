"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiCall, type ResumeResponse } from "@/lib/api";
import { useResume } from "@/context/resume_context";
import { DropZone } from "@/components/ui/DropZone";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { setResume } = useResume();
  const router = useRouter();

  const handleFileAccepted = (file: File) => {
    setSelectedFile(file);
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const uploadToast = toast.loading(`Uploading ${selectedFile.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const data = await apiCall<ResumeResponse>("/resume/upload", {
        method: "POST",
        body: formData,
      });

      setResume(data);
      setSuccess(true);
      toast.success("Resume uploaded and parsed successfully!", { id: uploadToast });

      setTimeout(() => {
        router.push("/match");
      }, 1500);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      toast.error(msg, { id: uploadToast });
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-10 animate-fade-in">
      <div className="mb-8 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Upload <span className="gradient-text">Resume</span>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Upload a PDF or DOCX file. Our AI will extract your skills, education, and work experience automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Resume Upload
          </CardTitle>
          <CardDescription>
            Drag &amp; drop your file or click to browse. Supported formats: PDF or DOCX (max 10 MB).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-scale-in">
              <div className="p-4 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full animate-pulse-glow">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Upload Successful!</h3>
                <p className="text-muted-foreground text-sm">Redirecting to the match page...</p>
              </div>
              <Button onClick={() => router.push("/match")} className="mt-2 gap-2">
                Proceed to Match
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <DropZone
                onFileAccepted={handleFileAccepted}
                file={selectedFile}
                onClear={() => setSelectedFile(null)}
                disabled={isUploading}
              />

              {selectedFile && !success && (
                <Button
                  className="w-full gap-2"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Uploading &amp; Parsing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Upload &amp; Analyze
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
