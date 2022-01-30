# Sexy-QR

Sexy SVG QR-code generator

## Install

```sh
npm install sexy-qr
```

## Usage

```js
import QrCode from 'sexy-qr';

const svgCode = new QrCode({
  content: 'https://avin.github.io/sexy-qr',
  ecl: 'M', // 'L' | 'M' | 'Q' | 'H'
  fill: '#182026',
  cornerBlocksAsCircles: true,
  size: 380, // px
  radiusFactor: 0.75, // 0-1
  cornerBlockRadiusFactor: 2, // 0-3
  roundExternalCorners: true,
  roundInternalCorners: true,
}).svg();
```

## Demo

[ >> [Online demo](https://avin.github.io/sexy-qr) << ]

| Example 1                                                      | Example 2                                                      | Example 3                                                      |
| -------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| [![Preview](./assets/ex1.svg)](https://avin.github.io/sexy-qr) | [![Preview](./assets/ex2.svg)](https://avin.github.io/sexy-qr) | [![Preview](./assets/ex3.svg)](https://avin.github.io/sexy-qr) |

## License

MIT © [avin](https://github.com/avin)
