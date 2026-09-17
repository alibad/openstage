"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  MessageSquarePlus,
  X,
  Minimize2,
  Send,
  MousePointer,
  Crosshair,
  Camera,
  Video,
  Mic,
  Trash2,
  ChevronDown,
  ImagePlus,
  Loader2,
  Square as StopIcon,
  ExternalLink,
  Globe,
} from "lucide-react";
import { useFeedbackStore } from "@/lib/stores/feedbackStore";
import type { ElementInfo } from "@/lib/stores/feedbackStore";
import { ScreenshotAnnotator } from "./ScreenshotAnnotator";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { useFeedbackLang } from "./useFeedbackLang";
import { feedbackT } from "./feedback-i18n";

// ─── Helpers ─────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    check();
    const mq = window.matchMedia("(pointer: coarse)");
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);
  return isMobile;
}

async function withWidgetHidden<T>(fn: () => Promise<T>): Promise<T> {
  const root = document.getElementById("feedback-widget-root");
  if (root) root.style.display = "none";
  await new Promise((r) => setTimeout(r, 100));
  try {
    return await fn();
  } finally {
    if (root) root.style.display = "";
  }
}

function buildSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;
  if (!parent) return tag;
  const siblings = Array.from(parent.children).filter(
    (c) => c.tagName === el.tagName
  );
  const idx = siblings.indexOf(el);
  const parentSel = buildSelector(parent);
  return `${parentSel} > ${tag}${siblings.length > 1 ? `:nth-of-type(${idx + 1})` : ""}`;
}

