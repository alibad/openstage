"use client";

import type { Presentation } from "./types";

interface ExportCallbacks {
  onProgress?: (message: string, current: number, total: number) => void;
  onError?: (error: string) => void;
}

/**
 * Captures each slide in a SlideDeck as an image and assembles them
 * into a branded PPTX file with speaker notes.
 *
 * Uses html2canvas-pro for screenshot capture and pptxgenjs for PPTX
 * assembly. Both are dynamically imported to keep the main bundle lean.
 */
export async function exportSlidesToPptx(
  presentation: Presentation,
  slideContainerEl: HTMLElement,
  navigateToSlide: (index: number) => void,
  callbacks?: ExportCallbacks,
  isDark = true,
): Promise<void> {
  const { onProgress, onError } = callbacks ?? {};
  const { slides } = presentation;
  const total = slides.length;

  onProgress?.("Loading export libraries...", 0, total);

  let PptxGenJS: typeof import("pptxgenjs")["default"];
  let html2canvas: typeof import("html2canvas-pro")["default"];

  try {
    const [pptxMod, h2cMod] = await Promise.all([
      import("pptxgenjs"),
      import("html2canvas-pro"),
    ]);
    PptxGenJS = pptxMod.default;
    html2canvas = h2cMod.default;
  } catch (err) {
    const msg = `Failed to load export libraries: ${err instanceof Error ? err.message : err}`;
    console.error(msg, err);
    onError?.(msg);
    throw new Error(msg);
  }

  const pptx = new PptxGenJS();
  pptx.author = presentation.author;
  pptx.title = presentation.title;
  pptx.subject = presentation.description;
  pptx.layout = "LAYOUT_WIDE";

  for (let i = 0; i < total; i++) {
    onProgress?.(`Capturing slide ${i + 1} of ${total}...`, i, total);

    navigateToSlide(i);
    slideContainerEl.classList.add("pptx-capture");
    await waitForRender(150);

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(slideContainerEl, {
        backgroundColor: isDark ? "#0A0718" : "#FAFAFE",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
    } catch (err) {
      const msg = `Failed to capture slide ${i + 1}: ${err instanceof Error ? err.message : err}`;
      console.error(msg, err);
      onError?.(msg);
      throw new Error(msg);
    }

    slideContainerEl.classList.remove("pptx-capture");

    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    const slide = pptx.addSlide();
    slide.addImage({ data: imgData, x: 0, y: 0, w: "100%", h: "100%" });

    if (slides[i].notes) {
      slide.addNotes(slides[i].notes!);
    }

    const footer = `${presentation.title} — ${presentation.author} | ${i + 1}/${total}`;
    slide.addText(footer, {
      x: 0.3,
      y: 7.1,
      w: 12.7,
      fontSize: 7,
      color: "666666",
      align: "right",
    });
  }

  onProgress?.("Building PPTX...", total, total);

  const filename = `${presentation.slug}.pptx`;

  try {
    const blob = await pptx.write({ outputType: "blob" }) as Blob;
    triggerBlobDownload(blob, filename);
  } catch (err) {
    const msg = `Failed to generate PPTX: ${err instanceof Error ? err.message : err}`;
    console.error(msg, err);
    onError?.(msg);
    throw new Error(msg);
  }
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 200);
}

function waitForRender(ms = 50): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, ms));
  });
}
