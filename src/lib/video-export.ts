"use client";

import type { Presentation } from "./types";

interface CaptureCallbacks {
  onProgress?: (message: string, current: number, total: number) => void;
}

/**
 * Captures each slide as a JPEG data URL by navigating through the deck
 * and screenshotting each slide. Reuses the same html2canvas approach
 * as PPTX export.
 */
export async function captureSlideImages(
  slides: Presentation["slides"],
  slideContainerEl: HTMLElement,
  navigateToSlide: (index: number) => void,
  callbacks?: CaptureCallbacks,
  isDark = true,
): Promise<string[]> {
  const { onProgress } = callbacks ?? {};
  const total = slides.length;
  const images: string[] = [];

  onProgress?.("Loading capture library...", 0, total);

  const { default: html2canvas } = await import("html2canvas-pro");

  for (let i = 0; i < total; i++) {
    onProgress?.(`Capturing slide ${i + 1} of ${total}...`, i, total);

    navigateToSlide(i);
    await waitForRender(100);

    const canvas = await html2canvas(slideContainerEl, {
      backgroundColor: isDark ? "#0A0718" : "#FAFAFE",
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    images.push(canvas.toDataURL("image/jpeg", 0.92));
  }

  onProgress?.("Capture complete", total, total);
  return images;
}

export interface NarrationResult {
  audioSegments: (string | null)[];
  durations: number[];
}

/**
 * Generates TTS narration for each slide's speaker notes.
 * Returns base64 audio data URLs and measured durations.
 */
export async function generateNarration(
  notes: (string | undefined)[],
  voice: string,
  callbacks?: CaptureCallbacks,
): Promise<NarrationResult> {
  const total = notes.length;
  const audioSegments: (string | null)[] = [];
  const durations: number[] = [];

  for (let i = 0; i < total; i++) {
    const text = notes[i];
    if (!text) {
      audioSegments.push(null);
      durations.push(0);
      callbacks?.onProgress?.(`Slide ${i + 1}: no notes, skipping`, i, total);
      continue;
    }

    callbacks?.onProgress?.(`Generating narration ${i + 1} of ${total}...`, i, total);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(`TTS slide ${i + 1}:`, data.error);
        audioSegments.push(null);
        durations.push(0);
        continue;
      }

      audioSegments.push(data.audio);

      const duration = await measureAudioDuration(data.audio);
      durations.push(duration);
    } catch (err) {
      console.error(`TTS failed for slide ${i + 1}:`, err);
      audioSegments.push(null);
      durations.push(0);
    }
  }

  callbacks?.onProgress?.("Narration complete", total, total);
  return { audioSegments, durations };
}

/**
 * Measures the duration of a base64 audio data URL in seconds.
 */
/**
 * Generates a short TTS preview for voice selection.
 * Returns a base64 audio data URL or null on error.
 */
export async function previewVoice(
  voice: string,
  sampleText?: string,
): Promise<string | null> {
  const text =
    sampleText ??
    "This is how your presentation narration will sound. Each slide will be narrated from the speaker notes.";
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });
    const data = await res.json();
    if (!res.ok) return null;
    return data.audio as string;
  } catch {
    return null;
  }
}

function measureAudioDuration(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new window.Audio();
    audio.addEventListener("loadedmetadata", () => {
      resolve(audio.duration);
    });
    audio.addEventListener("error", () => {
      resolve(0);
    });
    audio.src = dataUrl;
  });
}

function waitForRender(ms = 50): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, ms));
  });
}
