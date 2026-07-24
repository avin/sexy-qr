import { describe, it, expect } from 'vitest';
import { QRCode, QRSvg, QRSvgPresets } from '../src';

// Regression snapshots for the path/SVG geometry.
//
// QR generation is deterministic for a fixed (content, ecl) pair — the mask
// pattern is chosen by a pure lost-point score — so these snapshots are stable
// across runs and machines. Any drift in path coordinates, rounding, sweep
// flags, or structure will fail here even when the high-level API still "works".
//
// Update the baselines after an intentional geometry change with:
//   npx vitest run -u

// Fixed inputs mirror the README usage example.
const QR = new QRCode({ content: 'https://avin.github.io/sexy-qr', ecl: 'M' });

const build = (options: ConstructorParameters<typeof QRSvg>[1]) => new QRSvg(QR, options);

describe('QRSvg geometry snapshots', () => {
  describe('per-preset path arrays', () => {
    it('square', () => {
      expect(build({ size: 380, ...QRSvgPresets.square }).paths).toMatchSnapshot();
    });

    it('rounded', () => {
      expect(build({ size: 380, ...QRSvgPresets.rounded }).paths).toMatchSnapshot();
    });

    it('circleCornerBlocks', () => {
      expect(build({ size: 380, ...QRSvgPresets.circleCornerBlocks }).paths).toMatchSnapshot();
    });

    it('roundedWithCircleCornerBlocks', () => {
      expect(build({ size: 380, ...QRSvgPresets.roundedWithCircleCornerBlocks }).paths).toMatchSnapshot();
    });
  });

  describe('full SVG document', () => {
    it('roundedWithCircleCornerBlocks with fill + preContent', () => {
      const svg = build({
        size: 380,
        ...QRSvgPresets.roundedWithCircleCornerBlocks,
        fill: '#182026',
        preContent: '<!-- QR Code -->',
      });

      expect(svg.svg).toMatchSnapshot();
    });
  });

  describe('resolveCornerRadius override', () => {
    it('rounds only the topRight corner-block ring bottomLeft outer corner (README example)', () => {
      const svg = build({
        size: 380,
        ...QRSvgPresets.roundedWithCircleCornerBlocks,
        resolveCornerRadius: (cornerCtx) => {
          const isTargetCorner =
            cornerCtx.region === 'cornerBlock' &&
            cornerCtx.block === 'topRight' &&
            cornerCtx.part === 'ring' &&
            cornerCtx.corner === 'bottomLeft';

          if (!isTargetCorner) {
            return cornerCtx.defaultRadius;
          }

          return cornerCtx.contour === 'outer' ? 2 : 1;
        },
      });

      expect(svg.paths).toMatchSnapshot();
    });

    it('uniform radius 1 across every corner', () => {
      const svg = build({
        size: 380,
        resolveCornerRadius: () => 1,
      });

      expect(svg.paths).toMatchSnapshot();
    });
  });

  describe('pointSize', () => {
    it('matches size / matrixSize for the canonical inputs', () => {
      expect(build({ size: 380 }).pointSize).toMatchSnapshot();
    });
  });
});
