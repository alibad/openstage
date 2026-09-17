"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  MousePointer2,
  Pen,
  Minus,
  Square,
  Circle,
  ArrowRight,
  Type,
  Undo2,
  Redo2,
  Check,
  Trash2,
} from "lucide-react";

type Tool =
  | "select"
  | "draw"
  | "line"
  | "rect"
  | "circle"
  | "arrow"
  | "text";

interface Annotation {
  id: string;
  tool: Tool;
  color: string;
  lineWidth: number;
  // Freehand
  points?: { x: number; y: number }[];
  // Line/Arrow
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  // Rect/Circle
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // Text
  text?: string;
  fontSize?: number;
}

const PRESET_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
];

const TOOLS: { tool: Tool; icon: React.ReactNode; label: string }[] = [
  { tool: "select", icon: <MousePointer2 size={16} />, label: "Select" },
  { tool: "draw", icon: <Pen size={16} />, label: "Draw" },
  { tool: "line", icon: <Minus size={16} />, label: "Line" },
  { tool: "rect", icon: <Square size={16} />, label: "Rectangle" },
  { tool: "circle", icon: <Circle size={16} />, label: "Circle" },
  { tool: "arrow", icon: <ArrowRight size={16} />, label: "Arrow" },
  { tool: "text", icon: <Type size={16} />, label: "Text" },
];

let annotationId = 0;

