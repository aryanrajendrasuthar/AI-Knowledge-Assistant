// Copyright (c) 2026 Aryan Rajendra Suthar. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export type SSEEvent =
  | { type: "token"; content: string }
  | { type: "sources"; sources: { document: string; chunk_index: number }[] }
  | { type: "done"; cached: boolean }
  | { type: "error"; message: string };

export const api = {
  health: () => request<{ status: string; version: string }>("/health"),

  documents: {
    list: () =>
      request<{ documents: DocumentMeta[]; total: number }>("/documents"),

    upload: async (file: File): Promise<UploadResult> => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/documents/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || res.statusText);
      }
      return res.json();
    },

    delete: (docId: string) =>
      request(`/documents/${docId}`, { method: "DELETE" }),
  },

  async *streamQuery(query: string, sessionId: string): AsyncGenerator<SSEEvent> {
    const res = await fetch(`${API_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, session_id: sessionId }),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        if (part.startsWith("data: ")) {
          try {
            yield JSON.parse(part.slice(6)) as SSEEvent;
          } catch {
            // skip malformed event
          }
        }
      }
    }
  },
};

export type DocumentMeta = {
  doc_id: string;
  name: string;
  size: number;
  chunks: number;
  uploaded_at: string;
};

export type UploadResult = {
  doc_id: string;
  name: string;
  chunks: number;
  message: string;
};