async function compressImage(
  dataUrl: string,
  maxWidth = 1920,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function fileToDataUri(file: File): Promise<string> {
  return blobToDataUri(file);
}

function formatTime(seconds: number, max: number): string {
  const remaining = max - seconds;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function grabFrameFromStream(stream: MediaStream): Promise<ImageBitmap> {
  const track = stream.getVideoTracks()[0];
  const video = document.createElement("video");
  video.srcObject = new MediaStream([track]);
  video.muted = true;
  await video.play();
  // Wait a frame for the video to actually render
  await new Promise((r) => requestAnimationFrame(r));
  const bitmap = await createImageBitmap(video);
  video.pause();
  video.srcObject = null;
  return bitmap;
}

const MAX_RECORDING_SECONDS = 60;
const MAX_AUDIO_RECORDING_SECONDS = 600;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
const CATEGORIES = ["Bug", "Enhancement", "UI/UX", "General"] as const;

// ─── Component ───────────────────────────────────────────

export function FeedbackWidget() {
  const store = useFeedbackStore();
  const isMobile = useIsMobile();
  const { lang, toggle: toggleLang } = useFeedbackLang();
  const t = feedbackT[lang];

  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  // Element select state
  const [hoveredEl, setHoveredEl] = useState<{
    rect: DOMRect;
    info: string;
  } | null>(null);
  const [selectDropdown, setSelectDropdown] = useState(false);

  // Confirm delete state
  const [confirmDeleteAudio, setConfirmDeleteAudio] = useState(false);
  const [confirmDeleteVideo, setConfirmDeleteVideo] = useState(false);

  // ─── Element Select ──────────────────────────────────

  const handleElementHover = useCallback(
    (e: MouseEvent) => {
      if (!store.isSelectingElement && !store.isPinpointMode) return;
      const root = document.getElementById("feedback-widget-root");
      if (root) root.style.pointerEvents = "none";

      const el = document.elementFromPoint(e.clientX, e.clientY);

      if (root) root.style.pointerEvents = "";

      if (
        !el ||
        el === document.documentElement ||
        el === document.body ||
        el.closest("#feedback-widget-root")
      )
        return;

      const rect = el.getBoundingClientRect();
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : "";
      const cls = el.className && typeof el.className === "string"
        ? `.${el.className.split(" ").slice(0, 2).join(".")}`
        : "";
      setHoveredEl({ rect, info: `${tag}${id}${cls}` });
    },
    [store.isSelectingElement, store.isPinpointMode]
  );

  const handleElementClick = useCallback(
    async (e: MouseEvent) => {
      if (!store.isSelectingElement && !store.isPinpointMode) return;
      e.preventDefault();
      e.stopPropagation();

      const root = document.getElementById("feedback-widget-root");
      if (root) root.style.pointerEvents = "none";
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (root) root.style.pointerEvents = "";

      if (
        !el ||
        el === document.documentElement ||
        el === document.body ||
        el.closest("#feedback-widget-root")
      )
        return;

      const rect = el.getBoundingClientRect();
      const elementInfo: ElementInfo = {
        tagName: el.tagName,
        id: el.id || undefined,
        className:
          typeof el.className === "string"
            ? el.className.slice(0, 200)
            : undefined,
        textContent: el.textContent?.trim().slice(0, 100) || undefined,
        selector: buildSelector(el),
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
      };

      if (store.isPinpointMode) {
        // Pinpoint: capture position + element + screenshot
        const position = {
          x: e.clientX,
          y: e.clientY,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
        };

        // Inject temporary marker
        const marker = document.createElement("div");
        marker.style.cssText = `position:fixed;left:${e.clientX - 12}px;top:${e.clientY - 12}px;width:24px;height:24px;z-index:999999;pointer-events:none;`;
        marker.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#EF4444" stroke-width="2"/><line x1="12" y1="2" x2="12" y2="22" stroke="#EF4444" stroke-width="1.5"/><line x1="2" y1="12" x2="22" y2="12" stroke="#EF4444" stroke-width="1.5"/></svg>`;
        document.body.appendChild(marker);

        const captureId = store.addCapture({ elementInfo, position });
        store.setIsPinpointMode(false);
        setHoveredEl(null);

        try {
          const screenshot = await withWidgetHidden(async () => {
            const stream = await navigator.mediaDevices.getDisplayMedia({
              video: { displaySurface: "browser" } as MediaTrackConstraints,
              // @ts-expect-error -- preferCurrentTab is Chrome-only
              preferCurrentTab: true,
            });
            const bitmap = await grabFrameFromStream(stream);
            stream.getVideoTracks()[0].stop();
            const canvas = document.createElement("canvas");
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
            return canvas.toDataURL("image/jpeg", 0.7);
          });
          const compressed = await compressImage(screenshot);
          store.addScreenshotToCapture(captureId, compressed);
        } catch {
          // Capture cancelled — still have element info
        } finally {
          marker.remove();
        }

        store.open();
        return;
      }

      // Normal element select: capture element + auto-cropped screenshot
      const captureId = store.addCapture({ elementInfo });
      store.setIsSelectingElement(false);
      setHoveredEl(null);

      try {
        const screenshot = await withWidgetHidden(async () => {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { displaySurface: "browser" } as MediaTrackConstraints,
            // @ts-expect-error -- preferCurrentTab is Chrome-only
            preferCurrentTab: true,
          });
          const bitmap = await grabFrameFromStream(stream);
          stream.getVideoTracks()[0].stop();

          // Crop to element
          const dpr = bitmap.width / window.innerWidth;
          const canvas = document.createElement("canvas");
          const pad = 8;
          const sx = Math.max(0, (rect.x - pad) * dpr);
          const sy = Math.max(0, (rect.y - pad) * dpr);
          const sw = Math.min(
            bitmap.width - sx,
            (rect.width + pad * 2) * dpr
          );
          const sh = Math.min(
            bitmap.height - sy,
            (rect.height + pad * 2) * dpr
          );
          canvas.width = sw;
          canvas.height = sh;
          canvas.getContext("2d")!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
          return canvas.toDataURL("image/png");
        });
        store.addScreenshotToCapture(captureId, screenshot);
      } catch {
        // Capture cancelled — still have element info
      }

      store.open();
    },
    [store]
  );

  useEffect(() => {
    if (store.isSelectingElement || store.isPinpointMode) {
      window.addEventListener("mousemove", handleElementHover, true);
      window.addEventListener("click", handleElementClick, true);
      return () => {
        window.removeEventListener("mousemove", handleElementHover, true);
        window.removeEventListener("click", handleElementClick, true);
        setHoveredEl(null);
      };
    }
  }, [store.isSelectingElement, store.isPinpointMode, handleElementHover, handleElementClick]);

  // ─── Screenshot ──────────────────────────────────────

  const captureScreenshot = async () => {
    store.minimize();
    try {
      const screenshot = await withWidgetHidden(async () => {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "browser" } as MediaTrackConstraints,
          // @ts-expect-error -- preferCurrentTab is Chrome-only
          preferCurrentTab: true,
        });
        const bitmap = await grabFrameFromStream(stream);
        stream.getVideoTracks()[0].stop();
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
        return canvas.toDataURL("image/jpeg", 0.85);
      });
      const compressed = await compressImage(screenshot);
      // Open annotator
      store.setAnnotatingImg(compressed);
    } catch {
      toast.error(t.screenshotCancelled);
    }
    store.restore();
  };

  // ─── Video Recording ─────────────────────────────────

  const startRecording = async () => {
    store.minimize();
    try {
      const displayStream = await withWidgetHidden(async () => {
        return navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "browser" } as MediaTrackConstraints,
          // @ts-expect-error -- preferCurrentTab is Chrome-only
          preferCurrentTab: true,
        });
      });

      const tracks: MediaStreamTrack[] = [...displayStream.getVideoTracks()];
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        tracks.push(...micStream.getAudioTracks());
      } catch {
        // Record without audio
      }

      const combinedStream = new MediaStream(tracks);
      recordingStreamRef.current = combinedStream;

      displayStream.getVideoTracks()[0].addEventListener("ended", () => {
        stopRecording();
      });

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/mp4";

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        store.setVideoBlob(blob);
        store.setVideoUrl(url);
        store.restore();
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      store.setIsRecording(true);
      store.setRecordingSeconds(0);

      let elapsed = 0;
      recordingTimerRef.current = setInterval(() => {
        elapsed += 1;
        store.setRecordingSeconds(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 1000);
    } catch {
      store.restore();
      toast.error(t.recordingCancelled);
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((t) => t.stop());
      recordingStreamRef.current = null;
    }
    useFeedbackStore.getState().setIsRecording(false);
  }, []);

  // ─── Voice Recording ─────────────────────────────────

  const startAudioRecording = async () => {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const recorder = new MediaRecorder(micStream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        micStream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        store.setAudioBlob(blob);
        store.setAudioUrl(url);
      };

      recorder.start(1000);
      audioRecorderRef.current = recorder;
      audioStreamRef.current = micStream;
      store.setIsAudioRecording(true);
      store.setRecordingSeconds(0);

      let elapsed = 0;
      audioTimerRef.current = setInterval(() => {
        elapsed += 1;
        store.setRecordingSeconds(elapsed);
        if (elapsed >= MAX_AUDIO_RECORDING_SECONDS) {
          stopAudioRecording();
        }
      }, 1000);
    } catch {
      toast.error(t.micDenied);
    }
  };

  const stopAudioRecording = useCallback(() => {
    if (audioRecorderRef.current?.state !== "inactive") {
      audioRecorderRef.current?.stop();
    }
    if (audioTimerRef.current) {
      clearInterval(audioTimerRef.current);
      audioTimerRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    useFeedbackStore.getState().setIsAudioRecording(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      stopAudioRecording();
    };
  }, [stopRecording, stopAudioRecording]);

  // ─── File Handling ───────────────────────────────────

  const handleFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        toast.error(t.exceedsLimit(file.name));
        continue;
      }
      if (file.type.startsWith("image/") && !isMobile) {
        // Open in annotator on desktop
        const dataUrl = await fileToDataUri(file);
        store.setAnnotatingImg(dataUrl);
      } else if (file.type.startsWith("image/")) {
        // On mobile, add directly
        const dataUrl = await fileToDataUri(file);
        store.addScreenshot(dataUrl);
      } else {
        const preview = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;
        store.addAttachment({
          id: `att_${Date.now()}_${Math.random()}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          preview,
        });
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  // ─── Paste Handler ───────────────────────────────────

  useEffect(() => {
    if (!store.isOpen) return;
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) handleFiles([file]);
        }
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  });

  // ─── Annotator callbacks ─────────────────────────────

  const handleAnnotatorSave = async (dataUrl: string) => {
    const compressed = await compressImage(dataUrl);
    if (store.annotatingCaptureId) {
      store.addScreenshotToCapture(store.annotatingCaptureId, compressed);
    } else {
      store.addScreenshot(compressed);
    }
    store.setAnnotatingImg(null);
  };

  // ─── Submit ──────────────────────────────────────────

  const handleSubmit = async () => {
    if (!store.title.trim()) {
      toast.error(t.titleRequired);
      return;
    }
    store.setIsSubmitting(true);

    try {
      // Build captures payload
      const captures = store.captures.map((c) => ({
        id: c.id,
        elementInfo: c.elementInfo,
        position: c.position,
        screenshot: c.screenshot,
      }));

      // Convert video/audio blobs to data URIs
      let videoBase64: string | undefined;
      if (store.videoBlob) {
        videoBase64 = await blobToDataUri(store.videoBlob);
      }
      let audioBase64: string | undefined;
      if (store.audioBlob) {
        audioBase64 = await blobToDataUri(store.audioBlob);
      }

      // Convert attachments
      const attachments = await Promise.all(
        store.attachments.map(async (att) => ({
          name: att.name,
          type: att.type,
          dataUri: await fileToDataUri(att.file),
        }))
      );

      const res = await fetch("/api/widget-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: store.title,
          description: store.description,
          category: store.category,
          captures,
          videoBase64,
          audioBase64,
          attachments,
          currentUrl: window.location.href,
          presentationSlug: window.location.pathname.replace(/^\//, "").split("/")[0] || null,
          userAgent: navigator.userAgent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(t.feedbackSubmitted, {
          action: data.issueUrl
            ? {
                label: t.viewIssue,
                onClick: () => window.open(data.issueUrl, "_blank"),
              }
            : undefined,
        });
        store.close();
      } else {
        toast.error(data.error || "Failed to submit");
      }
    } catch (err) {
      console.error(err);
      toast.error(t.failedToSubmit);
    } finally {
      store.setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (store.isSelectingElement) {
        store.setIsSelectingElement(false);
      } else if (store.isPinpointMode) {
        store.setIsPinpointMode(false);
      } else if (store.annotatingImg) {
        store.setAnnotatingImg(null);
      } else if (store.isOpen && !store.isMinimized) {
        store.close();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [store]);

  // ─── Render ──────────────────────────────────────────

  const isSelectMode = store.isSelectingElement || store.isPinpointMode;
  const isRtl = lang === "ar";
  // Pin feedback widget to bottom-left so it never collides with ScrollNarrator
  // (always bottom-right, does not flip in RTL).
  void isRtl;
  const sideClass = "left-6";

  return (
    <div id="feedback-widget-root" dir={t.dir}>
      {/* Annotator overlay */}
      {store.annotatingImg && (
        <ScreenshotAnnotator
          imageSrc={store.annotatingImg}
          onSave={handleAnnotatorSave}
          onCancel={() => store.setAnnotatingImg(null)}
        />
      )}

      {/* Element select overlay */}
      {isSelectMode && (
        <div className="fixed inset-0 z-[150] cursor-crosshair">
          {hoveredEl && (
            <>
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/10 rounded-sm pointer-events-none transition-all duration-75"
                style={{
                  left: hoveredEl.rect.left,
                  top: hoveredEl.rect.top,
                  width: hoveredEl.rect.width,
                  height: hoveredEl.rect.height,
                }}
              />
              <div
                className="absolute bg-bg-dark text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap"
                style={{
                  left: hoveredEl.rect.left,
                  top: Math.max(0, hoveredEl.rect.top - 28),
                }}
              >
                {hoveredEl.info}
              </div>
            </>
          )}
          {/* Cancel hint */}
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-bg-dark text-white text-sm px-4 py-2 rounded-full shadow-xl">
            {store.isPinpointMode ? t.clickToPinpoint : t.clickToCapture}{" "}
            &middot; <span className="text-muted/60">{t.escToCancel}</span>
          </div>
        </div>
      )}

      {/* Floating recording indicator */}
      <AnimatePresence>
        {store.isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 ${sideClass} z-[100] flex items-center gap-3 bg-bg-dark text-white px-4 py-2.5 rounded-full shadow-2xl`}
          >
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
            <span className="font-mono text-sm tabular-nums">
              {formatTime(store.recordingSeconds, MAX_RECORDING_SECONDS)}
            </span>
            <div className="w-20 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-1000"
                style={{
                  width: `${((MAX_RECORDING_SECONDS - store.recordingSeconds) / MAX_RECORDING_SECONDS) * 100}%`,
                }}
              />
            </div>
            <button
              onClick={stopRecording}
              className="p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors"
            >
              <StopIcon size={14} fill="currentColor" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button (hidden when slide deck provides its own) */}
      <AnimatePresence>
        {!store.isOpen && !store.isMinimized && !store.isRecording && !isSelectMode && !store.hideTrigger && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => store.open()}
            className={`fixed bottom-6 ${sideClass} z-[80] w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-border shadow-lg flex items-center justify-center text-muted hover:text-brand-2 hover:border-brand-2/30 hover:shadow-xl transition-all`}
            title={t.sendFeedback}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageSquarePlus size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Minimized pill */}
      <AnimatePresence>
        {store.isMinimized && !store.isRecording && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => store.restore()}
            className={`fixed bottom-6 ${sideClass} z-[90] bg-foreground text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-sm hover:scale-105 active:scale-95 transition-transform`}
          >
            <MessageSquarePlus size={16} />
            {t.continueFeedback}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Dialog */}
      <AnimatePresence>
        {store.isOpen && !store.isMinimized && !store.annotatingImg && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed z-[100] bg-bg-light-surface rounded-2xl shadow-2xl border border-border flex flex-col ${
              isMobile
                ? "inset-0 rounded-none"
                : `bottom-6 ${sideClass} w-[420px] max-h-[90vh]`
            }`}
            style={
              isMobile
                ? {
                    paddingTop: "env(safe-area-inset-top)",
                    paddingBottom: "env(safe-area-inset-bottom)",
                  }
                : undefined
            }
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                {t.sendFeedback}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleLang}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-bg-light transition-colors text-[11px] font-medium flex items-center gap-1"
                  title={lang === "ar" ? "English" : "العربية"}
                >
                  <Globe size={14} />
                  <span>{lang === "ar" ? "En" : "ع"}</span>
                </button>
                {!isMobile && (
                  <button
                    onClick={() => store.minimize()}
                    className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-bg-light transition-colors"
                    title={t.minimize}
                  >
                    <Minimize2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => store.close()}
                  className={`rounded-lg text-muted hover:text-foreground hover:bg-bg-light transition-colors ${isMobile ? "p-2" : "p-1.5"}`}
                  title={t.close}
                >
                  <X size={isMobile ? 20 : 16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {/* Category */}
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => store.setCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      store.category === cat
                        ? "bg-foreground text-white"
                        : "bg-bg-light text-muted hover:bg-accent-light"
                    }`}
                  >
                    {t.categories[cat] || cat}
                  </button>
                ))}
              </div>

              {/* Title */}
              <input
                type="text"
                placeholder={t.title}
                value={store.title}
                onChange={(e) => store.setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:border-brand-2/40 focus:ring-2 focus:ring-brand-2/20 outline-none transition-colors"
              />

              {/* Description */}
              <textarea
                placeholder={
                  isMobile
                    ? t.descriptionPlaceholderMobile
                    : t.descriptionPlaceholder
                }
                value={store.description}
                onChange={(e) => store.setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:border-brand-2/40 focus:ring-2 focus:ring-brand-2/20 outline-none transition-colors resize-none"
              />

              {/* Tools */}
              {isMobile ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      store.setIsSelectingElement(true);
                      useFeedbackStore.setState({ isOpen: false, isMinimized: true });
                    }}
                    className="w-full flex items-center justify-center gap-2 min-h-12 rounded-xl bg-bg-light border border-dashed border-border text-sm active:border-foreground active:bg-accent-light"
                  >
                    <MousePointer size={18} />
                    {t.selectElement}
                  </button>
                  <button
                    type="button"
                    onClick={() => mobileFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 min-h-12 rounded-xl bg-bg-light border border-dashed border-border text-sm active:border-foreground active:bg-accent-light"
                  >
                    <ImagePlus size={18} />
                    {t.addScreenshot}
                  </button>
                  <input
                    ref={mobileFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  {!store.audioBlob && (
                    <button
                      type="button"
                      onClick={
                        store.isAudioRecording
                          ? stopAudioRecording
                          : startAudioRecording
                      }
                      className={`w-full flex items-center justify-center gap-2 min-h-12 rounded-xl border text-sm ${
                        store.isAudioRecording
                          ? "bg-red-50 border-red-300 text-red-600"
                          : "bg-bg-light border-dashed border-border"
                      }`}
                    >
                      <Mic size={18} />
                      {store.isAudioRecording
                        ? `${t.stop} (${formatTime(store.recordingSeconds, MAX_AUDIO_RECORDING_SECONDS)})`
                        : t.voiceNoteMobile}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop tools row */}
                  <div className="flex items-center gap-1.5">
                    {/* Select / Pinpoint split button */}
                    <div className="relative flex">
                      <button
                        onClick={() => {
                          store.setIsSelectingElement(true);
                          useFeedbackStore.setState({ isOpen: false, isMinimized: true });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-l-lg bg-bg-light hover:bg-accent-light text-foreground transition-colors"
                        title={t.selectElement}
                      >
                        <MousePointer size={14} />
                        {t.select}
                      </button>
                      <button
                        onClick={() => setSelectDropdown((v) => !v)}
                        className="flex items-center px-1.5 py-1.5 text-xs rounded-r-lg bg-bg-light hover:bg-accent-light text-foreground border-l border-border transition-colors"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <AnimatePresence>
                        {selectDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute top-full left-0 mt-1 bg-bg-light-surface border border-border rounded-lg shadow-lg overflow-hidden z-10"
                          >
                            <button
                              onClick={() => {
                                store.setIsPinpointMode(true);
                                useFeedbackStore.setState({ isOpen: false, isMinimized: true });
                                setSelectDropdown(false);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-bg-light w-full whitespace-nowrap"
                            >
                              <Crosshair size={14} />
                              {t.pinpoint}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      onClick={captureScreenshot}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-bg-light hover:bg-accent-light text-foreground transition-colors"
                      title={t.screenshot}
                    >
                      <Camera size={14} />
                      {t.screenshot}
                    </button>

                    {!store.videoBlob && (
                      <button
                        onClick={startRecording}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-bg-light hover:bg-accent-light text-foreground transition-colors"
                        title={t.record}
                      >
                        <Video size={14} />
                        {t.record}
                      </button>
                    )}

                    {!store.audioBlob && !store.isAudioRecording && (
                      <button
                        onClick={startAudioRecording}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-bg-light hover:bg-accent-light text-foreground transition-colors"
                        title={t.voice}
                      >
                        <Mic size={14} />
                        {t.voice}
                      </button>
                    )}
                  </div>

                  {/* Drop zone */}
                  <div
                    className="border border-dashed border-border rounded-lg p-3 text-center text-xs text-muted cursor-pointer hover:border-muted hover:text-foreground transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t.dropZone}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </>
              )}

              {/* Audio recording indicator (inline, dialog stays open) */}
              {store.isAudioRecording && !isMobile && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                  </span>
                  <span className="font-mono text-sm tabular-nums text-red-700">
                    {formatTime(
                      store.recordingSeconds,
                      MAX_AUDIO_RECORDING_SECONDS
                    )}
                  </span>
                  <div className="flex-1 h-1.5 bg-red-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-1000"
                      style={{
                        width: `${((MAX_AUDIO_RECORDING_SECONDS - store.recordingSeconds) / MAX_AUDIO_RECORDING_SECONDS) * 100}%`,
                      }}
                    />
                  </div>
                  <button
                    onClick={stopAudioRecording}
                    className="p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-700 transition-colors"
                  >
                    <StopIcon size={14} fill="currentColor" />
                  </button>
                </div>
              )}

              {/* Captures grid */}
              {store.captures.length > 0 && (
                <div className="space-y-2">
                  {store.captures.map((cap) => (
                    <div
                      key={cap.id}
                      className="bg-bg-light rounded-lg p-2 border border-border"
                    >
                      <div className="flex items-start gap-2">
                        {cap.screenshot && (
                          <div className="relative group shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cap.screenshot}
                              alt="capture"
                              className="w-20 h-14 object-cover rounded border border-border cursor-pointer"
                              onClick={() => {
                                if (!isMobile) {
                                  store.setAnnotatingImg(
                                    cap.screenshot!,
                                    cap.id
                                  );
                                }
                              }}
                            />
                            <button
                              onClick={() =>
                                store.removeCaptureScreenshot(cap.id)
                              }
                              className={`absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center ${isMobile ? "" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                            >
                              <X size={10} />
                            </button>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {cap.elementInfo && (
                            <div className="flex items-center gap-1">
                              <code className="text-[11px] text-muted truncate">
                                &lt;{cap.elementInfo.tagName.toLowerCase()}
                                {cap.elementInfo.id
                                  ? ` #${cap.elementInfo.id}`
                                  : ""}
                                &gt;
                              </code>
                              <button
                                onClick={() =>
                                  store.removeCaptureElement(cap.id)
                                }
                                className="p-0.5 rounded text-muted/60 hover:text-red-500 shrink-0"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                          {cap.elementInfo?.textContent && (
                            <p className="text-[11px] text-muted/60 truncate mt-0.5">
                              {cap.elementInfo.textContent}
                            </p>
                          )}
                          {cap.position && (
                            <p className="text-[11px] text-muted/60 mt-0.5">
                              Pinpoint: ({cap.position.x}, {cap.position.y})
                            </p>
                          )}
                        </div>
                        {!cap.screenshot && !cap.elementInfo && (
                          <button
                            onClick={() => store.removeCapture(cap.id)}
                            className="p-1 rounded text-muted/60 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Video preview */}
              {store.videoUrl && (
                <div className="bg-bg-light rounded-lg p-2 border border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted">
                      {t.screenRecording}
                    </span>
                    <div className="flex items-center gap-1">
                      <a
                        href={store.videoUrl}
                        download="screen-recording.webm"
                        className="p-1 rounded text-muted/60 hover:text-foreground"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button
                        onClick={() => setConfirmDeleteVideo(true)}
                        className="p-1 rounded text-muted/60 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <video
                    src={store.videoUrl}
                    controls
                    className="w-full rounded border border-border"
                  />
                </div>
              )}

              {/* Audio preview */}
              {store.audioUrl && (
                <div className="bg-bg-light rounded-lg p-2 border border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted">
                      {t.voiceNoteLabel}
                    </span>
                    <button
                      onClick={() => setConfirmDeleteAudio(true)}
                      className="p-1 rounded text-muted/60 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <audio
                    src={store.audioUrl}
                    controls
                    className="w-full h-10"
                  />
                </div>
              )}

              {/* Attachments */}
              {store.attachments.length > 0 && (
                <div className="space-y-1.5">
                  {store.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 bg-bg-light rounded-lg px-2 py-1.5 border border-border"
                    >
                      <span className="text-xs text-muted truncate flex-1">
                        {att.name}
                      </span>
                      <span className="text-[10px] text-muted/60 shrink-0">
                        {(att.size / 1024).toFixed(0)}KB
                      </span>
                      <button
                        onClick={() => store.removeAttachment(att.id)}
                        className="p-0.5 rounded text-muted/60 hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border">
              <button
                onClick={handleSubmit}
                disabled={store.isSubmitting || !store.title.trim()}
                className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isMobile ? "min-h-12 text-base" : ""
                } ${
                  store.category === "Bug"
                    ? "bg-red-500 hover:bg-red-600"
                    : "brand-gradient-bg hover:opacity-90"
                }`}
              >
                {store.isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {store.isSubmitting ? t.submitting : t.submitFeedback}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmDeleteAudio}
        onCancel={() => setConfirmDeleteAudio(false)}
        onConfirm={() => {
          store.removeAudio();
          setConfirmDeleteAudio(false);
        }}
        title={t.deleteVoiceTitle}
        description={t.deleteVoiceDesc}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        dir={t.dir}
        destructive
      />

      <ConfirmDialog
        open={confirmDeleteVideo}
        onCancel={() => setConfirmDeleteVideo(false)}
        onConfirm={() => {
          store.removeVideo();
          setConfirmDeleteVideo(false);
        }}
        title={t.deleteRecordingTitle}
        description={t.deleteRecordingDesc}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        dir={t.dir}
        destructive
      />
    </div>
  );
}
