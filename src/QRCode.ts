import { QRCodeModel } from './QRCodeModel';
import { QRErrorCorrectLevel } from './QRErrorCorrectLevel';
import { QRCodeLimitLength } from './QRCodeLimitLength';
import { getUTF8Length } from './utils';

type QRCodeOptions = {
  ecl: 'L' | 'M' | 'Q' | 'H';
  content: string;
};

export class QRCode {
  options: QRCodeOptions = {
    ecl: 'M',
    content: '',
  };

  private readonly qrcode!: QRCodeModel;

  constructor(options: Partial<QRCodeOptions>) {
    for (const i in options) {
      this.options[i] = options[i];
    }

    if (this.options.content.length === 0) {
      throw new Error("Expected 'content' to be non-empty!");
    }

    const content = this.options.content;
    const type = this.getTypeNumber(content, this.options.ecl);
    const ecl = this.getErrorCorrectLevel(this.options.ecl);
    this.qrcode = new QRCodeModel(type, ecl);
    this.qrcode.addData(content);
    this.qrcode.make();
  }

  private getErrorCorrectLevel(ecl) {
    const result = QRErrorCorrectLevel[ecl];

    if (result == undefined) {
      throw new Error('Unknwon error correction level: ' + ecl);
    }

    return result;
  }

  private getTypeNumber(content, ecl) {
    const length = getUTF8Length(content);

    let type = 1;
    let limit = 0;
    let i = 0;
    const len = QRCodeLimitLength.length;
    for (; i <= len; i++) {
      const table = QRCodeLimitLength[i];
      if (!table) {
        throw new Error('Content too long: expected ' + limit + ' but got ' + length);
      }

      switch (ecl) {
        case 'L':
          limit = table[0];
          break;

        case 'M':
          limit = table[1];
          break;

        case 'Q':
          limit = table[2];
          break;

        case 'H':
          limit = table[3];
          break;

        default:
          throw new Error('Unknwon error correction level: ' + ecl);
      }

      if (length <= limit) {
        break;
      }

      type++;
    }

    if (type > QRCodeLimitLength.length) {
      throw new Error('Content too long');
    }

    return type;
  }

  emptyCenter(emptySize: number, emptySizeHeight?: number) {
    const { size } = this;

    emptySizeHeight = emptySizeHeight || emptySize;

    const halfSize = size / 2;
    const halfEmptySize = emptySize / 2;
    const halfEmptySizeHeight = emptySizeHeight / 2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (
          y >= halfSize - halfEmptySizeHeight &&
          y < halfSize + halfEmptySizeHeight &&
          x >= halfSize - halfEmptySize &&
          x < halfSize + halfEmptySize
        ) {
          this.matrix[y][x] = false;
        }

      }
    }
  }

  get matrix() {
    return this.qrcode.modules;
  }

  get size() {
    return this.qrcode.moduleCount;
  }
}
