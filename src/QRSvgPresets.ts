type QRSvgPreset = {
  outerCornerRadius: number;
  innerCornerRadius: number;
  cornerBlockOuter: {
    outerCornerRadius: number;
    innerCornerRadius: number;
  };
  cornerBlockInner: {
    outerCornerRadius: number;
  };
};

type ReadonlyQRSvgPreset = Readonly<{
  outerCornerRadius: number;
  innerCornerRadius: number;
  cornerBlockOuter: Readonly<{
    outerCornerRadius: number;
    innerCornerRadius: number;
  }>;
  cornerBlockInner: Readonly<{
    outerCornerRadius: number;
  }>;
}>;

const freezePreset = (preset: QRSvgPreset): ReadonlyQRSvgPreset => {
  Object.freeze(preset.cornerBlockOuter);
  Object.freeze(preset.cornerBlockInner);
  return Object.freeze(preset);
};

const square = freezePreset({
  outerCornerRadius: 0,
  innerCornerRadius: 0,
  cornerBlockOuter: {
    outerCornerRadius: 0,
    innerCornerRadius: 0,
  },
  cornerBlockInner: {
    outerCornerRadius: 0,
  },
});

const rounded = freezePreset({
  outerCornerRadius: 1,
  innerCornerRadius: 1,
  cornerBlockOuter: {
    outerCornerRadius: 1,
    innerCornerRadius: 1,
  },
  cornerBlockInner: {
    outerCornerRadius: 1,
  },
});

const circleCornerBlocks = freezePreset({
  outerCornerRadius: 0,
  innerCornerRadius: 0,
  cornerBlockOuter: {
    outerCornerRadius: 7,
    innerCornerRadius: 5,
  },
  cornerBlockInner: {
    outerCornerRadius: 3,
  },
});

const roundedWithCircleCornerBlocks = freezePreset({
  outerCornerRadius: 1,
  innerCornerRadius: 1,
  cornerBlockOuter: {
    outerCornerRadius: 7,
    innerCornerRadius: 5,
  },
  cornerBlockInner: {
    outerCornerRadius: 3,
  },
});

export const QRSvgPresets = Object.freeze({
  square,
  rounded,
  circleCornerBlocks,
  roundedWithCircleCornerBlocks,
});
