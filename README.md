# Sexy-QR

Sexy SVG QR-code generator

## Demo

[ >> [Online demo](https://avin.github.io/sexy-qr) << ]

[![Preview](./assets/example.svg)](https://avin.github.io/sexy-qr)

## Install

```sh
npm install sexy-qr
```

## Usage

```js
import QrCode from 'sexy-qr';

const svgCode = new QrCode({
  content: 'https://en.wikipedia.org/wiki/QR_code',
  ecl: 'M', // 'L' | 'M' | 'Q' | 'H'
  join: true,
  color: '#182026',
  circleCorners: true,
  size: 380, // px
  dotRadius: 35, // %
}).svg();
```

## License

MIT © [avin](https://github.com/avin)
