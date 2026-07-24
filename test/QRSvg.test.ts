import { describe, it, expect } from 'vitest';
import { QRCode, QRSvg, QRSvgPresets, type CornerContext } from '../src';

const CONTENT = 'https://avin.github.io/sexy-qr';

const makeQrCode = () => new QRCode({ content: CONTENT, ecl: 'M' });

const makeSvg = (options: ConstructorParameters<typeof QRSvg>[1] = { size: 380 }) =>
  new QRSvg(makeQrCode(), options);

describe('QRSvg', () => {
  describe('constructor / validation', () => {
    it('throws when size is not a positive number', () => {
      expect(() => makeSvg({ size: 0 })).toThrow(/higher than zero/);
      expect(() => makeSvg({ size: -10 })).toThrow(/higher than zero/);
      expect(() => makeSvg({ size: NaN })).toThrow(/higher than zero/);
    });

    it('throws a TypeError when a radius option is non-finite', () => {
      expect(() => makeSvg({ size: 100, outerCornerRadius: NaN })).toThrow(TypeError);
      expect(() => makeSvg({ size: 100, outerCornerRadius: Infinity })).toThrow(TypeError);
      expect(() => makeSvg({ size: 100, outerCornerRadius: '1' as never })).toThrow(TypeError);
    });

    it('clamps negative radii to 0 without throwing', () => {
      const svg = makeSvg({
        size: 100,
        outerCornerRadius: -5,
        cornerBlockOuter: { outerCornerRadius: -1, innerCornerRadius: -1 },
        cornerBlockInner: { outerCornerRadius: -1 },
      });

      expect(svg.svg).toContain('<svg');
    });

    it('throws a TypeError when a cornerBlock option is not an object', () => {
      expect(() => makeSvg({ size: 100, cornerBlockOuter: 5 as never })).toThrow(TypeError);
      expect(() => makeSvg({ size: 100, cornerBlockOuter: null as never })).toThrow(TypeError);
      expect(() => makeSvg({ size: 100, cornerBlockOuter: [1] as never })).toThrow(TypeError);
      expect(() => makeSvg({ size: 100, cornerBlockInner: 'x' as never })).toThrow(TypeError);
    });
  });

  describe('matrixSize & pointSize', () => {
    it('exposes the QR matrix size', () => {
      const qr = makeQrCode();
      const svg = new QRSvg(qr, { size: 380 });

      expect(svg.matrixSize).toBe(qr.size);
    });

    it('computes pointSize as size / matrixSize', () => {
      const qr = makeQrCode();
      const svg = new QRSvg(qr, { size: 380 });

      expect(svg.pointSize).toBeCloseTo(380 / qr.size, 5);
    });
  });

  describe('svg output', () => {
    it('returns a valid <svg> document with the configured size and fill', () => {
      const svg = makeSvg({ size: 256, fill: '#182026' });

      expect(svg.svg).toContain('<svg');
      expect(svg.svg).toContain('</svg>');
      expect(svg.svg).toContain('width="256"');
      expect(svg.svg).toContain('height="256"');
      expect(svg.svg).toContain('viewBox="0 0 256 256"');
      expect(svg.svg).toContain('fill="#182026"');
    });

    it('defaults fill to currentColor', () => {
      const svg = makeSvg({ size: 100 });

      expect(svg.svg).toContain('fill="currentColor"');
    });

    it('contains one <path> per connected dark region', () => {
      const svg = makeSvg({ size: 200 });

      expect(svg.paths.length).toBeGreaterThan(0);
      for (const path of svg.paths) {
        expect(path.startsWith('<path d="')).toBe(true);
        expect(path.endsWith('"/>')).toBe(true);
      }
      // The full svg joins every path.
      for (const path of svg.paths) {
        expect(svg.svg).toContain(path);
      }
    });

    it('produces deterministic output for identical input', () => {
      const a = makeSvg({ size: 200 });
      const b = makeSvg({ size: 200 });

      expect(a.svg).toBe(b.svg);
      expect(a.paths).toEqual(b.paths);
    });

    it('renders different paths for different rounding options', () => {
      const square = makeSvg({ size: 200, ...QRSvgPresets.square });
      const circle = makeSvg({ size: 200, ...QRSvgPresets.circleCornerBlocks });

      expect(square.paths).not.toEqual(circle.paths);
    });
  });

  describe('preContent / postContent', () => {
    it('injects a string preContent into the SVG', () => {
      const svg = makeSvg({ size: 100, preContent: '<!-- QR Code -->' });

      expect(svg.svg).toContain('<!-- QR Code -->');
    });

    it('injects a string postContent into the SVG', () => {
      const svg = makeSvg({ size: 100, postContent: '<title>qr</title>' });

      expect(svg.svg).toContain('<title>qr</title>');
    });

    it('supports function preContent/postContent that receive the QRSvg instance', () => {
      const preContent = (instance: QRSvg) => `<!-- size ${instance.pointSize.toFixed(1)} -->`;
      const svg = makeSvg({ size: 100, preContent });

      expect(svg.svg).toContain(`<!-- size ${svg.pointSize.toFixed(1)} -->`);
    });

    it('omits additional content when not provided', () => {
      const svg = makeSvg({ size: 100 });

      expect(svg.svg).toContain('<svg');
      expect(svg.svg).toContain('</svg>');
    });
  });

  describe('resolveCornerRadius callback', () => {
    it('is invoked for contour corners with a full CornerContext', () => {
      const seen: CornerContext[] = [];
      makeSvg({
        size: 200,
        resolveCornerRadius: (ctx) => {
          seen.push(ctx);
          return ctx.defaultRadius;
        },
      });

      expect(seen.length).toBeGreaterThan(0);
      for (const ctx of seen) {
        expect(['data', 'cornerBlock']).toContain(ctx.region);
        expect(['outer', 'inner']).toContain(ctx.contour);
        expect(['topLeft', 'topRight', 'bottomRight', 'bottomLeft']).toContain(ctx.corner);
        expect(ctx).toHaveProperty('vertex');
        expect(ctx).toHaveProperty('cell');
        expect(typeof ctx.defaultRadius).toBe('number');
      }
    });

    it('overrides the radius when the callback returns a number', () => {
      const allZero = makeSvg({ size: 200, outerCornerRadius: 0, innerCornerRadius: 0 });
      const allRounded = makeSvg({
        size: 200,
        outerCornerRadius: 0,
        innerCornerRadius: 0,
        resolveCornerRadius: () => 1,
      });

      // Returning 1 introduces arc commands (A) that the all-zero version lacks.
      expect(allRounded.svg).toMatch(/A\d/);
      expect(allZero.svg).not.toMatch(/A\d/);
    });

    it('falls back to defaultRadius when the callback returns undefined', () => {
      const fallback = makeSvg({
        size: 200,
        outerCornerRadius: 0,
        innerCornerRadius: 0,
        resolveCornerRadius: () => undefined,
      });
      const baseline = makeSvg({ size: 200, outerCornerRadius: 0, innerCornerRadius: 0 });

      expect(fallback.svg).toBe(baseline.svg);
    });

    it('tags corner-block corners with region/part/block info', () => {
      const blocks = new Set<string>();
      makeSvg({
        size: 200,
        ...QRSvgPresets.circleCornerBlocks,
        resolveCornerRadius: (ctx) => {
          if (ctx.region === 'cornerBlock') {
            blocks.add(`${ctx.block}:${ctx.part}`);
          }
          return ctx.defaultRadius;
        },
      });

      // Every QR has three finder blocks; each has a ring and a center.
      expect(blocks.has('topLeft:ring')).toBe(true);
      expect(blocks.has('topRight:ring')).toBe(true);
      expect(blocks.has('bottomLeft:ring')).toBe(true);
      expect(blocks.has('topLeft:center')).toBe(true);
    });

    it('throws a TypeError when the callback returns a non-finite number', () => {
      expect(() =>
        makeSvg({
          size: 200,
          resolveCornerRadius: () => NaN,
        }),
      ).toThrow(TypeError);
    });
  });

  describe('integration with QRCode.emptyCenter', () => {
    it('still renders valid SVG after clearing the center', () => {
      const qr = makeQrCode();
      qr.emptyCenter(6);

      const svg = new QRSvg(qr, { size: 200 });

      expect(svg.svg).toContain('<svg');
      expect(svg.paths.length).toBeGreaterThan(0);
    });
  });
});
