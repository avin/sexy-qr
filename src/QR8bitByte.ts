import { QRMode } from './QRMode';

export class QR8bitByte {
  mode = QRMode.MODE_8BIT_BYTE;

  data: unknown;

  parsedData = [];

  constructor(data) {

    this.data = data;


    // Added to support UTF-8 Characters
    let i = 0;
    const l = this.data.length;
    for (; i < l; i++) {
      const byteArray = [];
      const code = this.data.charCodeAt(i);

      if (code > 0x10000) {
        byteArray[0] = 0xf0 | ((code & 0x1c0000) >>> 18);
        byteArray[1] = 0x80 | ((code & 0x3f000) >>> 12);
        byteArray[2] = 0x80 | ((code & 0xfc0) >>> 6);
        byteArray[3] = 0x80 | (code & 0x3f);
      } else if (code > 0x800) {
        byteArray[0] = 0xe0 | ((code & 0xf000) >>> 12);
        byteArray[1] = 0x80 | ((code & 0xfc0) >>> 6);
        byteArray[2] = 0x80 | (code & 0x3f);
      } else if (code > 0x80) {
        byteArray[0] = 0xc0 | ((code & 0x7c0) >>> 6);
        byteArray[1] = 0x80 | (code & 0x3f);
      } else {
        byteArray[0] = code;
      }

      this.parsedData.push(byteArray);
    }

    this.parsedData = Array.prototype.concat.apply([], this.parsedData);

    if (this.parsedData.length !== this.data.length) {
      this.parsedData.unshift(191);
      this.parsedData.unshift(187);
      this.parsedData.unshift(239);
    }
  }

  getLength() {
    return this.parsedData.length;
  }

  write(buffer) {
    let i = 0;
    const l = this.parsedData.length;
    for (; i < l; i++) {
      buffer.put(this.parsedData[i], 8);
    }
  }
}
