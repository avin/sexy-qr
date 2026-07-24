import { getProp, round, neighborOffsets, contour } from './utils';
import { QRCode } from './QRCode';

export type CornerPosition = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';
export type CornerContour = 'outer' | 'inner';
export type CornerBlockPosition = 'topLeft' | 'topRight' | 'bottomLeft';
export type CornerBlockPart = 'ring' | 'center';

export type CornerContext = {
  region: 'data' | 'cornerBlock';
  block?: CornerBlockPosition;
  part?: CornerBlockPart;
  contour: CornerContour;
  corner: CornerPosition;
  vertex: Point;
  cell: Point;
  defaultRadius: number;
};

export type QRSvgOptions = {
  size: number;
  fill?: string;
  outerCornerRadius?: number;
  innerCornerRadius?: number;
  cornerBlockOuter?: {
    outerCornerRadius?: number;
    innerCornerRadius?: number;
  };
  cornerBlockInner?: {
    outerCornerRadius?: number;
  };
  resolveCornerRadius?: (cornerCtx: CornerContext) => number | undefined;
  preContent?: string | ((qrSvg: QRSvg) => string);
  postContent?: string | ((qrSvg: QRSvg) => string);
};

type NormalizedQRSvgOptions = {
  size: number;
  fill: string;
  outerCornerRadius: number;
  innerCornerRadius: number;
  cornerBlockOuter: {
    outerCornerRadius: number;
    innerCornerRadius: number;
  };
  cornerBlockInner: {
    outerCornerRadius: number;
  };
  resolveCornerRadius?: (cornerCtx: CornerContext) => number | undefined;
  preContent?: string | ((qrSvg: QRSvg) => string);
  postContent?: string | ((qrSvg: QRSvg) => string);
};

type Pride = 1 | 0;
type Point = { x: number; y: number };

type CornerBlockCellInfo = {
  position: CornerBlockPosition;
  part: 'outer' | 'inner';
  origin: Point;
};

type Cell = {
  pride: Pride;
  x: number;
  y: number;
  blockId?: string;
  cornerBlock?: CornerBlockCellInfo;
};

type CornerRadii = {
  outer: number;
  inner: number;
};

type LineSegment = {
  processed: boolean;
  p1: Point;
  p2: Point;
  cell: Cell;
  radii: CornerRadii;
};

type LineSegmentsWithCrops = LineSegment[] & { crops?: LineSegment[][] };

const findNeighbors = (matrix: Cell[][], cell: Cell, pride: Pride, expectCells: Cell[] = []) => {
  expectCells.push(cell);

  for (const offset of neighborOffsets) {
    const neighborCoord = { x: cell.x + offset[0], y: cell.y + offset[1] };

    if (!expectCells.find((i) => i.x === neighborCoord.x && i.y === neighborCoord.y)) {
      const neighborCell = getProp(matrix, [neighborCoord.y, neighborCoord.x]);

      if (neighborCell && neighborCell.pride === pride) {
        findNeighbors(matrix, neighborCell, neighborCell.pride, expectCells);
      }
    }
  }
};

