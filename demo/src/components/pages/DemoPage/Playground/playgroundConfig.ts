export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type PlaygroundConfig = {
  content: string;
  ecl: ErrorCorrectionLevel;
  size: number;
  fill: string;
  outerCornerRadius: number;
  innerCornerRadius: number;
  finderOuterRadius: number;
  finderInnerRadius: number;
  finderCoreRadius: number;
};

type RadiusConfig = Pick<
  PlaygroundConfig,
  'outerCornerRadius' | 'innerCornerRadius' | 'finderOuterRadius' | 'finderInnerRadius' | 'finderCoreRadius'
>;

export const codePresets = {
  soft: {
    label: 'Soft',
    radii: {
      outerCornerRadius: 0.9,
      innerCornerRadius: 0.65,
      finderOuterRadius: 3.9,
      finderInnerRadius: 2.3,
      finderCoreRadius: 1.3,
    },
  },
  square: {
    label: 'Square',
    radii: {
      outerCornerRadius: 0,
      innerCornerRadius: 0,
      finderOuterRadius: 0,
      finderInnerRadius: 0,
      finderCoreRadius: 0,
    },
  },
  bubbles: {
    label: 'Bubbles',
    radii: {
      outerCornerRadius: 1,
      innerCornerRadius: 1,
      finderOuterRadius: 7,
      finderInnerRadius: 5,
      finderCoreRadius: 3,
    },
  },
  cutout: {
    label: 'Cutout',
    radii: {
      outerCornerRadius: 1,
      innerCornerRadius: 0,
      finderOuterRadius: 3.5,
      finderInnerRadius: 0,
      finderCoreRadius: 1.5,
    },
  },
  resolver: {
    label: 'Resolver',
    radii: {
      outerCornerRadius: 0,
      innerCornerRadius: 0,
      finderOuterRadius: 0,
      finderInnerRadius: 0,
      finderCoreRadius: 0,
    },
  },
  branded: {
    label: 'Branded',
    radii: {
      outerCornerRadius: 0.7,
      innerCornerRadius: 0.45,
      finderOuterRadius: 3.5,
      finderInnerRadius: 2.1,
      finderCoreRadius: 1.2,
    },
  },
} satisfies Record<string, { label: string; radii: RadiusConfig }>;

export type CodePresetKey = keyof typeof codePresets;

export const codePresetOptions = Object.entries(codePresets).map(([value, preset]) => ({
  value: value as CodePresetKey,
  label: preset.label,
}));

const baseConfig = {
  content: 'https://github.com/avin/sexy-qr',
  ecl: 'M',
  size: 319,
  fill: '#171717',
} satisfies Omit<PlaygroundConfig, keyof RadiusConfig>;

export const initialPreset: CodePresetKey = 'soft';

export const initialConfig: PlaygroundConfig = {
  ...baseConfig,
  ...codePresets[initialPreset].radii,
};

export function applyCodePreset(config: PlaygroundConfig, presetKey: CodePresetKey): PlaygroundConfig {
  const nextConfig: PlaygroundConfig = {
    ...config,
    ...codePresets[presetKey].radii,
  };
  // The Branded preset punches a large hole through the matrix center, which
  // only stays scannable at the highest error-correction level — pin it to H.
  if (presetKey === 'branded') {
    nextConfig.ecl = 'H';
  }
  return nextConfig;
}

export function resolveDemoCornerRadius(corner: {
  region: 'data' | 'cornerBlock';
  block?: 'topLeft' | 'topRight' | 'bottomLeft';
  part?: 'ring' | 'center';
  contour: 'outer' | 'inner';
  corner: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';
  defaultRadius: number;
}) {
  const isCornerBlockRing = corner.region === 'cornerBlock' && corner.part === 'ring';
  const isOutwardCorner =
    (corner.block === 'topLeft' && corner.corner === 'topLeft') ||
    (corner.block === 'topRight' && corner.corner === 'topRight') ||
    (corner.block === 'bottomLeft' && corner.corner === 'bottomLeft');

  if (isCornerBlockRing && isOutwardCorner) {
    return corner.contour === 'outer' ? 4.3 : 2.8;
  }

  return corner.defaultRadius;
}

/**
 * Size of the square cut out of the QR's center for the "Branded" preset.
 *
 * Carves a larger hole than the classic master-branch demo — roughly 38% of
 * the matrix width (rounded to the nearest odd number so it stays perfectly
 * centered on a module boundary) — giving the logo real presence. That eats
 * ~14% of the modules, which only stays reliably scannable because the Branded
 * preset pins error correction to level H (30% recovery).
 */
export function brandedEmptyCenterSize(matrixSize: number): number {
  return 2 * Math.round((matrixSize * 0.38) / 2) - 1;
}

/**
 * `postContent` callback that paints the brand logo into the hole carved by
 * `emptyCenter()`. Returns an SVG `<image>` element sized and positioned to
 * cover the empty square in device coordinates.
 *
 * Lifted verbatim in spirit from the classic master-branch demo, but typed and
 * parameterized by a logo source so the same hook can brand the QR with any
 * inline image.
 */
export function createBrandedPostContent(logoSvg: string) {
  return (qrSvg: { matrixSize: number; pointSize: number }) => {
    const emptyCenterSize = brandedEmptyCenterSize(qrSvg.matrixSize);
    const start =
      (qrSvg.matrixSize / 2 - emptyCenterSize / 2) * qrSvg.pointSize + qrSvg.pointSize / 2;
    const size = emptyCenterSize * qrSvg.pointSize - qrSvg.pointSize;
    const logoSrc = `data:image/svg+xml;base64,${btoa(logoSvg)}`;
    return `<image x="${start}" y="${start}" width="${size}" height="${size}" href="${logoSrc}" />`;
  };
}
