"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Palette,
  Lock,
  Building2,
} from "lucide-react";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

export default function NewPresentationPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [customer, setCustomer] = useState("");
  const [brief, setBrief] = useState("");
  const [accentColor, setAccentColor] = useState("#818CF8");
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    issueUrl?: string;
    error?: string;
  } | null>(null);

  function slugify(str: string) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const slug = slugify(title || "untitled");

  async function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files || []);
    const processed: UploadedFile[] = [];

    for (const f of newFiles) {
      const arrayBuffer = await f.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      processed.push({
        name: f.name,
        size: f.size,
        type: f.type,
        dataUrl: base64,
      });
    }

    setFiles((prev) => [...prev, ...processed]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/presentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          customer,
          brief,
          accentColor,
          password: password || undefined,
          files: files.map((f) => ({
            name: f.name,
            content: f.dataUrl,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, issueUrl: data.issueUrl });
      } else {
        setResult({ success: false, error: data.error || "Something went wrong" });
      }
    } catch {
      setResult({ success: false, error: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (result?.success) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="p-8 rounded-2xl border border-success/30 bg-success/5 text-center">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Request Submitted
          </h2>
          <p className="text-muted text-sm mb-6">
            Your presentation request has been submitted. Claude Code will
            generate it and deploy automatically.
          </p>
          <div className="flex items-center justify-center gap-3">
            {result.issueUrl && (
              <a
                href={result.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-accent hover:bg-accent/90 rounded-lg transition-all"
              >
                View GitHub Issue
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 text-sm text-muted hover:text-foreground border border-border rounded-lg transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          New Presentation
        </h1>
        <p className="text-muted text-sm mt-1">
          Describe what you need and attach any reference docs. Claude Code will
          generate the presentation and deploy it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Title <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Abu Dhabi Water Security — Executive Briefing"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-bg-light text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
          {title && (
            <p className="text-xs text-muted mt-1.5">
              Slug: <code className="text-accent">/{slug}</code>
            </p>
          )}
        </div>

        {/* Customer */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            <Building2 className="w-3.5 h-3.5 inline mr-1" />
            Customer
          </label>
          <input
            type="text"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="e.g. Department of Energy, Internal"
            className="w-full px-4 py-3 rounded-xl border border-border bg-bg-light text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
        </div>

        {/* Brief */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Brief <span className="text-error">*</span>
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Describe the presentation you need. Include the audience, key messages, data points, narrative flow, and anything else Claude should know..."
            required
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-border bg-bg-light text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-y"
          />
        </div>

        {/* Accent Color */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            <Palette className="w-3.5 h-3.5 inline mr-1" />
            Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer"
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-32 px-3 py-2 rounded-lg border border-border bg-bg-light text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
            <button
              type="button"
              onClick={() => setAccentColor("#818CF8")}
              className="text-xs text-muted hover:text-accent transition-colors"
            >
              Reset to brand default
            </button>
          </div>
        </div>

        {/* Password Protection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            <Lock className="w-3.5 h-3.5 inline mr-1" />
            Password Protection
          </label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank for public access"
            className="w-full px-4 py-3 rounded-xl border border-border bg-bg-light text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
          <p className="text-xs text-muted mt-1.5">
            {password
              ? "Viewers will need this password to access the presentation."
              : "No password — the presentation will be publicly accessible."}
          </p>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            <Upload className="w-3.5 h-3.5 inline mr-1" />
            Reference Documents
          </label>
          <p className="text-xs text-muted mb-3">
            Attach PDFs, docs, images, or data files. Claude will use these as
            context to generate the presentation content.
          </p>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-accent/40 rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-accent-light/50"
          >
            <Upload className="w-6 h-6 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted/60 mt-1">
              PDF, DOCX, PPTX, images, CSV, or any text file
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileAdd}
            className="hidden"
            accept=".pdf,.doc,.docx,.pptx,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.svg"
          />

          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {f.type.startsWith("image/") ? (
                      <ImageIcon className="w-4 h-4 text-accent shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-accent shrink-0" />
                    )}
                    <span className="text-sm text-foreground truncate">
                      {f.name}
                    </span>
                    <span className="text-xs text-muted shrink-0">
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(f.name)}
                    className="p-1 text-muted hover:text-error transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {result?.error && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-error/30 bg-error/5 text-sm text-error">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {result.error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="px-4 py-2.5 text-sm text-muted hover:text-foreground border border-border rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !title || !brief}
            className="flex items-center gap-2 px-5 py-2.5 text-sm text-white bg-accent hover:bg-accent/90 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Request
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
