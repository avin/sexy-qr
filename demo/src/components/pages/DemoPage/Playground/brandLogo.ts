/**
 * Inline brand mark stamped into the center of the "Branded" preset QR.
 *
 * It is a plain SVG source string so the demo can drop it straight into a
 * `data:image/svg+xml;base64,...` URI inside the `postContent` hook — the same
 * trick the classic master-branch demo used to "cut a square out of the QR and
 * drop a picture in". The viewBox is square so it scales cleanly to whatever
 * hole `emptyCenter()` carves out.
 *
 * Design: an indigo → violet → pink gradient badge with a glossy sheen and a
 * concave four-point sparkle (plus a small companion) — readable even when the
 * cutout is only a handful of modules wide.
 */
export const brandLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Brand logo">
  <defs>
    <linearGradient id="brand-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="52%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
    <linearGradient id="brand-sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.38"/>
      <stop offset="48%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="96" height="96" rx="22" ry="22" fill="url(#brand-bg)"/>
  <rect x="2" y="2" width="96" height="96" rx="22" ry="22" fill="url(#brand-sheen)"/>
  <path d="M50 19 C54.6 37.6 62.4 45.4 81 50 C62.4 54.6 54.6 62.4 50 81 C45.4 62.4 37.6 54.6 19 50 C37.6 45.4 45.4 37.6 50 19 Z" fill="#ffffff"/>
  <path d="M76 23 C77.4 28.1 80.9 30.9 86 32.3 C80.9 33.7 77.4 36.5 76 41.6 C74.6 36.5 71.1 33.7 66 32.3 C71.1 30.9 74.6 28.1 76 23 Z" fill="#ffffff" fill-opacity="0.92"/>
</svg>`;
