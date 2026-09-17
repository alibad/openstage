"use client";

import { useState, useRef, useCallback } from "react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-10 h-10 rounded-xl border-2 border-border shadow-sm cursor-pointer transition-all hover:scale-105 hover:shadow-md"
        style={{ backgroundColor: value }}
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          className="text-xs text-muted font-mono bg-transparent border-none p-0 focus:outline-none w-20"
        />
      </div>
    </div>
  );
}

interface GradientBuilderProps {
  stops: string[];
  onChange: (stops: string[]) => void;
}

export function GradientBuilder({ stops, onChange }: GradientBuilderProps) {
  const addStop = useCallback(() => {
    if (stops.length < 5) {
      onChange([...stops, "#818CF8"]);
    }
  }, [stops, onChange]);

  const removeStop = useCallback(
    (index: number) => {
      if (stops.length > 2) {
        onChange(stops.filter((_, i) => i !== index));
      }
    },
    [stops, onChange],
  );

  const updateStop = useCallback(
    (index: number, color: string) => {
      const next = [...stops];
      next[index] = color;
      onChange(next);
    },
    [stops, onChange],
  );

  const gradientCSS = `linear-gradient(90deg, ${stops.map((c, i) => `${c} ${Math.round((i / (stops.length - 1)) * 100)}%`).join(", ")})`;

  return (
    <div className="space-y-3">
      <div
        className="h-12 rounded-xl border border-border shadow-inner"
        style={{ background: gradientCSS }}
      />
      <div className="flex flex-wrap gap-2">
        {stops.map((stop, i) => (
          <div key={i} className="flex items-center gap-1.5 group">
            <input
              type="color"
              value={stop}
              onChange={(e) => updateStop(i, e.target.value)}
              className="w-8 h-8 rounded-lg border border-border cursor-pointer p-0"
            />
            {stops.length > 2 && (
              <button
                type="button"
                onClick={() => removeStop(i)}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-error text-xs transition-opacity"
              >
                x
              </button>
            )}
          </div>
        ))}
        {stops.length < 5 && (
          <button
            type="button"
            onClick={addStop}
            className="w-8 h-8 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted hover:text-foreground hover:border-accent transition-all"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
