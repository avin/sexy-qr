import type { CodePresetKey, PlaygroundConfig } from './playgroundConfig';

/**
 * Placeholder marker embedded in a code template. It marks the exact spot
 * where an interactive control is rendered in the editor and where the
 * serialized value is substituted into the copied code.
 *
 * Everything around the markers is plain TypeScript source that is syntax
 * highlighted with Prism — no hand-rolled JSX code layout.
 */
export const PLACEHOLDER_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Standard configuration template — used by every preset except `resolver`.
 * Radii are exposed as live sliders (ConfigField).
 */
const STANDARD_TEMPLATE = `import { QRCode, QRSvg } from 'sexy-qr';

const qrCode = new QRCode({
  content: {{content}},
  ecl: {{ecl}},
});

const qrSvg = new QRSvg(qrCode, {
  size: {{size}},
  fill: {{fill}},
  outerCornerRadius: {{outerCornerRadius}},
  innerCornerRadius: {{innerCornerRadius}},
  cornerBlockOuter: {
    outerCornerRadius: {{finderOuterRadius}},
    innerCornerRadius: {{finderInnerRadius}},
  },
  cornerBlockInner: {
    outerCornerRadius: {{finderCoreRadius}},
  },
});

const svgCode = qrSvg.svg;`;

/**
 * Resolver preset — radii are computed at runtime by a custom
 * `resolveCornerRadius` callback, so they are shown as static source rather
 * than interactive sliders.
 */
const RESOLVER_TEMPLATE = `import { QRCode, QRSvg } from 'sexy-qr';

const qrCode = new QRCode({
  content: {{content}},
  ecl: {{ecl}},
});

const qrSvg = new QRSvg(qrCode, {
  size: {{size}},
  fill: {{fill}},
  outerCornerRadius: 0,
  innerCornerRadius: 0,
  resolveCornerRadius: (corner) => {
    const isCornerBlockRing = corner.region === 'cornerBlock' && corner.part === 'ring';

    const isOutwardCorner =
      (corner.block === 'topLeft' && corner.corner === 'topLeft') ||
      (corner.block === 'topRight' && corner.corner === 'topRight') ||
      (corner.block === 'bottomLeft' && corner.corner === 'bottomLeft');

    if (isCornerBlockRing && isOutwardCorner) {
      return corner.contour === 'outer' ? 4.3 : 2.8;
    }

    return corner.defaultRadius;
  },
});

const svgCode = qrSvg.svg;`;

/**
 * Branded preset — a logo is stamped into the center of the QR. The center
 * modules are cleared with `emptyCenter()` and a `postContent` callback injects
 * an SVG `<image>` that fills the hole, exactly like the classic master-branch
 * demo's "cut a square out of the QR and drop a picture in".
 *
 * The hole is large (~38% of the matrix), so error correction is pinned to the
 * highest level (H, ~30% recovery) to keep the code reliably scannable.
 */
const BRANDED_TEMPLATE = `import { QRCode, QRSvg } from 'sexy-qr';

const qrCode = new QRCode({
  content: {{content}},
  // Highest error-correction level: a large logo cutout eats ~14% of the
  // modules, so we need H's ~30% recovery headroom to stay scannable.
  ecl: 'H',
});

// Carve a large, odd-sized square out of the matrix center so the logo has
// real presence (odd size keeps it perfectly centered on a module boundary).
const emptyCenterSize = 2 * Math.round((qrCode.size * 0.38) / 2) - 1;
qrCode.emptyCenter(emptyCenterSize);

const qrSvg = new QRSvg(qrCode, {
  size: {{size}},
  fill: {{fill}},
  outerCornerRadius: 0.7,
  innerCornerRadius: 0.45,
  cornerBlockOuter: {
    outerCornerRadius: 3.5,
    innerCornerRadius: 2.1,
  },
  cornerBlockInner: {
    outerCornerRadius: 1.2,
  },
  postContent: (qrSvg) => {
    const start =
      (qrSvg.matrixSize / 2 - emptyCenterSize / 2) * qrSvg.pointSize + qrSvg.pointSize / 2;
    const size = emptyCenterSize * qrSvg.pointSize - qrSvg.pointSize;
    const logoSrc = 'data:image/svg+xml;base64,' + btoa(BRAND_LOGO_SVG);
    return \`<image x="\${start}" y="\${start}" width="\${size}" height="\${size}" href="\${logoSrc}" />\`;
  },
});

const svgCode = qrSvg.svg;`;

/** Picks the source template backing a given preset. */
export function templateForPreset(presetKey: CodePresetKey): string {
  if (presetKey === 'resolver') return RESOLVER_TEMPLATE;
  if (presetKey === 'branded') return BRANDED_TEMPLATE;
  return STANDARD_TEMPLATE;
}

/**
 * Turns a template into the plain string that gets copied to the clipboard:
 * every `{{id}}` marker is replaced with the serialized value produced by the
 * matching serializer. Unknown markers are left untouched so the code stays
 * syntactically valid even if a serializer is missing.
 */
export function serializeTemplate(
  template: string,
  config: PlaygroundConfig,
  serializers: Record<string, (config: PlaygroundConfig) => string>,
): string {
  return template.replace(PLACEHOLDER_PATTERN, (match, id: string) =>
    serializers[id] ? serializers[id](config) : match,
  );
}
