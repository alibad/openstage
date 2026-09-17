"use client";

import { Bot, User } from "lucide-react";
import type { ChatMessage } from "@/lib/studio-store";

interface CodeBlock {
  filePath: string;
  language: string;
  code: string;
}

function parseCodeBlocks(content: string): {
  segments: (string | CodeBlock)[];
} {
  const segments: (string | CodeBlock)[] = [];
  const regex = /```(\w+)\s+file="([^"]+)"\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push(content.slice(lastIndex, match.index));
    }
    segments.push({
      language: match[1],
      filePath: match[2],
      code: match[3].trimEnd(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push(content.slice(lastIndex));
  }

  return { segments };
}

function CodeBlockView({ block }: { block: CodeBlock }) {
  return (
    <div className="my-3 rounded-xl border border-border overflow-hidden bg-[#0F0B21]">
      <div className="flex items-center justify-between px-4 py-2 bg-bg-elevated/50 border-b border-border">
        <span className="text-xs font-mono text-brand-1">{block.filePath}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted">{block.language}</span>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-code-fg font-mono text-xs">{block.code}</code>
      </pre>
    </div>
  );
}

function TextSegment({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="text-base font-bold mt-4 mb-2">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h4 key={i} className="text-sm font-semibold mt-3 mb-1">
              {line.slice(4)}
            </h4>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <div key={i} className="flex items-start gap-2 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-semibold mt-2">
              {line.slice(2, -2)}
            </p>
          );
        }
        return <span key={i}>{line}{i < lines.length - 1 ? "\n" : ""}</span>;
      })}
    </div>
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const { segments } = parseCodeBlocks(message.content);

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-accent/15 text-accent"
            : "bg-brand-3/15 text-brand-3"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div
        className={`flex-1 max-w-[85%] rounded-2xl px-5 py-4 ${
          isUser
            ? "bg-accent/10 border border-accent/15"
            : "bg-bg-light-surface border border-border"
        }`}
      >
        {segments.map((seg, i) =>
          typeof seg === "string" ? (
            <TextSegment key={i} text={seg} />
          ) : (
            <CodeBlockView key={i} block={seg} />
          )
        )}
      </div>
    </div>
  );
}

export function extractCodeFiles(
  content: string
): { filePath: string; code: string }[] {
  const { segments } = parseCodeBlocks(content);
  return segments
    .filter((s): s is CodeBlock => typeof s !== "string")
    .map((b) => ({ filePath: b.filePath, code: b.code }));
}
