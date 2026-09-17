"use client";

const loadedFonts = new Set<string>();

const SYSTEM_FONTS = new Set([
  "system-ui",
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
]);

export function loadGoogleFont(fontName: string): void {
  if (typeof window === "undefined") return;
  if (SYSTEM_FONTS.has(fontName)) return;
  if (loadedFonts.has(fontName)) return;

  loadedFonts.add(fontName);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export function loadBrandFonts(heading: string, body: string, mono: string): void {
  loadGoogleFont(heading);
  if (body !== heading) loadGoogleFont(body);
  loadGoogleFont(mono);
}

export const POPULAR_FONTS = {
  heading: [
    "Inter",
    "DM Sans",
    "Plus Jakarta Sans",
    "Poppins",
    "Manrope",
    "Outfit",
    "Space Grotesk",
    "Sora",
    "Raleway",
    "Montserrat",
    "Playfair Display",
    "Fraunces",
    "Lora",
  ],
  body: [
    "Inter",
    "DM Sans",
    "Plus Jakarta Sans",
    "Source Sans 3",
    "Nunito Sans",
    "Open Sans",
    "Lato",
    "Roboto",
    "IBM Plex Sans",
    "Noto Sans",
  ],
  mono: [
    "JetBrains Mono",
    "Fira Code",
    "Source Code Pro",
    "IBM Plex Mono",
    "Roboto Mono",
    "Space Mono",
  ],
};
