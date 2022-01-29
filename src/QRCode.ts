import { QRCodeModel } from './QRCodeModel';
import { QRErrorCorrectLevel } from './QRErrorCorrectLevel';
import { QRCodeLimitLength } from './QRCodeLimitLength';
import { getProp } from './utils';

type QRCodeOptions = {
  size: number;
  circleCorners: boolean;
  typeNumber: number;
  color: string;
  background: string;
  ecl: string;
  dotRadius: number;
  content: string;
  pretty: boolean;
  xmlDeclaration: boolean;
};

export class QRCode {
  options: QRCodeOptions = {
    size: 256,
    circleCorners: false,
    typeNumber: 4,
    color: '#000000',
    background: '#ffffff',
    ecl: 'M',
    dotRadius: 50,
    content: '',
    pretty: false,
    xmlDeclaration: false,
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
      throw new Error("Expected 'size' or 'height' value to be higher than zero!");
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

    //Get type number
    function _getTypeNumber(content, ecl) {
      const length = _getUTF8Length(content);

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

    //Gets text length
    function _getUTF8Length(content) {
      const result = encodeURI(content)
        .toString()
        .replace(/%[0-9a-fA-F]{2}/g, 'a');
      return result.length + (result.length !== content ? 3 : 0);
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

    const pretty = options.pretty;
    const indent = pretty ? '  ' : '';
    const EOL = pretty ? '\r\n' : '';
    const width = options.size;
    const height = options.size;
    const length = modules.length;
    const xsize = width / length;
    const ysize = height / length;

    //Apply <?xml...?> declaration in SVG?
    const xmlDeclaration = options.xmlDeclaration;

    //Rectangles representing modules
    let modrect = '';

    for (let y = 0; y < length; y++) {
      for (let x = 0; x < length; x++) {
        if (this.options.circleCorners) {
          if ((x < 8 && y < 8) || (x > length - 8 && y < 8) || (x < 8 && y > length - 8)) {
            continue;
          }
        }

        const module = modules[x][y];
        if (module) {
          let px = x * xsize;
          let py = y * ysize;

          // Round corners checking neighbors
          let nc1 = !(getProp(modules, [x - 1, y]) || getProp(modules, [x, y - 1]));
          let nc2 = !(getProp(modules, [x + 1, y]) || getProp(modules, [x, y - 1]));
          let nc3 = !(getProp(modules, [x + 1, y]) || getProp(modules, [x, y + 1]));
          let nc4 = !(getProp(modules, [x - 1, y]) || getProp(modules, [x, y + 1]));

          const rv = (v) => Math.floor(v * 100) / 100;

          const rightRoundedRect = (x, y, width, height, radius, corners) => {
            x = rv(x);
            y = rv(y);
            radius = rv(radius);

            let result = 'M' + x + ',' + y;
            result += 'h' + rv(width - corners[1] * radius);
            if (corners[1]) {
              result += 'a' + radius + ',' + radius + ' 0 0 1 ' + radius + ',' + radius;
            }
            result += 'v' + rv(height - (corners[1] + corners[2]) * radius);
            if (corners[2]) {
              result += 'a' + radius + ',' + radius + ' 0 0 1 ' + -radius + ',' + radius;
            }
            result += 'h' + -1 * rv(width - (corners[2] + corners[3]) * radius);
            if (corners[3]) {
              result += 'a' + radius + ',' + radius + ' 0 0 1 ' + -radius + ',' + -radius;
            }
            result += 'v' + -rv(height - (corners[3] + corners[0]) * radius);
            if (corners[0]) {
              result += 'a' + radius + ',' + radius + ' 0 0 1 ' + radius + ',' + -radius;
            }

            result += 'z';

            return result;
          };

          const r = this.options.dotRadius;
          const radiusFactor = Math.max(100 / r, 2);
          modrect +=
            indent +
            `<path d="${rightRoundedRect(
              px - xsize * 0.025,
              py - ysize * 0.025,
              xsize + xsize * 0.05,
              ysize + ysize * 0.05,
              (xsize + xsize * 0.05) / radiusFactor,
              [nc1, nc2, nc3, nc4],
            )}"/>${EOL}`;
        }
      }
    }

    let svg = '';
    if (xmlDeclaration) {
      svg += `<?xml version="1.0" standalone="yes"?>${EOL}`;
    }
    svg += `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${width}" height="${height}" fill="${options.color}">${EOL}`;

    svg += modrect;

    /* Circles in corners */

    // prettier-ignore
    if (this.options.circleCorners) {
      // TopLeft
      svg += `<circle cx="${(xsize * 7) / 2}" cy="${(xsize * 7) / 2}" r="${(xsize * 3)}" stroke="${options.color}" stroke-width="${xsize}" fill="none" />`;
      svg += `<circle cx="${(xsize * 7) / 2}" cy="${(xsize * 7) / 2}" r="${(xsize)}" stroke="${options.color}" stroke-width="${xsize}"/>`;

      // TopRight
      svg += `<circle cx="${length * xsize - (xsize * 7) / 2}" cy="${(xsize * 7) / 2}" r="${(xsize * 3)}" stroke="${options.color}" stroke-width="${xsize}" fill="none" />`;
      svg += `<circle cx="${length * xsize - (xsize * 7) / 2}" cy="${(xsize * 7) / 2}" r="${(xsize)}" stroke="${options.color}" stroke-width="${xsize}"/>`;

      // BottomLeft
      svg += `<circle cx="${(xsize * 7) / 2}" cy="${length * xsize - (xsize * 7) / 2}" r="${(xsize * 3)}" stroke="${options.color}" stroke-width="${xsize}" fill="none" />`;
      svg += `<circle cx="${(xsize * 7) / 2}" cy="${length * xsize - (xsize * 7) / 2}" r="${(xsize)}" stroke="${options.color}" stroke-width="${xsize}"/>`;
    }

    svg += '</svg>';

    return svg;
  }
}
