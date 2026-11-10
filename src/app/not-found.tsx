// The 404 in the Human Quest family look (The Path): the framework's own words, on the Path paper by
// day and after sunset by night. The <title> is the one the framework's default 404 used.
//
// Why everything is inside one inline <style>: Next ships the root not-found tree inside every page's
// payload, and React preloads any stylesheet <link> it finds there, so a CSS import or a font <link>
// here would be fetched on every deck as well (and unused there). An inline <style> (fonts through its
// own @import) only takes effect when this page actually shows. The colours are the Path kit's paper,
// ink and Openstage brand values (hq-path.css), day and night.
const FONTS =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..600&family=JetBrains+Mono:wght@400;500&display=swap";

const CSS = `@import url("${FONTS}");
.os-404{--p:#f6efe3;--i:#24170f;--e:#d24e33;min-height:100vh;display:grid;place-content:center;justify-items:center;gap:18px;padding:48px clamp(16px,4vw,56px);text-align:center;background:var(--p);color:var(--i);transition:background .6s ease,color .6s ease}
:root[data-theme="night"] .os-404{--p:#1c130e;--i:#f3e8d8;--e:#d76149}
.os-404 p{margin:0;font:500 12px/1.2 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--e)}
.os-404 h1{margin:0;max-width:14ch;font-family:"Fraunces",Georgia,serif;font-weight:400;font-size:clamp(40px,6vw,76px);line-height:1;letter-spacing:-.025em;font-variation-settings:"opsz" 144,"SOFT" 50;text-wrap:balance}
.os-404 em{font-style:italic;font-weight:300;color:var(--e)}
`;

export default function NotFound() {
  return (
    <div className="os-404">
      <title>404: This page could not be found.</title>
      <style>{CSS}</style>
      <p>404</p>
      <h1>
        This page could not be <em>found</em>.
      </h1>
    </div>
  );
}
