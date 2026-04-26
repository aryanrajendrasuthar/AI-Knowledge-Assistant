"use client";

import { useEffect, useRef } from "react";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useChat } from "@/hooks/useChat";
import { useState } from "react";

export default function ChatPage() {
  const { messages, isStreaming, sendMessage, clearMessages } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const query = input.trim();
    if (!query || isStreaming) return;
    setInput("");
    await sendMessage(query);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 px-6 flex items-center justify-between border-b border-border flex-shrink-0">
        <h1 className="text-sm font-medium text-muted-foreground">
          {messages.length === 0 ? "New Chat" : `${messages.filter((m) => m.role === "user").length} messages`}
        </h1>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground h-7"
            onClick={clearMessages}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="px-4 py-6 space-y-6 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <TypingIndicator />
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your documents..."
            className="min-h-[48px] max-h-36 resize-none text-sm"
            rows={1}
            disabled={isStreaming}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isStreaming}
            className="h-12 w-12 flex-shrink-0 bg-primary hover:bg-primary/90"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground/40 mt-2 max-w-3xl mx-auto">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      <h2 className="text-base font-semibold text-foreground mb-2">Ask your knowledge base</h2>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        Upload documents in the Documents tab, then ask questions here. Answers stream with source citations.
      </p>
    </div>
  );
}

function MessageBubble({ message }: { message: ReturnType<typeof useChat>["messages"][number] }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
          isUser ? "bg-secondary" : "bg-primary/10 border border-primary/20"
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        ) : message.error ? (
          <AlertCircle className="w-3.5 h-3.5 text-destructive" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-primary" />
        )}
      </div>

      <div className={cn("flex flex-col gap-2 max-w-[80%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-secondary text-foreground rounded-tr-sm"
              : message.error
              ? "bg-destructive/10 border border-destructive/20 text-destructive rounded-tl-sm"
              : "bg-card border border-border text-foreground rounded-tl-sm"
          )}
        >
          {isUser ? (
            message.content
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.sources.map((src, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {src.document}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="bg-card border border-border rounded-xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
