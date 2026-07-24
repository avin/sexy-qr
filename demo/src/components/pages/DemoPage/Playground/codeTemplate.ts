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

/** Picks the source template backing a given preset. */
export function templateForPreset(presetKey: CodePresetKey): string {
  return presetKey === 'resolver' ? RESOLVER_TEMPLATE : STANDARD_TEMPLATE;
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
