import { ReactNode } from "react";

export type SlideTransition =
  | "fade"
  | "slide"
  | "blur"
  | "zoom"
  | "mask"
  | "none";

export interface Slide {
  id: string;
  content: ReactNode;
  notes?: string;
  speaker?: string;
  layout?: "title" | "default" | "split" | "center" | "code" | "quote";
  /** Per-slide transition variant (defaults to "slide") */
  transition?: SlideTransition;
  /** Optional data-mood applied to the slide container (warm/cool/mono/night/dawn) */
  mood?: "warm" | "cool" | "mono" | "night" | "dawn";
}

export interface Presentation {
  slug: string;
  title: string;
  subtitle?: string;
  author: string;
  date: string;
  description: string;
  slides: Slide[];
  accentColor?: string;
}
