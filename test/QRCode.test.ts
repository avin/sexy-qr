import { describe, it, expect } from 'vitest';
import { QRCode } from '../src';

const CONTENT = 'https://avin.github.io/sexy-qr';

describe('QRCode', () => {
  describe('constructor', () => {
    it('builds a QR code from content using the default ecl (M)', () => {
      const qr = new QRCode({ content: CONTENT });

      expect(qr.size).toBeGreaterThan(0);
      expect(qr.matrix.length).toBe(qr.size);
    });

    it.each(['L', 'M', 'Q', 'H'] as const)('accepts error correction level %s', (ecl) => {
      const qr = new QRCode({ content: 'hello', ecl });

      expect(qr.size).toBeGreaterThan(0);
    });

    it('picks the smallest matrix that fits the content (type 1 = size 21)', () => {
      // 'hello' is 5 bytes, well under type-1 limit for every ecl.
      const qr = new QRCode({ content: 'hello', ecl: 'L' });

      expect(qr.size).toBe(21);
    });

    it('grows the matrix for longer content', () => {
      const short = new QRCode({ content: 'hello', ecl: 'M' });
      const long = new QRCode({ content: CONTENT.repeat(5), ecl: 'M' });

      expect(long.size).toBeGreaterThan(short.size);
    });

    it('throws when content is empty', () => {
      expect(() => new QRCode({ content: '' })).toThrow("Expected 'content' to be non-empty!");
    });

    it('throws when content is missing', () => {
      expect(() => new QRCode({})).toThrow("Expected 'content' to be non-empty!");
    });

    it('throws for an unknown error correction level', () => {
      expect(() => new QRCode({ content: 'hello', ecl: 'X' as never })).toThrow(/error correction level/);
    });

    it('throws when content exceeds the maximum capacity', () => {
      const tooLong = 'a'.repeat(3000); // type-40 L limit is 2953 bytes

      expect(() => new QRCode({ content: tooLong, ecl: 'L' })).toThrow(/Content too long/);
    });
  });

  describe('matrix', () => {
    it('returns a square boolean grid matching size', () => {
      const qr = new QRCode({ content: CONTENT });

      for (const row of qr.matrix) {
        expect(row.length).toBe(qr.size);
        for (const cell of row) {
          expect(typeof cell).toBe('boolean');
        }
      }
    });

    it('places a finder (corner) block at the top-left 7x7 region', () => {
      const qr = new QRCode({ content: CONTENT });

      // The outer ring and 3x3 solid center of a finder pattern are always dark.
      expect(qr.matrix[0][0]).toBe(true);
      expect(qr.matrix[6][0]).toBe(true);
      expect(qr.matrix[0][6]).toBe(true);
      expect(qr.matrix[3][3]).toBe(true);
    });

    it('is deterministic for the same input', () => {
      const a = new QRCode({ content: CONTENT, ecl: 'M' });
      const b = new QRCode({ content: CONTENT, ecl: 'M' });

      expect(a.matrix).toEqual(b.matrix);
      expect(a.size).toBe(b.size);
    });
  });

  describe('emptyCenter', () => {
    // QR matrices are always odd-sized (typeNumber * 4 + 17), so size/2 is
    // fractional. These helpers mirror emptyCenter's own centering math so the
    // assertions stay correct regardless of the actual matrix size.
    const isCleared = (
      y: number,
      x: number,
      size: number,
      emptySize: number,
      emptySizeHeight = emptySize,
    ) => {
      const halfSize = size / 2;
      return (
        y >= halfSize - emptySizeHeight / 2 &&
        y < halfSize + emptySizeHeight / 2 &&
        x >= halfSize - emptySize / 2 &&
        x < halfSize + emptySize / 2
      );
    };

    it('clears a square region in the center', () => {
      const qr = new QRCode({ content: CONTENT });
      const { size } = qr;

      qr.emptyCenter(4);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (isCleared(y, x, size, 4)) {
            expect(qr.matrix[y][x]).toBe(false);
          }
        }
      }
    });

    it('supports a rectangular region via separate height', () => {
      const qr = new QRCode({ content: CONTENT });
      const { size } = qr;

      qr.emptyCenter(6, 2);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (isCleared(y, x, size, 6, 2)) {
            expect(qr.matrix[y][x]).toBe(false);
          }
        }
      }
    });

    it('defaults the height to the width when omitted (square)', () => {
      const square = new QRCode({ content: CONTENT });
      square.emptyCenter(4);

      const explicit = new QRCode({ content: CONTENT });
      explicit.emptyCenter(4, 4);

      expect(square.matrix).toEqual(explicit.matrix);
    });

    it('reduces the total number of dark modules', () => {
      const qr = new QRCode({ content: CONTENT });

      const before = qr.matrix.flat().filter(Boolean).length;
      qr.emptyCenter(8);
      const after = qr.matrix.flat().filter(Boolean).length;

      expect(after).toBeLessThan(before);
    });
  });
});
