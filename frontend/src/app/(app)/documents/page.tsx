"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DocStatus = "processing" | "ready" | "error";

type Doc = {
  id: string;
  name: string;
  size: number;
  status: DocStatus;
  chunks: number;
  uploadedAt: Date;
};

const MOCK_DOCS: Doc[] = [
  {
    id: "1",
    name: "company-handbook.pdf",
    size: 2_400_000,
    status: "ready",
    chunks: 142,
    uploadedAt: new Date(Date.now() - 1_800_000),
  },
  {
    id: "2",
    name: "product-documentation.pdf",
    size: 890_000,
    status: "ready",
    chunks: 67,
    uploadedAt: new Date(Date.now() - 7_200_000),
  },
];

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1_048_576).toFixed(1)} MB`;
}

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>(MOCK_DOCS);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const simulateUpload = useCallback((files: FileList) => {
    const file = files[0];
    if (!file) return;

    const allowed = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      toast.error("Only PDF, TXT, and DOCX files are supported.");
      return;
    }

    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p === null || p >= 100) {
          clearInterval(interval);
          return null;
        }
        return p + 20;
      });
    }, 300);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(null);
      setDocs((prev) => [
        {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          status: "ready",
          chunks: Math.floor(file.size / 500),
          uploadedAt: new Date(),
        },
        ...prev,
      ]);
      toast.success(`${file.name} ingested successfully.`);
    }, 1800);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) simulateUpload(e.dataTransfer.files);
    },
    [simulateUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) simulateUpload(e.target.files);
    },
    [simulateUpload]
  );

  const totalChunks = docs.reduce((a, d) => a + d.chunks, 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload documents to enable semantic search and AI-powered Q&amp;A.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Documents", value: docs.length },
            { label: "Total Chunks", value: totalChunks },
            { label: "Status", value: "Operational" },
          ].map(({ label, value }) => (
            <Card key={label} className="p-4 bg-card border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {label}
              </p>
              <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
            </Card>
          ))}
        </div>

        <label
          htmlFor="file-upload"
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={cn(
            "flex flex-col items-center gap-3 border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-border/80 hover:bg-accent/40"
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <Upload className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Drop files here or{" "}
              <span className="text-primary">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, TXT, DOCX · up to 50 MB</p>
          </div>
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.txt,.docx"
            className="hidden"
            onChange={handleFileInput}
          />
        </label>

        {uploadProgress !== null && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading &amp; ingesting…</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1.5" />
          </div>
        )}

        {docs.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Uploaded Documents
            </h2>
            <div className="space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg group"
                >
                  <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(doc.size)} · {doc.chunks} chunks · {timeAgo(doc.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={doc.status} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setDocs((prev) => prev.filter((d) => d.id !== doc.id));
                        toast.success(`${doc.name} removed.`);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DocStatus }) {
  if (status === "ready")
    return (
      <div className="flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle className="w-3.5 h-3.5" />
        Ready
      </div>
    );
  if (status === "error")
    return (
      <div className="flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="w-3.5 h-3.5" />
        Error
      </div>
    );
  return (
    <div className="flex items-center gap-1 text-xs text-yellow-400">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      Processing
    </div>
  );
}
