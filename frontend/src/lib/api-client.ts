const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string }>("/health"),

  documents: {
    list: () => request<{ documents: unknown[] }>("/documents"),
    delete: (id: string) => request(`/documents/${id}`, { method: "DELETE" }),
    upload: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return request("/documents/upload", { method: "POST", body: form });
    },
  },

  async *streamQuery(query: string, sessionId: string) {
    const res = await fetch(`${API_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, session_id: sessionId }),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  },
};
