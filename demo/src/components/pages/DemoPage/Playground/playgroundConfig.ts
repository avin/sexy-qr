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

export const initialConfig: PlaygroundConfig = {
  content: 'https://github.com/avin/sexy-qr',
  ecl: 'M',
  size: 420,
  fill: '#171717',
  outerCornerRadius: 0.9,
  innerCornerRadius: 0.65,
  finderOuterRadius: 6,
  finderInnerRadius: 4,
  finderCoreRadius: 2.4,
};

export function createUsageCode(config: PlaygroundConfig) {
  return `import { QRCode, QRSvg } from 'sexy-qr';

const qrCode = new QRCode({
  content: ${JSON.stringify(config.content)},
  ecl: '${config.ecl}',
});

const qrSvg = new QRSvg(qrCode, {
  size: ${config.size},
  fill: ${JSON.stringify(config.fill)},
  outerCornerRadius: ${config.outerCornerRadius},
  innerCornerRadius: ${config.innerCornerRadius},
  cornerBlockOuter: {
    outerCornerRadius: ${config.finderOuterRadius},
    innerCornerRadius: ${config.finderInnerRadius},
  },
  cornerBlockInner: {
    outerCornerRadius: ${config.finderCoreRadius},
  },
});

const svgCode = qrSvg.svg;`;
}
