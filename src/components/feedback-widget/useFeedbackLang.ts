"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FeedbackLang } from "./feedback-i18n";

function detectLang(): FeedbackLang {
  if (typeof document === "undefined") return "en";

  const htmlLang = document.documentElement.lang;
  if (htmlLang?.startsWith("ar")) return "ar";

  const rtlEl = document.querySelector(
    "[dir='rtl']:not(#feedback-widget-root):not(#feedback-widget-root *)"
  );
  if (rtlEl) return "ar";

  if (typeof navigator !== "undefined" && navigator.language?.startsWith("ar"))
    return "ar";

  return "en";
}

export function useFeedbackLang() {
  const [lang, setLang] = useState<FeedbackLang>(() => detectLang());
  const manualRef = useRef(false);

  useEffect(() => {
    setLang(detectLang());

    const observer = new MutationObserver(() => {
      if (manualRef.current) return;
      setLang(detectLang());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang", "dir"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["dir"],
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  const toggle = useCallback(() => {
    manualRef.current = true;
    setLang((l) => (l === "ar" ? "en" : "ar"));
  }, []);

  return { lang, setLang, toggle };
}
