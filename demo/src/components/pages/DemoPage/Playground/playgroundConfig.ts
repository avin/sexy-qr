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
} satisfies Record<string, { label: string; radii: RadiusConfig }>;

export type CodePresetKey = keyof typeof codePresets;

export const codePresetOptions = Object.entries(codePresets).map(([value, preset]) => ({
  value: value as CodePresetKey,
  label: preset.label,
}));

const baseConfig = {
  content: 'https://github.com/avin/sexy-qr',
  ecl: 'M',
  size: 420,
  fill: '#171717',
} satisfies Omit<PlaygroundConfig, keyof RadiusConfig>;

export const initialPreset: CodePresetKey = 'soft';

export const initialConfig: PlaygroundConfig = {
  ...baseConfig,
  ...codePresets[initialPreset].radii,
};

export function applyCodePreset(config: PlaygroundConfig, presetKey: CodePresetKey): PlaygroundConfig {
  return {
    ...config,
    ...codePresets[presetKey].radii,
  };
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

export function createUsageCode(config: PlaygroundConfig, presetKey: CodePresetKey) {
  const radiusOptions =
    presetKey === 'resolver'
      ? `  outerCornerRadius: 0,
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
  },`
      : `  outerCornerRadius: ${config.outerCornerRadius},
  innerCornerRadius: ${config.innerCornerRadius},
  cornerBlockOuter: {
    outerCornerRadius: ${config.finderOuterRadius},
    innerCornerRadius: ${config.finderInnerRadius},
  },
  cornerBlockInner: {
    outerCornerRadius: ${config.finderCoreRadius},
  },`;

  return `import { QRCode, QRSvg } from 'sexy-qr';

const qrCode = new QRCode({
  content: ${JSON.stringify(config.content)},
  ecl: '${config.ecl}',
});

const qrSvg = new QRSvg(qrCode, {
  size: ${config.size},
  fill: ${JSON.stringify(config.fill)},
${radiusOptions}
});

const svgCode = qrSvg.svg;`;
}
