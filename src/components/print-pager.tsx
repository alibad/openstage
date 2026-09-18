"use client";

import { useEffect } from "react";

/* ─────────────────────────────────────────────────────────────────────────
   One section, one page — deterministic PDF pagination for a scroll deck.

   Drop-in: put `pdf-pages` on the deck's <main> when `?print` is on and
   mount <PrintPager enabled={print} />. Every top-level section becomes
   exactly one full-bleed A4 landscape page, and any section too tall for
   the sheet is scaled to fit.

   What it replaces: flowing the deck onto paper lets a section's background
   stop where its text stops, so the rest of the sheet prints white, and a
   section a few lines over the page spills a stub onto the next one. Both
   were visible in real PDF exports.

   Why the CSS lives here rather than globals.css: the geometry, the @page
   rule and the measuring code have to agree exactly, and the measuring only
   works because `pdf-pages` lays the on-screen ?print view out at the SAME
   width the printer uses (297mm = 1122.5px at 96dpi) — a height measured on
   screen is the height the page will get. Keeping all three in one file is
   what makes that invariant checkable.

   Print A4 landscape. In portrait the pages still fill, but the layout
   reflows narrower than it was measured at, so content can be cut.
   ───────────────────────────────────────────────────────────────────────── */

/** A4 landscape at 96dpi: 297mm × 210mm. */
const PAGE_W = 1122.5;
const PAGE_H = 793.7;
/* The on-screen ?print view is laid out a few pixels NARROWER than the sheet.
   Measuring at exactly the page width was the last source of clipping: print
   rounds the box down, one paragraph wraps an extra line, and the section is
   suddenly 5% taller than what we scaled for. Narrower here means the printed
   layout can only come out shorter than measured, never taller. */
const MEASURE_W = PAGE_W - 6;
/** Breathing room inside each sheet, top and bottom. */
const PAD = 16;
/* Scaled sections aim a little under the sheet. Print lays text out ~1%
   taller than the on-screen ?print view does (line-height rounding), so a
   scale computed to fill the page exactly overflows it by a few pixels — and
   `overflow: hidden` turns those few pixels into a clipped last line. */
const FIT_H = PAGE_H * 0.97;

const px = (n: number) => `${n}mm`;
const mm = (cssPx: number) => px((cssPx / 96) * 25.4);

const SELECTOR = "main.pdf-pages > section > [data-print-fit]";

function fitAll() {
  const boxes = document.querySelectorAll<HTMLElement>(SELECTOR);
  boxes.forEach((el) => {
    el.style.transform = "none";
    el.style.height = "";
    el.removeAttribute("data-print-sparse");

    /* A breather section — one line, one statement — measures a fifth of the
       sheet at paper type sizes and prints as a nearly empty page. Flag it so
       it gets statement-sized type instead, then re-measure: scaling UP is not
       an option here, because a uniform scale on a full-width box pushes the
       left edge of the text off the sheet. */
    if (el.scrollHeight < PAGE_H * 0.45) el.dataset.printSparse = "true";

    const natural = el.scrollHeight;
    /* 2px of tolerance: a section built to fill the page measures a rounded
       pixel over it, and scaling that by 0.97 for nothing costs a visible
       margin on the cover. */
    const k = natural > PAGE_H + 2 ? FIT_H / natural : 1;

    if (k < 1) {
      /* Pin the box to its page and scale from the top edge, so the scaled
         content lands exactly on the sheet AND the layout box is one page.
         Scaling a natural-height box instead (with flex centering) paints
         correctly but leaves a box taller than the sheet, which Chrome
         paginates into a trailing blank page. */
      el.style.height = "100%";
      el.style.transformOrigin = "top center";
      el.style.transform = `scale(${k.toFixed(4)})`;
    } else {
      el.style.transformOrigin = "center center";
      el.style.transform = "";
    }

    /* left on the element so a rendered PDF can be audited without guessing
       which sections were scaled */
    el.dataset.printFitScale = k.toFixed(3);
    el.dataset.printFitNatural = String(Math.round(natural));
  });
  return boxes.length;
}

/* Paper is 210mm tall; screen rhythm assumes a scrolling viewport with no
   such ceiling. Without a type scale and figure ceilings for print, sections
   measure 1.5–2.4 pages each and the only remedy left is a uniform scale
   that strands the content in the middle half of the sheet. */
