import { describe, it, expect } from 'vitest';
import { QRSvgPresets } from '../src';

describe('QRSvgPresets', () => {
  it('exposes all four documented presets', () => {
    expect(Object.keys(QRSvgPresets).sort()).toEqual([
      'circleCornerBlocks',
      'rounded',
      'roundedWithCircleCornerBlocks',
      'square',
    ]);
  });

  it('each preset exposes the full radius surface', () => {
    for (const name of Object.keys(QRSvgPresets) as (keyof typeof QRSvgPresets)[]) {
      const preset = QRSvgPresets[name];

      expect(typeof preset.outerCornerRadius).toBe('number');
      expect(typeof preset.innerCornerRadius).toBe('number');
      expect(typeof preset.cornerBlockOuter.outerCornerRadius).toBe('number');
      expect(typeof preset.cornerBlockOuter.innerCornerRadius).toBe('number');
      expect(typeof preset.cornerBlockInner.outerCornerRadius).toBe('number');
    }
  });

  it('square preset has every radius at 0', () => {
    const p = QRSvgPresets.square;

    expect(p.outerCornerRadius).toBe(0);
    expect(p.innerCornerRadius).toBe(0);
    expect(p.cornerBlockOuter.outerCornerRadius).toBe(0);
    expect(p.cornerBlockOuter.innerCornerRadius).toBe(0);
    expect(p.cornerBlockInner.outerCornerRadius).toBe(0);
  });

  it('rounded preset uses 1 for every radius', () => {
    const p = QRSvgPresets.rounded;

    expect(p.outerCornerRadius).toBe(1);
    expect(p.innerCornerRadius).toBe(1);
    expect(p.cornerBlockOuter.outerCornerRadius).toBe(1);
    expect(p.cornerBlockOuter.innerCornerRadius).toBe(1);
    expect(p.cornerBlockInner.outerCornerRadius).toBe(1);
  });

  it('circleCornerBlocks only rounds the corner blocks', () => {
    const p = QRSvgPresets.circleCornerBlocks;

    expect(p.outerCornerRadius).toBe(0);
    expect(p.innerCornerRadius).toBe(0);
    expect(p.cornerBlockOuter.outerCornerRadius).toBe(7);
    expect(p.cornerBlockOuter.innerCornerRadius).toBe(5);
    expect(p.cornerBlockInner.outerCornerRadius).toBe(3);
  });

  it('roundedWithCircleCornerBlocks rounds data cells and corner blocks', () => {
    const p = QRSvgPresets.roundedWithCircleCornerBlocks;

    expect(p.outerCornerRadius).toBe(1);
    expect(p.innerCornerRadius).toBe(1);
    expect(p.cornerBlockOuter.outerCornerRadius).toBe(7);
    expect(p.cornerBlockOuter.innerCornerRadius).toBe(5);
    expect(p.cornerBlockInner.outerCornerRadius).toBe(3);
  });

  describe('immutability', () => {
    it('the presets container itself is frozen', () => {
      expect(Object.isFrozen(QRSvgPresets)).toBe(true);
    });

    it.each([
      ['square', QRSvgPresets.square],
      ['rounded', QRSvgPresets.rounded],
      ['circleCornerBlocks', QRSvgPresets.circleCornerBlocks],
      ['roundedWithCircleCornerBlocks', QRSvgPresets.roundedWithCircleCornerBlocks],
    ])('preset %s and its nested objects are frozen', (_name, preset) => {
      expect(Object.isFrozen(preset)).toBe(true);
      expect(Object.isFrozen(preset.cornerBlockOuter)).toBe(true);
      expect(Object.isFrozen(preset.cornerBlockInner)).toBe(true);
    });

    it('rejects attempts to mutate a preset value', () => {
      const preset = QRSvgPresets.rounded;

      // Frozen objects throw in strict mode (ES modules run in strict mode),
      // so a thrown TypeError is itself proof of immutability.
      expect(() => {
        // @ts-expect-error — intentional mutation attempt on a frozen object
        preset.outerCornerRadius = 42;
      }).toThrow(TypeError);

      expect(preset.outerCornerRadius).toBe(1);
    });
  });
});
