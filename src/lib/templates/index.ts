/**
 * Templates barrel.
 *
 * The framework ships exactly two templates, one per mode:
 *   - `scroll`  — immersive scroll narrative (Phase 2 primitives)
 *   - `slides`  — traditional deck with Awwwards-tier slide layouts
 *
 * Narrative posture (problem-solution, status-direction, etc.) is passed in
 * the generation brief, not selected as a separate template.
 */

export type {
  Template,
  TemplateSectionSpec,
  TemplateVariable,
  TemplateVisual,
  PresentationMode,
  ArcPhase,
  Posture,
} from "./types";

export { scrollTemplate } from "./scroll";
export { slidesTemplate } from "./slides";

import { Template, PresentationMode } from "./types";
import { scrollTemplate } from "./scroll";
import { slidesTemplate } from "./slides";

export const templates: Template[] = [scrollTemplate, slidesTemplate];

export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplatesByTag(tag: string): Template[] {
  return templates.filter((t) => t.tags.includes(tag));
}

export function getTemplatesByMode(mode: PresentationMode): Template[] {
  return templates.filter((t) => t.modes.includes(mode));
}

/**
 * Canonical template for a given mode. Used by the generator when the brief
 * doesn't specify a templateId — every scroll brief hits `scroll`, every
 * slides brief hits `slides`.
 */
export function getDefaultTemplate(mode: PresentationMode): Template {
  return mode === "slides" ? slidesTemplate : scrollTemplate;
}