const CSS = `
@page { size: ${mm(PAGE_W)} ${mm(PAGE_H)}; margin: 0; }

main.print-mode.pdf-pages { width: ${MEASURE_W}px; margin-inline: auto; }

main.print-mode.pdf-pages > section {
  height: ${PAGE_H}px;
  min-height: ${PAGE_H}px;
  max-height: ${PAGE_H}px;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding-top: 0;
  padding-bottom: 0;
}

/* No transform-origin here on purpose: every declaration in this sheet goes
   out !important, and an !important stylesheet rule beats an inline style — it
   was silently overriding the origin PrintPager sets per section, which
   re-centred scaled content and pushed its last lines off the sheet. */
main.print-mode.pdf-pages > section > [data-print-fit] {
  width: 100%;
  padding-block: ${PAD}px;
}

/* full-page inner wrappers (a hero) measure to the sheet, not the viewport */
main.print-mode.pdf-pages .min-h-screen { min-height: ${PAGE_H - 2 * PAD}px; }

/* a nested <section> is content, not a page */
main.print-mode.pdf-pages section section {
  height: auto;
  min-height: 0;
  max-height: none;
  overflow: visible;
  display: block;
}

main.print-mode.pdf-pages h1 { font-size: 3rem; line-height: 1.02; }
main.print-mode.pdf-pages h2 { font-size: 2.1rem; line-height: 1.06; }
main.print-mode.pdf-pages h3 { font-size: 1.2rem; line-height: 1.2; }
main.print-mode.pdf-pages .text-xl,
main.print-mode.pdf-pages .text-2xl,
main.print-mode.pdf-pages .text-lg { font-size: 0.95rem; line-height: 1.45; }
main.print-mode.pdf-pages p,
main.print-mode.pdf-pages li { font-size: 0.78rem; line-height: 1.4; }
main.print-mode.pdf-pages .text-sm { font-size: 0.74rem; }

main.print-mode.pdf-pages .mb-14,
main.print-mode.pdf-pages .mb-16,
main.print-mode.pdf-pages .mb-12 { margin-bottom: 0.85rem; }
main.print-mode.pdf-pages .mb-8,
main.print-mode.pdf-pages .mb-6 { margin-bottom: 0.6rem; }
main.print-mode.pdf-pages .mt-16,
main.print-mode.pdf-pages .mt-14,
main.print-mode.pdf-pages .mt-12 { margin-top: 0.9rem; }
main.print-mode.pdf-pages .mt-10,
main.print-mode.pdf-pages .mt-8,
main.print-mode.pdf-pages .mt-6 { margin-top: 0.6rem; }
main.print-mode.pdf-pages .mt-4 { margin-top: 0.45rem; }
main.print-mode.pdf-pages .gap-y-10,
main.print-mode.pdf-pages .gap-10,
main.print-mode.pdf-pages .gap-8 { gap: 0.75rem; }
main.print-mode.pdf-pages .py-14,
main.print-mode.pdf-pages .py-16 { padding-block: 0.75rem; }
main.print-mode.pdf-pages .pt-8 { padding-top: 0.6rem; }

/* a page with little on it reads as a statement, so give it statement type */
main.print-mode.pdf-pages [data-print-sparse] h2 { font-size: 2.8rem; }
main.print-mode.pdf-pages [data-print-sparse] .text-xl,
main.print-mode.pdf-pages [data-print-sparse] .text-2xl,
main.print-mode.pdf-pages [data-print-sparse] .text-lg { font-size: 1.35rem; line-height: 1.5; }
main.print-mode.pdf-pages [data-print-sparse] p,
main.print-mode.pdf-pages [data-print-sparse] li { font-size: 1.1rem; line-height: 1.55; }
main.print-mode.pdf-pages [data-print-sparse] .text-sm { font-size: 0.95rem; }

main.print-mode.pdf-pages [class*="rounded-2xl"],
main.print-mode.pdf-pages [class*="rounded-xl"] { padding: 0.7rem; }

/* figures are the tallest single thing in a deck; cap them so a diagram and
   its caption share the sheet */
main.print-mode.pdf-pages svg[role="img"] {
  max-height: 330px;
  height: auto;
  width: auto;
  max-width: 100%;
  margin-inline: auto;
  display: block;
}

/* opt-out for a figure that is all small type — a case timeline at the
   general ceiling prints too small to read, and its page has the room */
main.print-mode.pdf-pages svg.print-figure-tall { max-height: 470px; }

@media print {
  /* On paper the geometry becomes relative, because 100vh and 100% ARE the
     page box: px would risk a sub-pixel overflow, and one overflowing pixel
     per section means one blank page per section. */
  main.print-mode.pdf-pages { width: 100%; }

  main.print-mode.pdf-pages > section {
    height: 100vh;
    min-height: 100vh;
    max-height: 100vh;
    break-before: page;
    break-inside: avoid;
  }

  main.print-mode.pdf-pages > section:first-of-type { break-before: auto; }
  main.print-mode.pdf-pages > section:last-of-type { break-after: avoid; }

  main.print-mode.pdf-pages section section {
    height: auto;
    min-height: 0;
    max-height: none;
    break-before: auto;
    display: block;
  }
}
`;

/* Every declaration goes out as !important. Two reasons: these rules exist to
   override the deck's own screen utilities, and a dev server that has cached an
   earlier copy of them would otherwise win on source order. */
const IMPORTANT = CSS.replace(/([a-z-]+\s*:\s*[^;{}]+);/g, "$1 !important;");

/**
 * Mount inside a deck whose <main> carries `pdf-pages`, when `?print` is on.
 * Publishes the page geometry and re-fits on font load and before printing.
 */
export function PrintPager({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    fitAll();

    /* Web fonts land after first paint and change every measurement. */
    document.fonts?.ready.then(() => fitAll());
    const settle = setTimeout(fitAll, 400);

    const onBeforePrint = () => fitAll();
    window.addEventListener("beforeprint", onBeforePrint);
    const ro = new ResizeObserver(() => fitAll());
    document
      .querySelectorAll<HTMLElement>("main.pdf-pages > section")
      .forEach((s) => ro.observe(s));

    return () => {
      clearTimeout(settle);
      window.removeEventListener("beforeprint", onBeforePrint);
      ro.disconnect();
    };
  }, [enabled]);

  if (!enabled) return null;
  return <style>{IMPORTANT}</style>;
}
