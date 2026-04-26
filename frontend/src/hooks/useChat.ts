"use client";

import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api-client";

export type Source = { document: string; chunk_index: number };

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  error?: boolean;
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const sessionId = useRef(crypto.randomUUID());

  const sendMessage = useCallback(async (query: string) => {
    if (isStreaming) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: query };
    const aiId = crypto.randomUUID();
    const aiMsg: Message = { id: aiId, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setIsStreaming(true);

    try {
      for await (const event of api.streamQuery(query, sessionId.current)) {
        if (event.type === "token") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId ? { ...m, content: m.content + event.content } : m
            )
          );
        } else if (event.type === "sources") {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, sources: event.sources } : m))
          );
        } else if (event.type === "error") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId ? { ...m, content: event.message, error: true } : m
            )
          );
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? { ...m, content: "Connection error. Is the backend running?", error: true }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isStreaming, sendMessage, clearMessages };
}
