"use client";

import { useState, useEffect } from "react";
import { loadGoogleFont } from "@/lib/brand/fonts";

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
  options: string[];
  label: string;
  previewText?: string;
}

export function FontSelector({
  value,
  onChange,
  options,
  label,
  previewText = "The quick brown fox jumps over the lazy dog",
}: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    options.forEach((f) => loadGoogleFont(f));
  }, [options]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-surface text-left text-foreground hover:border-accent/50 transition-colors"
        >
          <span style={{ fontFamily: `"${value}", sans-serif` }}>{value}</span>
          <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-xl border border-border bg-surface shadow-xl">
              {options.map((font) => (
                <button
                  key={font}
                  type="button"
                  onClick={() => {
                    onChange(font);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-accent-light transition-colors ${value === font ? "bg-accent-light text-accent" : "text-foreground"}`}
                >
                  <span
                    className="text-sm font-medium block"
                    style={{ fontFamily: `"${font}", sans-serif` }}
                  >
                    {font}
                  </span>
                  <span
                    className="text-xs text-muted block mt-0.5 truncate"
                    style={{ fontFamily: `"${font}", sans-serif` }}
                  >
                    {previewText}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
