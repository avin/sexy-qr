import { QRCodeModel } from './QRCodeModel';
import { QRErrorCorrectLevel } from './QRErrorCorrectLevel';
import { QRCodeLimitLength } from './QRCodeLimitLength';
import { QGSvg } from './QRSvg';
import { getUTF8Length } from './utils';

type QRCodeOptions = {
  size: number;
  cornerBlockAsCircles: boolean;
  fill: string;
  ecl: string;
  radiusFactor: number;
  cornerBlockRadiusFactor?: number;
  content: string;
  roundExternalCorners: boolean;
  roundInternalCorners: boolean;
};

export class QRCode {
  options: QRCodeOptions = {
    size: 256,
    cornerBlockAsCircles: false,
    fill: 'currentColor',
    ecl: 'M',
    radiusFactor: 0.5,
    content: '',
    roundExternalCorners: true,
    roundInternalCorners: true,
  };

  qrcode: QRCodeModel;

  constructor(options: Partial<QRCodeOptions>) {
    for (const i in options) {
      this.options[i] = options[i];
    }

    if (this.options.content.length === 0 /* || this.options.content.length > 7089 */) {
      throw new Error("Expected 'content' to be non-empty!");
    }

    if (!(this.options.size > 0)) {
      throw new Error("Expected 'size' value to be higher than zero!");
    }

    //Gets the error correction level
    function _getErrorCorrectLevel(ecl) {
      switch (ecl) {
        case 'L':
          return QRErrorCorrectLevel.L;

        case 'M':
          return QRErrorCorrectLevel.M;

        case 'Q':
          return QRErrorCorrectLevel.Q;

        case 'H':
          return QRErrorCorrectLevel.H;

        default:
          throw new Error('Unknwon error correction level: ' + ecl);
      }
    }

    // Get type number
    function _getTypeNumber(content, ecl) {
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

    //Generate QR Code matrix
    const content = this.options.content;
    const type = _getTypeNumber(content, this.options.ecl);
    const ecl = _getErrorCorrectLevel(this.options.ecl);
    this.qrcode = new QRCodeModel(type, ecl);
    this.qrcode.addData(content);
    this.qrcode.make();
  }

  svg() {
    const options = this.options;
    const modules = this.qrcode.modules;

    const qrSvg = new QGSvg(modules, {
      size: options.size,
      radiusFactor: options.radiusFactor,
      roundExternalCorners: options.roundExternalCorners,
      roundInternalCorners: options.roundInternalCorners,
      cornerBlockAsCircles: options.cornerBlockAsCircles,
      cornerBlockRadiusFactor: options.cornerBlockRadiusFactor,
      fill: options.fill,
    });

    return qrSvg.generate();
  }
}
