"use client";
// Copyright (c) 2026 Aryan Rajendra Suthar. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, BookOpen, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/documents", icon: BookOpen, label: "Documents" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full border-r border-border bg-sidebar">
      <div className="h-14 px-4 flex items-center gap-2.5 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm tracking-tight text-foreground">Knowledge AI</span>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
              pathname.startsWith(href)
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground/50 text-center">AI Knowledge Assistant</p>
      </div>
    </aside>
  );
}
