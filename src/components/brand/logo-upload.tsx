"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface LogoUploadProps {
  value: string | null;
  onChange: (logo: string | null) => void;
}

export function LogoUpload({ value, onChange }: LogoUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 2 * 1024 * 1024) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  if (value) {
    return (
      <div className="flex items-center gap-4">
        <div className="relative group">
          <img
            src={value}
            alt="Logo"
            className="w-20 h-20 rounded-xl object-contain border border-border bg-white"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="text-sm text-muted">
          <p className="font-medium text-foreground">Logo uploaded</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-accent hover:underline"
          >
            Change logo
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
        dragOver
          ? "border-accent bg-accent-light"
          : "border-border hover:border-accent/50 hover:bg-accent-light/30"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <div className="flex flex-col items-center gap-3">
        {dragOver ? (
          <ImageIcon className="w-8 h-8 text-accent" />
        ) : (
          <Upload className="w-8 h-8 text-muted" />
        )}
        <div>
          <p className="text-sm font-medium text-foreground">
            Drop your logo here or click to upload
          </p>
          <p className="text-xs text-muted mt-1">PNG, SVG, or JPG up to 2MB</p>
        </div>
      </div>
    </div>
  );
}
