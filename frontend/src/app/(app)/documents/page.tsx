"use client";
// Copyright (c) 2026 Aryan Rajendra Suthar. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.
import { useCallback, useState } from "react";
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api, type DocumentMeta } from "@/lib/api-client";

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1_048_576).toFixed(1)} MB`;
}

function timeAgo(unixStr: string) {
  const s = Math.floor((Date.now() - Number(unixStr) * 1000) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.documents.list(),
    refetchInterval: 10_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => api.documents.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted.");
    },
    onError: () => toast.error("Failed to delete document."),
  });

  const uploadFile = useCallback(
    async (file: File) => {
      const allowed = [".pdf", ".txt", ".docx"];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!allowed.includes(ext)) {
        toast.error("Only PDF, TXT, and DOCX files are supported.");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File exceeds 50 MB limit.");
        return;
      }

      setUploadProgress(10);
      const tick = setInterval(
        () => setUploadProgress((p) => (p && p < 85 ? p + 15 : p)),
        400
      );

      try {
        const result = await api.documents.upload(file);
        clearInterval(tick);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 600);
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        toast.success(`${result.name} — ${result.chunks} chunks indexed.`);
      } catch (err) {
        clearInterval(tick);
        setUploadProgress(null);
        toast.error(err instanceof Error ? err.message : "Upload failed.");
      }
    },
    [queryClient]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = "";
    },
    [uploadFile]
  );

  const docs = data?.documents ?? [];
  const totalChunks = docs.reduce((a, d) => a + d.chunks, 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Knowledge Base</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload documents to enable semantic search and AI-powered Q&amp;A.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Documents", value: isLoading ? "—" : docs.length },
            { label: "Total Chunks", value: isLoading ? "—" : totalChunks },
            { label: "Status", value: isError ? "Error" : "Operational" },
          ].map(({ label, value }) => (
            <Card key={label} className="p-4 bg-card border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {label}
              </p>
              <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
            </Card>
          ))}
        </div>

        {/* Upload Zone */}
        <label
          htmlFor="file-upload"
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={cn(
            "flex flex-col items-center gap-3 border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-border/60 hover:bg-accent/30"
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <Upload className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Drop files here or <span className="text-primary">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, TXT, DOCX · up to 50 MB</p>
          </div>
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.txt,.docx"
            className="hidden"
            onChange={handleFileInput}
            disabled={uploadProgress !== null}
          />
        </label>

        {uploadProgress !== null && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading &amp; indexing…</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1.5" />
          </div>
        )}

        {/* Document list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive text-center py-4">
            Failed to load documents. Is the backend running?
          </p>
        ) : docs.length > 0 ? (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Indexed Documents
            </h2>
            {docs.map((doc) => (
              <DocRow
                key={doc.doc_id}
                doc={doc}
                onDelete={() => deleteMutation.mutate(doc.doc_id)}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === doc.doc_id}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No documents yet. Upload one to get started.
          </p>
        )}
      </div>
    </div>
  );
}

function DocRow({
  doc,
  onDelete,
  isDeleting,
}: {
  doc: DocumentMeta;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg group">
      <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(doc.size)} · {doc.chunks} chunks · {timeAgo(doc.uploaded_at)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5" />
          Ready
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
