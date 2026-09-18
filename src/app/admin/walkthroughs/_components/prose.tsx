import ReactMarkdown, { type Components } from "react-markdown";
import { cn } from "@/lib/cn";

/**
 * Every prose field in the walkthrough JSON (descriptions, steps, tips,
 * annotations, issue text) is markdown — bold/italic/code/lists only. Render
 * it through here, never as `<p>{text}</p>`, or raw `**` and backticks leak
 * into the UI. Two modes: block (standalone paragraphs) and inline (inside
 * <li>, <a>, line-clamp containers — where a nested <p> would break layout).
 */

type Props = { children: string | null | undefined; className?: string; inline?: boolean };

const block: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="font-mono text-[0.85em] px-1 py-0.5 rounded bg-foreground/5 text-foreground/90">{children}</code>
  ),
  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-2 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-2 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  // The writer contract is link-free; render any stray link as plain text so
  // we never nest an <a> inside a card that is itself an <a>.
  a: ({ children }) => <span>{children}</span>,
};
const inlineComponents: Components = { ...block, p: ({ children }) => <>{children}</> };

export function Prose({ children, className, inline }: Props) {
  if (!children) return null;
  const Wrapper = inline ? "span" : "div";
  return (
    <Wrapper className={cn(className)}>
      <ReactMarkdown components={inline ? inlineComponents : block}>{children}</ReactMarkdown>
    </Wrapper>
  );
}
