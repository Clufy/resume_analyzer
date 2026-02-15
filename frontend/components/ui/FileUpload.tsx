"use client";

import React, { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { UploadCloud, File, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "./Button";

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: Record<string, string[]>;
    maxSize?: number; // in bytes
    className?: string;
    isUploading?: boolean;
}

export function FileUpload({
    onFileSelect,
    accept = {
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize = 5 * 1024 * 1024,
    className,
    isUploading = false,
}: FileUploadProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[], fileRejections: FileRejection[]) => {
            setError(null);
            if (fileRejections.length > 0) {
                setError(fileRejections[0].errors[0].message);
                return;
            }

            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                setSelectedFile(file);
                onFileSelect(file);
            }
        },
        [onFileSelect]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxSize,
        multiple: false,
        disabled: isUploading,
    });

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        setError(null);
    };

    return (
        <div className={cn("w-full", className)}>
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors relative overflow-hidden",
                    isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50",
                    error ? "border-destructive/50 bg-destructive/5" : "",
                    isUploading ? "opacity-50 cursor-not-allowed" : ""
                )}
            >
                <input {...getInputProps()} />

                {selectedFile ? (
                    <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
                        <div className="p-4 bg-primary/10 rounded-full text-primary">
                            <File className="h-8 w-8" />
                        </div>
                        <p className="font-medium text-foreground">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>

                        {!isUploading && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-2 z-10"
                                onClick={clearFile}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Remove
                            </Button>
                        )}
                        {isUploading && (
                            <div className="text-primary flex items-center gap-2 mt-2">
                                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Uploading...
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-4 bg-muted rounded-full mb-2">
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium">
                            {isDragActive ? "Drop file here" : "Drag & drop resume"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            PDF or DOCX (Max 5MB)
                        </p>
                        {error && (
                            <p className="text-sm text-destructive mt-2">{error}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
