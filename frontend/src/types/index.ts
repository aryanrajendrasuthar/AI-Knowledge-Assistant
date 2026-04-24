export type MessageRole = "user" | "assistant";

export type Source = {
  document: string;
  page?: number;
  excerpt: string;
};

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  sources?: Source[];
};

export type Document = {
  id: string;
  name: string;
  size: number;
  status: "processing" | "ready" | "error";
  chunks: number;
  uploadedAt: string;
};

export type QueryRequest = {
  query: string;
  session_id: string;
};

export type HealthResponse = {
  status: string;
  service: string;
  version: string;
  environment: string;
  timestamp: string;
};
