// Openstage's site pages beyond the home (brand setup, settings, the password gate) in the
// Human Quest family look ("The Path", 8 Nov 2026). A page wraps itself in `os-site` and renders
// <OpenstageSiteFonts />; the rules live in openstage-home.css. Deck pages never use this.
import "@/components/hq-path/hq-path.css";
import "./openstage-home.css";

/* Next drops the kit's own `@import url(...)` for these fonts, so the page loads them itself.
   React hoists this <link> into <head>. */
const HQ_FONTS =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..600&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

export function OpenstageSiteFonts() {
  return <link rel="stylesheet" href={HQ_FONTS} precedence="default" />;
}
