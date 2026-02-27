"use client";

import React, { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { UploadCloud, FileText, XCircle, AlertCircle } from "lucide-react";
import { clsx } from "clsx";

interface DropZoneProps {
    onFileAccepted: (file: File) => void;
    accept?: Record<string, string[]>;
    maxSizeMb?: number;
    file?: File | null;
    onClear?: () => void;
    disabled?: boolean;
}

export function DropZone({
    onFileAccepted,
    accept = {
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSizeMb = 10,
    file,
    onClear,
    disabled = false,
}: DropZoneProps) {
    const [rejectionError, setRejectionError] = React.useState<string | null>(null);

    const onDrop = useCallback(
        (accepted: File[], rejected: FileRejection[]) => {
            setRejectionError(null);
            if (rejected.length > 0) {
                const reason = rejected[0].errors[0]?.message ?? "Invalid file";
                setRejectionError(reason);
                return;
            }
            if (accepted[0]) {
                onFileAccepted(accepted[0]);
            }
        },
        [onFileAccepted]
    );

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept,
        maxFiles: 1,
        maxSize: maxSizeMb * 1024 * 1024,
        disabled,
    });

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (file) {
        return (
            <div className="relative p-4 border-2 border-primary/30 rounded-xl bg-primary/5 flex items-center gap-4 animate-fade-in">
                <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {formatBytes(file.size)} · Ready to upload
                    </p>
                </div>
                {onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="shrink-0 p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="Remove file"
                    >
                        <XCircle className="h-4 w-4" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div
                {...getRootProps()}
                className={clsx(
                    "relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer select-none outline-none",
                    isDragActive && !isDragReject && "border-primary bg-primary/5 scale-[1.01]",
                    isDragReject && "border-destructive bg-destructive/5",
                    !isDragActive && !isDragReject && "border-border hover:border-primary/50 hover:bg-muted/30",
                    disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
            >
                <input {...getInputProps()} />
                <div
                    className={clsx(
                        "p-4 rounded-full transition-colors",
                        isDragActive && !isDragReject ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground"
                    )}
                >
                    <UploadCloud className="h-7 w-7" />
                </div>
                <div className="text-center space-y-1">
                    {isDragReject ? (
                        <p className="text-sm font-semibold text-destructive">
                            This file type is not supported
                        </p>
                    ) : isDragActive ? (
                        <p className="text-sm font-semibold text-primary">Drop it here!</p>
                    ) : (
                        <>
                            <p className="text-sm font-semibold">
                                Drag &amp; drop your resume here
                            </p>
                            <p className="text-xs text-muted-foreground">
                                or{" "}
                                <span className="text-primary underline underline-offset-2 cursor-pointer">
                                    click to browse
                                </span>
                            </p>
                        </>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    PDF or DOCX · Max {maxSizeMb}MB
                </p>
            </div>
            {rejectionError && (
                <div className="flex items-center gap-2 text-xs text-destructive animate-fade-in">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{rejectionError}</span>
                </div>
            )}
        </div>
    );
}