const normalizeRadius = (value: unknown, optionPath: string): number => {
  if (value === undefined) {
    return 0;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Expected '${optionPath}' to be a finite number!`);
  }

  return Math.max(0, value);
};

const normalizeCornerBlock = (value: unknown, optionPath: string): Record<string, unknown> => {
  if (value === undefined) {
    return {};
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`Expected '${optionPath}' to be an object!`);
  }

  return value as Record<string, unknown>;
};

const getCornerBlockInfo = (x: number, y: number, matrixSize: number): CornerBlockCellInfo | undefined => {
  const origins = [
    { position: 'topLeft', x: 0, y: 0 },
    { position: 'topRight', x: matrixSize - 7, y: 0 },
    { position: 'bottomLeft', x: 0, y: matrixSize - 7 },
  ] as const;

  for (const origin of origins) {
    const localX = x - origin.x;
    const localY = y - origin.y;

    if (localX < 0 || localX > 6 || localY < 0 || localY > 6) {
      continue;
    }

    if (localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4) {
      return {
        position: origin.position,
        part: 'inner',
        origin: { x: origin.x, y: origin.y },
      };
    }

    if (localX === 0 || localX === 6 || localY === 0 || localY === 6) {
      return {
        position: origin.position,
        part: 'outer',
        origin: { x: origin.x, y: origin.y },
      };
    }
  }

  return undefined;
};

export class QRSvg {
  private readonly options: NormalizedQRSvgOptions;

  private matrix!: Cell[][];

  paths: string[] = [];

  readonly matrixSize: number;

  private lines: Record<string, LineSegmentsWithCrops> = {};

  private lastUniqId = 0;

  readonly pointSize: number;

  constructor(qrCode: QRCode, options: QRSvgOptions) {
    const cornerBlockOuter = normalizeCornerBlock(options.cornerBlockOuter, 'cornerBlockOuter');
    const cornerBlockInner = normalizeCornerBlock(options.cornerBlockInner, 'cornerBlockInner');

    this.options = {
      size: options.size,
      fill: options.fill ?? 'currentColor',
      outerCornerRadius: normalizeRadius(options.outerCornerRadius, 'outerCornerRadius'),
      innerCornerRadius: normalizeRadius(options.innerCornerRadius, 'innerCornerRadius'),
      cornerBlockOuter: {
        outerCornerRadius: normalizeRadius(cornerBlockOuter.outerCornerRadius, 'cornerBlockOuter.outerCornerRadius'),
        innerCornerRadius: normalizeRadius(cornerBlockOuter.innerCornerRadius, 'cornerBlockOuter.innerCornerRadius'),
      },
      cornerBlockInner: {
        outerCornerRadius: normalizeRadius(cornerBlockInner.outerCornerRadius, 'cornerBlockInner.outerCornerRadius'),
      },
      resolveCornerRadius: options.resolveCornerRadius,
      preContent: options.preContent,
      postContent: options.postContent,
    };

    if (!(this.options.size > 0)) {
      throw new Error("Expected 'size' value to be higher than zero!");
    }

    this.matrixSize = qrCode.size;
    this.pointSize = this.options.size / this.matrixSize;

    this.matrix = qrCode.matrix.map((row, y) =>
      row.map(
        (value, x): Cell => ({
          pride: value ? 1 : 0,
          x,
          y,
          blockId: undefined,
          cornerBlock: value ? getCornerBlockInfo(x, y, this.matrixSize) : undefined,
        }),
      ),
    );

    this.detectBlocks();
    this.detectLines();
    this.generatePaths();
  }

  private detectBlocks() {
    const { matrixSize, matrix } = this;

    for (let y = 0; y < matrixSize; y++) {
      for (let x = 0; x < matrixSize; x++) {
        const currCell = matrix[y][x];
        if (currCell.blockId === undefined && currCell.pride === 1) {
          const cells: Cell[] = [];
          findNeighbors(matrix, currCell, 1, cells);
          const blockId = this.getUniqId();
          cells.forEach((cell) => {
            cell.blockId = blockId;
          });
        }
      }
    }
  }

  private getCellRadii(cell: Cell): CornerRadii {
    if (cell.cornerBlock?.part === 'outer') {
      return {
        outer: this.options.cornerBlockOuter.outerCornerRadius,
        inner: this.options.cornerBlockOuter.innerCornerRadius,
      };
    }

    if (cell.cornerBlock?.part === 'inner') {
      return {
        outer: this.options.cornerBlockInner.outerCornerRadius,
        inner: 0,
      };
    }

    return {
      outer: this.options.outerCornerRadius,
      inner: this.options.innerCornerRadius,
    };
  }

  private getCornerPosition(vertex: Point, cell: Cell): CornerPosition {
    const center = cell.cornerBlock
      ? {
          x: cell.cornerBlock.origin.x + 3.5,
          y: cell.cornerBlock.origin.y + 3.5,
        }
      : {
          x: cell.x + 0.5,
          y: cell.y + 0.5,
        };
    const vertical = vertex.y < center.y ? 'top' : 'bottom';
    const horizontal = vertex.x < center.x ? 'Left' : 'Right';

    return `${vertical}${horizontal}` as CornerPosition;
  }

  private resolveCornerRadius(
    vertex: Point,
    cell: Cell,
    cornerContour: CornerContour,
    defaultRadius: number,
  ): number {
    const resolver = this.options.resolveCornerRadius;

    if (!resolver) {
      return defaultRadius;
    }

    const cornerBlock = cell.cornerBlock;
    const resolvedRadius = resolver({
      region: cornerBlock ? 'cornerBlock' : 'data',
      block: cornerBlock?.position,
      part: cornerBlock ? (cornerBlock.part === 'outer' ? 'ring' : 'center') : undefined,
      contour: cornerContour,
      corner: this.getCornerPosition(vertex, cell),
      vertex: { ...vertex },
      cell: { x: cell.x, y: cell.y },
      defaultRadius,
    });

    return resolvedRadius === undefined
      ? defaultRadius
      : normalizeRadius(resolvedRadius, 'resolveCornerRadius return value');
  }

  private detectLines() {
    const { lines, matrixSize, matrix } = this;

    for (let y = 0; y < matrixSize; y++) {
      for (let x = 0; x < matrixSize; x++) {
        const cell = matrix[y][x];
        if (cell.blockId === undefined) {
          continue;
        }

        neighborOffsets.forEach((offset, idx) => {
          const neighborCell = getProp(matrix, [y + offset[0], x + offset[1]]);
          if (!neighborCell || neighborCell.blockId !== cell.blockId) {
            lines[cell.blockId as string] = lines[cell.blockId as string] || [];
            lines[cell.blockId as string].push({
              processed: false,
              p1: { y: y + contour[idx][0][0], x: x + contour[idx][0][1] },
              p2: { y: y + contour[idx][1][0], x: x + contour[idx][1][1] },
              cell,
              radii: this.getCellRadii(cell),
            });
          }
        });
      }
    }

    Object.keys(lines).forEach((key) => {
      const line = lines[key];

      const processSegments = (py: number, px: number, result: LineSegment[], originalCell: Cell) => {
        const nextSeg = line
          .filter(
            (seg) => !seg.processed && ((seg.p1.y === py && seg.p1.x === px) || (seg.p2.y === py && seg.p2.x === px)),
          )
          .sort((a, b) => (a.cell === originalCell ? -1 : b.cell === originalCell ? 1 : 0))[0];

        if (!nextSeg) {
          return;
        }

        nextSeg.processed = true;
        const forwards = nextSeg.p1.y === py && nextSeg.p1.x === px;
        const resultSeg: LineSegment = {
          ...nextSeg,
          p1: forwards ? nextSeg.p1 : nextSeg.p2,
          p2: forwards ? nextSeg.p2 : nextSeg.p1,
        };
        result.push(resultSeg);
        processSegments(resultSeg.p2.y, resultSeg.p2.x, result, nextSeg.cell);
      };

      line[0].processed = true;
      const result: LineSegmentsWithCrops = [line[0]];
      processSegments(line[0].p2.y, line[0].p2.x, result, line[0].cell);
      lines[key] = result;
      lines[key].crops = [];

      let notProcessedSeg = line.find((segment) => !segment.processed);
      while (notProcessedSeg) {
        notProcessedSeg.processed = true;
        const cropResult: LineSegment[] = [notProcessedSeg];
        processSegments(notProcessedSeg.p2.y, notProcessedSeg.p2.x, cropResult, notProcessedSeg.cell);
        cropResult.reverse();
        cropResult.forEach((segment) => {
          const p2 = segment.p2;
          segment.p2 = segment.p1;
          segment.p1 = p2;
        });
        lines[key].crops?.push(cropResult);
        notProcessedSeg = line.find((segment) => !segment.processed);
      }
    });
  }

  private getDirection(segment: LineSegment): Point {
    return {
      x: segment.p2.x - segment.p1.x,
      y: segment.p2.y - segment.p1.y,
    };
  }

  private getLoopPath(line: LineSegment[]): string {
    const corners = line
      .map((segment, index) => {
        const previousSegment = line[index - 1] || line[line.length - 1];
        const incoming = this.getDirection(previousSegment);
        const outgoing = this.getDirection(segment);
        const crossProduct = incoming.x * outgoing.y - incoming.y * outgoing.x;

        if (crossProduct === 0) {
          return undefined;
        }

        return {
          vertex: segment.p1,
          cell: segment.cell,
          incoming,
          outgoing,
          contour: (crossProduct > 0 ? 'outer' : 'inner') as CornerContour,
          defaultRadius: crossProduct > 0 ? segment.radii.outer : segment.radii.inner,
          sweep: crossProduct > 0 ? 1 : 0,
        };
      })
      .filter((corner): corner is NonNullable<typeof corner> => corner !== undefined);

    if (corners.length === 0) {
      return '';
    }

    const renderedCorners = corners.map((corner, index) => {
      const previousCorner = corners[index - 1] || corners[corners.length - 1];
      const nextCorner = corners[index + 1] || corners[0];
      const previousEdgeLength =
        (Math.abs(corner.vertex.x - previousCorner.vertex.x) + Math.abs(corner.vertex.y - previousCorner.vertex.y)) *
        this.pointSize;
      const nextEdgeLength =
        (Math.abs(nextCorner.vertex.x - corner.vertex.x) + Math.abs(nextCorner.vertex.y - corner.vertex.y)) *
        this.pointSize;
      const maximumRadius = Math.min(previousEdgeLength, nextEdgeLength) / 2;
      const requestedRadius = this.resolveCornerRadius(
        corner.vertex,
        corner.cell,
        corner.contour,
        corner.defaultRadius,
      );
      const radius = Math.min((requestedRadius * this.pointSize) / 2, maximumRadius);

      return {
        ...corner,
        radius,
        start: {
          x: corner.vertex.x * this.pointSize - corner.incoming.x * radius,
          y: corner.vertex.y * this.pointSize - corner.incoming.y * radius,
        },
        end: {
          x: corner.vertex.x * this.pointSize + corner.outgoing.x * radius,
          y: corner.vertex.y * this.pointSize + corner.outgoing.y * radius,
        },
      };
    });

    const first = renderedCorners[0];
    let path = `M${round(first.start.x)} ${round(first.start.y)} `;

    renderedCorners.forEach((corner) => {
      path += `L${round(corner.start.x)} ${round(corner.start.y)} `;

      if (corner.radius > 0) {
        const radius = round(corner.radius);
        path += `A${radius} ${radius} 0 0 ${corner.sweep} ${round(corner.end.x)} ${round(corner.end.y)} `;
      } else {
        path += `L${round(corner.vertex.x * this.pointSize)} ${round(corner.vertex.y * this.pointSize)} `;
      }
    });

    return `${path}Z`;
  }

  private getUniqId() {
    return String(this.lastUniqId++);
  }

  private generatePaths() {
    const paths: string[] = [];

    Object.keys(this.lines).forEach((key) => {
      const line = this.lines[key];
      const loops = [line, ...(line.crops || [])];
      const path = loops.map((loop) => this.getLoopPath(loop)).join(' ');
      paths.push(`<path d="${path}"/>`);
    });

    this.paths = paths;
  }

  private svgAdditionalContent(additionalContent: NormalizedQRSvgOptions['preContent']): string {
    if (typeof additionalContent === 'function') {
      return additionalContent(this);
    }

    if (typeof additionalContent === 'string') {
      return additionalContent;
    }

    return '';
  }

  get svg() {
    const { size, fill } = this.options;

    return `\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" fill="${fill}">
${this.svgAdditionalContent(this.options.preContent)}
${this.paths.join('\n')}
${this.svgAdditionalContent(this.options.postContent)}
</svg>`;
  }
}