export function ScreenshotAnnotator({
  imageSrc,
  onSave,
  onCancel,
}: {
  imageSrc: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [tool, setTool] = useState<Tool>("draw");
  const [color, setColor] = useState("#EF4444");
  const [lineWidth, setLineWidth] = useState(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [undone, setUndone] = useState<Annotation[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(
    null
  );
  const [dragOffset, setDragOffset] = useState<{
    id: string;
    dx: number;
    dy: number;
  } | null>(null);
  const [textInput, setTextInput] = useState<{
    x: number;
    y: number;
    value: string;
  } | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Fit to viewport
      const maxW = window.innerWidth - 80;
      const maxH = window.innerHeight - 140;
      const scale = Math.min(1, maxW / img.width, maxH / img.height);
      setCanvasSize({
        width: Math.round(img.width * scale),
        height: Math.round(img.height * scale),
      });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const getAnnotationBounds = (a: Annotation): { x: number; y: number; w: number; h: number } | null => {
    if (a.tool === "rect" || a.tool === "circle") {
      if (a.x == null || a.y == null || a.width == null || a.height == null) return null;
      const x = Math.min(a.x, a.x + a.width);
      const y = Math.min(a.y, a.y + a.height);
      return { x, y, w: Math.abs(a.width), h: Math.abs(a.height) };
    }
    if (a.tool === "line" || a.tool === "arrow") {
      if (a.x1 == null || a.y1 == null || a.x2 == null || a.y2 == null) return null;
      const x = Math.min(a.x1, a.x2);
      const y = Math.min(a.y1, a.y2);
      return { x, y, w: Math.abs(a.x2 - a.x1), h: Math.abs(a.y2 - a.y1) };
    }
    if (a.tool === "text" && a.text && a.x != null && a.y != null) {
      const fontSize = a.fontSize || 18;
      return { x: a.x, y: a.y - fontSize, w: a.text.length * fontSize * 0.6, h: fontSize + 4 };
    }
    if (a.tool === "draw" && a.points && a.points.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of a.points) {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    return null;
  };

  // Redraw
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imgRef.current;
    if (!canvas || !ctx || !img) return;

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);

    const all = currentAnnotation
      ? [...annotations, currentAnnotation]
      : annotations;

    for (const ann of all) {
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = ann.lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      switch (ann.tool) {
        case "draw":
          if (ann.points && ann.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(ann.points[0].x, ann.points[0].y);
            for (let i = 1; i < ann.points.length; i++) {
              ctx.lineTo(ann.points[i].x, ann.points[i].y);
            }
            ctx.stroke();
          }
          break;
        case "line":
          if (ann.x1 != null && ann.y1 != null && ann.x2 != null && ann.y2 != null) {
            ctx.beginPath();
            ctx.moveTo(ann.x1, ann.y1);
            ctx.lineTo(ann.x2, ann.y2);
            ctx.stroke();
          }
          break;
        case "arrow":
          if (ann.x1 != null && ann.y1 != null && ann.x2 != null && ann.y2 != null) {
            ctx.beginPath();
            ctx.moveTo(ann.x1, ann.y1);
            ctx.lineTo(ann.x2, ann.y2);
            ctx.stroke();
            // Arrowhead
            const angle = Math.atan2(ann.y2 - ann.y1, ann.x2 - ann.x1);
            const headLen = 14;
            ctx.beginPath();
            ctx.moveTo(ann.x2, ann.y2);
            ctx.lineTo(
              ann.x2 - headLen * Math.cos(angle - Math.PI / 6),
              ann.y2 - headLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(ann.x2, ann.y2);
            ctx.lineTo(
              ann.x2 - headLen * Math.cos(angle + Math.PI / 6),
              ann.y2 - headLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
          break;
        case "rect":
          if (ann.x != null && ann.y != null && ann.width != null && ann.height != null) {
            ctx.strokeRect(ann.x, ann.y, ann.width, ann.height);
          }
          break;
        case "circle":
          if (ann.x != null && ann.y != null && ann.width != null && ann.height != null) {
            const rx = ann.width / 2;
            const ry = ann.height / 2;
            ctx.beginPath();
            ctx.ellipse(ann.x + rx, ann.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        case "text":
          if (ann.text && ann.x != null && ann.y != null) {
            const fontSize = ann.fontSize || 18;
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillText(ann.text, ann.x, ann.y);
          }
          break;
      }

      // Draw selection indicator
      if (ann.id === selectedId) {
        ctx.save();
        ctx.strokeStyle = "#3B82F6";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        const bounds = getAnnotationBounds(ann);
        if (bounds) {
          ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.w + 8, bounds.h + 8);
        }
        ctx.restore();
      }
    }
  }, [annotations, currentAnnotation, canvasSize, selectedId]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const hitTest = (x: number, y: number): Annotation | null => {
    for (let i = annotations.length - 1; i >= 0; i--) {
      const a = annotations[i];
      if (a.tool === "rect" || a.tool === "circle") {
        if (
          a.x != null && a.y != null && a.width != null && a.height != null &&
          x >= Math.min(a.x, a.x + a.width) &&
          x <= Math.max(a.x, a.x + a.width) &&
          y >= Math.min(a.y, a.y + a.height) &&
          y <= Math.max(a.y, a.y + a.height)
        )
          return a;
      } else if (a.tool === "text") {
        if (
          a.x != null && a.y != null && a.text &&
          x >= a.x && x <= a.x + a.text.length * 10 &&
          y >= a.y - 18 && y <= a.y + 4
        )
          return a;
      } else if (a.tool === "line" || a.tool === "arrow") {
        if (a.x1 != null && a.y1 != null && a.x2 != null && a.y2 != null) {
          const dist =
            Math.abs(
              (a.y2 - a.y1) * x -
                (a.x2 - a.x1) * y +
                a.x2 * a.y1 -
                a.y2 * a.x1
            ) /
            Math.sqrt((a.y2 - a.y1) ** 2 + (a.x2 - a.x1) ** 2);
          if (dist < 8) return a;
        }
      }
    }
    return null;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    // If there's a pending text input, commit it first
    if (textInput) {
      commitText();
    }

    const pos = getPos(e);

    if (tool === "text") {
      setTextInput({ x: pos.x, y: pos.y, value: "" });
      return;
    }

    if (tool === "select") {
      const hit = hitTest(pos.x, pos.y);
      if (hit) {
        setSelectedId(hit.id);
        const ox = hit.x != null ? pos.x - hit.x : hit.x1 != null ? pos.x - hit.x1 : 0;
        const oy = hit.y != null ? pos.y - hit.y : hit.y1 != null ? pos.y - hit.y1 : 0;
        setDragOffset({ id: hit.id, dx: ox, dy: oy });
      } else {
        setSelectedId(null);
      }
      setDrawing(true);
      return;
    }

    setDrawing(true);
    const id = `ann_${annotationId++}`;

    switch (tool) {
      case "draw":
        setCurrentAnnotation({
          id,
          tool: "draw",
          color,
          lineWidth,
          points: [pos],
        });
        break;
      case "line":
      case "arrow":
        setCurrentAnnotation({
          id,
          tool,
          color,
          lineWidth,
          x1: pos.x,
          y1: pos.y,
          x2: pos.x,
          y2: pos.y,
        });
        break;
      case "rect":
      case "circle":
        setCurrentAnnotation({
          id,
          tool,
          color,
          lineWidth,
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
        });
        break;
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    const pos = getPos(e);

    if (tool === "select" && dragOffset) {
      setAnnotations((prev) =>
        prev.map((a) => {
          if (a.id !== dragOffset.id) return a;
          const dx = pos.x - dragOffset.dx;
          const dy = pos.y - dragOffset.dy;
          if (a.tool === "draw" && a.points) {
            const ox = dx - (a.points[0]?.x || 0);
            const oy = dy - (a.points[0]?.y || 0);
            return {
              ...a,
              points: a.points.map((p) => ({ x: p.x + ox, y: p.y + oy })),
            };
          }
          if (a.tool === "line" || a.tool === "arrow") {
            const w = (a.x2 || 0) - (a.x1 || 0);
            const h = (a.y2 || 0) - (a.y1 || 0);
            return { ...a, x1: dx, y1: dy, x2: dx + w, y2: dy + h };
          }
          return { ...a, x: dx, y: dy };
        })
      );
      return;
    }

    if (!currentAnnotation) return;

    switch (currentAnnotation.tool) {
      case "draw":
        setCurrentAnnotation({
          ...currentAnnotation,
          points: [...(currentAnnotation.points || []), pos],
        });
        break;
      case "line":
      case "arrow":
        setCurrentAnnotation({
          ...currentAnnotation,
          x2: pos.x,
          y2: pos.y,
        });
        break;
      case "rect":
      case "circle":
        setCurrentAnnotation({
          ...currentAnnotation,
          width: pos.x - (currentAnnotation.x || 0),
          height: pos.y - (currentAnnotation.y || 0),
        });
        break;
    }
  };

  const onMouseUp = () => {
    setDrawing(false);
    setDragOffset(null);
    if (currentAnnotation) {
      setAnnotations((prev) => [...prev, currentAnnotation]);
      setCurrentAnnotation(null);
      setUndone([]);
    }
  };

  const commitText = () => {
    if (textInput && textInput.value.trim()) {
      const id = `ann_${annotationId++}`;
      setAnnotations((prev) => [
        ...prev,
        {
          id,
          tool: "text",
          color,
          lineWidth,
          x: textInput.x,
          y: textInput.y,
          text: textInput.value,
          fontSize: 18,
        },
      ]);
      setUndone([]);
    }
    setTextInput(null);
  };

  const undo = () => {
    setAnnotations((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setUndone((u) => [last, ...u]);
      return prev.slice(0, -1);
    });
  };

  const redo = () => {
    setUndone((prev) => {
      if (prev.length === 0) return prev;
      const first = prev[0];
      setAnnotations((a) => [...a, first]);
      return prev.slice(1);
    });
  };

  const handleSave = () => {
    const img = imgRef.current;
    if (!img) return;

    // Export at full resolution
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = img.naturalWidth;
    exportCanvas.height = img.naturalHeight;
    const ctx = exportCanvas.getContext("2d")!;
    const scaleX = img.naturalWidth / canvasSize.width;
    const scaleY = img.naturalHeight / canvasSize.height;

    ctx.drawImage(img, 0, 0);

    for (const ann of annotations) {
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = ann.lineWidth * scaleX;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      switch (ann.tool) {
        case "draw":
          if (ann.points && ann.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(ann.points[0].x * scaleX, ann.points[0].y * scaleY);
            for (let i = 1; i < ann.points.length; i++) {
              ctx.lineTo(ann.points[i].x * scaleX, ann.points[i].y * scaleY);
            }
            ctx.stroke();
          }
          break;
        case "line":
          if (ann.x1 != null && ann.y1 != null && ann.x2 != null && ann.y2 != null) {
            ctx.beginPath();
            ctx.moveTo(ann.x1 * scaleX, ann.y1 * scaleY);
            ctx.lineTo(ann.x2 * scaleX, ann.y2 * scaleY);
            ctx.stroke();
          }
          break;
        case "arrow":
          if (ann.x1 != null && ann.y1 != null && ann.x2 != null && ann.y2 != null) {
            ctx.beginPath();
            ctx.moveTo(ann.x1 * scaleX, ann.y1 * scaleY);
            ctx.lineTo(ann.x2 * scaleX, ann.y2 * scaleY);
            ctx.stroke();
            const angle = Math.atan2(
              (ann.y2 - ann.y1) * scaleY,
              (ann.x2 - ann.x1) * scaleX
            );
            const headLen = 20 * scaleX;
            ctx.beginPath();
            ctx.moveTo(ann.x2 * scaleX, ann.y2 * scaleY);
            ctx.lineTo(
              ann.x2 * scaleX - headLen * Math.cos(angle - Math.PI / 6),
              ann.y2 * scaleY - headLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(ann.x2 * scaleX, ann.y2 * scaleY);
            ctx.lineTo(
              ann.x2 * scaleX - headLen * Math.cos(angle + Math.PI / 6),
              ann.y2 * scaleY - headLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
          break;
        case "rect":
          if (ann.x != null && ann.y != null && ann.width != null && ann.height != null) {
            ctx.strokeRect(
              ann.x * scaleX,
              ann.y * scaleY,
              ann.width * scaleX,
              ann.height * scaleY
            );
          }
          break;
        case "circle":
          if (ann.x != null && ann.y != null && ann.width != null && ann.height != null) {
            const rx = (ann.width / 2) * scaleX;
            const ry = (ann.height / 2) * scaleY;
            ctx.beginPath();
            ctx.ellipse(
              (ann.x + ann.width / 2) * scaleX,
              (ann.y + ann.height / 2) * scaleY,
              Math.abs(rx),
              Math.abs(ry),
              0,
              0,
              Math.PI * 2
            );
            ctx.stroke();
          }
          break;
        case "text":
          if (ann.text && ann.x != null && ann.y != null) {
            const fontSize = (ann.fontSize || 18) * scaleX;
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillText(ann.text, ann.x * scaleX, ann.y * scaleY);
          }
          break;
      }
    }

    onSave(exportCanvas.toDataURL("image/jpeg", 0.85));
  };

  // Focus text input reliably
  useEffect(() => {
    if (textInput) {
      requestAnimationFrame(() => textInputRef.current?.focus());
    }
  }, [textInput]);

  const deleteSelected = () => {
    if (!selectedId) return;
    const deleted = annotations.find((a) => a.id === selectedId);
    if (deleted) {
      setAnnotations((prev) => prev.filter((a) => a.id !== selectedId));
      setUndone((prev) => [deleted, ...prev]);
    }
    setSelectedId(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (textInput) return; // Don't intercept when typing
      if (e.key === "Escape") {
        if (selectedId) { setSelectedId(null); return; }
        onCancel();
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        deleteSelected();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "Z" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
      {/* Toolbar */}
      <div className="flex items-center gap-1 bg-zinc-900 rounded-xl px-2 py-1.5 mb-3 shadow-2xl">
        {TOOLS.map((t) => (
          <button
            key={t.tool}
            onClick={() => setTool(t.tool)}
            title={t.label}
            className={`p-2 rounded-lg transition-colors ${
              tool === t.tool
                ? "bg-white/20 text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {t.icon}
          </button>
        ))}

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        {/* Colors */}
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${
              color === c ? "border-white scale-110" : "border-transparent"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <button
          onClick={() => colorInputRef.current?.click()}
          className="w-6 h-6 rounded-full border-2 border-dashed border-zinc-500 flex items-center justify-center text-zinc-400 text-xs relative overflow-hidden"
        >
          +
          <input
            ref={colorInputRef}
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        {/* Stroke width */}
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-[10px] text-zinc-500 w-5 text-center tabular-nums">{lineWidth}</span>
          <input
            type="range"
            min={1}
            max={12}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-16 h-1 accent-white appearance-none bg-zinc-700 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        {/* Delete selected */}
        <button
          onClick={deleteSelected}
          disabled={!selectedId}
          className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none"
          title="Delete selected (Del)"
        >
          <Trash2 size={16} />
        </button>

        <button
          onClick={undo}
          disabled={annotations.length === 0}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={redo}
          disabled={undone.length === 0}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30"
          title="Redo"
        >
          <Redo2 size={16} />
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        <button
          onClick={onCancel}
          className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/10"
          title="Cancel"
        >
          <X size={16} />
        </button>
        <button
          onClick={handleSave}
          className="p-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-white/10"
          title="Save"
        >
          <Check size={16} />
        </button>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="rounded-lg cursor-crosshair"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />

        {/* Inline text input */}
        {textInput && (
          <input
            ref={textInputRef}
            type="text"
            value={textInput.value}
            onChange={(e) =>
              setTextInput({ ...textInput, value: e.target.value })
            }
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") commitText();
              if (e.key === "Escape") { setTextInput(null); }
            }}
            className="absolute bg-transparent border-b-2 text-lg font-bold outline-none"
            style={{
              left: textInput.x,
              top: textInput.y - 20,
              color,
              borderColor: color,
              minWidth: 80,
              textShadow: "0 0 3px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.4)",
            }}
          />
        )}
      </div>
    </div>
  );
}
