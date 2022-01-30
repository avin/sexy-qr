import { getProp, round, neighborOffsets, contour } from './utils';
import { QRCode } from './QRCode';

type QRSvgOptions = {
  size: number;
  radiusFactor: number;
  cornerBlockRadiusFactor?: number;
  roundOuterCorners: boolean;
  roundInnerCorners: boolean;
  cornerBlocksAsCircles: boolean;
  fill: string;
  preContent?: string | ((QRSvg) => string);
  postContent?: string | ((QRSvg) => string);
};

type Pride = 1 | 0;

type Cell = {
  pride: Pride;
  x: number;
  y: number;
  blockId?: string;
  isCornerBlock: boolean;
};

type LineSegment = {
  processed: boolean;
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  cell: Cell;
  cr: number;
};

type LineSegmentsWithCrops = LineSegment[] & { crops?: LineSegment[][] };

const findNeighbors = (matrix: Cell[][], cell: Cell, pride: Pride, expectCells: Cell[] = []) => {
  expectCells.push(cell);

  for (const offset of neighborOffsets) {
    const neighborCoord = { x: cell.x + offset[0], y: cell.y + offset[1] };

    if (!expectCells.find((i) => i.x === neighborCoord.x && i.y === neighborCoord.y)) {
      const neighborCell = getProp(matrix, [neighborCoord.y, neighborCoord.x]);

      if (neighborCell && neighborCell.pride === pride) {
        const pride = neighborCell.pride;
        findNeighbors(matrix, neighborCell, pride, expectCells);
      }
    }
  }
};

export class QRSvg {
  private options: QRSvgOptions = {
    size: 0,
    radiusFactor: 0.75,
    roundOuterCorners: true,
    roundInnerCorners: true,
    cornerBlocksAsCircles: false,
    fill: 'currentColor',
  };

  private matrix!: Cell[][];

  paths: string[] = [];

  private readonly matrixSize!: number;

  private lines: Record<string, LineSegmentsWithCrops> = {};

  private lastUniqId = 0;

  readonly pointSize!: number;

  constructor(qrCode: QRCode, options: Partial<QRSvgOptions>) {
    for (const i in options) {
      this.options[i] = options[i];
    }

    if (this.options.cornerBlockRadiusFactor === undefined) {
      this.options.cornerBlockRadiusFactor = this.options.radiusFactor;
    }

    if (!(this.options.size > 0)) {
      throw new Error("Expected 'size' value to be higher than zero!");
    }

    this.matrixSize = qrCode.size;
    this.pointSize = this.options.size / this.matrixSize;

    this.matrix = (() => {
      const result: Cell[][] = [];
      qrCode.matrix.forEach((row, rowIdx) => {
        result[rowIdx] = [];
        row.forEach((val, idx) => {
          result[rowIdx][idx] = {
            pride: val ? 1 : 0,
            x: idx,
            y: rowIdx,
            blockId: undefined,
            isCornerBlock: false,
          } as Cell;
        });
      });
      return result;
    })();

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
            const { x, y } = cell;
            cell.blockId = blockId;

            if ((x < 8 && y < 8) || (x > this.matrixSize - 8 && y < 8) || (x < 8 && y > this.matrixSize - 8)) {
              cell.isCornerBlock = true;
            }
          });
        }
      }
    }
  }

  private detectLines() {
    const { lines, matrixSize, matrix } = this;

    const pathRadius = (this.pointSize / 2) * Math.min(this.options.radiusFactor, 10);
    const cornerBlockPathRadius = (this.pointSize / 2) * Math.min(this.options.cornerBlockRadiusFactor as number, 10);

    for (let y = 0; y < matrixSize; y++) {
      for (let x = 0; x < matrixSize; x++) {
        const cell = matrix[y][x];
        if (cell.blockId === undefined) {
          continue;
        }

        if (cell.isCornerBlock && this.options.cornerBlocksAsCircles) {
          continue;
        }

        neighborOffsets.forEach((offset, idx) => {
          const neighborCell = getProp(matrix, [y + offset[0], x + offset[1]]);
          if (!neighborCell || neighborCell.blockId !== cell.blockId) {
            if (cell.blockId) {
              lines[cell.blockId] = lines[cell.blockId] || [];
              lines[cell.blockId].push({
                processed: false,
                p1: { y: y + contour[idx][0][0], x: x + contour[idx][0][1] },
                p2: { y: y + contour[idx][1][0], x: x + contour[idx][1][1] },
                cell,
                cr: cell.isCornerBlock ? cornerBlockPathRadius : pathRadius,
              });
            }
          }
        });
      }
    }

    Object.keys(lines).forEach((key) => {
      const line = lines[key];

      const proc = (py, px, result, oCell) => {
        const nextSegs = line
          .filter((seg) => {
            if (!seg.processed) {
              if ((seg.p1.y === py && seg.p1.x === px) || (seg.p2.y === py && seg.p2.x === px)) {
                return true;
              }
            }
            return false;
          })
          .sort((a, b) => {
            if (a.cell === oCell) {
              return -1;
            }
            return 1;
          });

        const nextSeg = nextSegs[0];

        if (nextSeg) {
          nextSeg.processed = true;
          let resultSeg;
          if (nextSeg.p1.y === py && nextSeg.p1.x === px) {
            resultSeg = { p1: nextSeg.p1, p2: nextSeg.p2, cr: nextSeg.cr };
          } else if (nextSeg.p2.y === py && nextSeg.p2.x === px) {
            resultSeg = { p1: nextSeg.p2, p2: nextSeg.p1, cr: nextSeg.cr };
          }
          result.push(resultSeg);
          proc(resultSeg.p2.y, resultSeg.p2.x, result, nextSeg.cell);
        }
      };
      line[0].processed = true;
      const result: LineSegmentsWithCrops = [line[0]];
      proc(line[0].p2.y, line[0].p2.x, result, line[0].cell);
      lines[key] = result;
      lines[key].crops = [];

      let checkCrops = true;
      while (checkCrops) {
        const notProcessedSeg = line.find((i) => !i.processed);
        if (notProcessedSeg) {
          notProcessedSeg.processed = true;
          const cropResult = [notProcessedSeg];
          proc(notProcessedSeg.p2.y, notProcessedSeg.p2.x, cropResult, notProcessedSeg.cell);
          cropResult.reverse();
          cropResult.map((seg) => {
            const op2 = seg.p2;
            seg.p2 = seg.p1;
            seg.p1 = op2;
            return seg;
          });
          lines[key]?.crops?.push(cropResult);
        } else {
          checkCrops = false;
        }
      }
    });
  }

  private getDir(seg) {
    if (seg.p1.x === seg.p2.x) {
      if (seg.p1.y > seg.p2.y) {
        return 'sn';
      }
      return 'ns';
    }
    if (seg.p1.y === seg.p2.y) {
      if (seg.p1.x > seg.p2.x) {
        return 'ew';
      }
      return 'we';
    }
  }

  private getSubPath(seg, prevSeg, roundOuterCorners, roundInnerCorners) {
    const { pointSize } = this;

    let {
      p1: { x, y },
      cr,
    } = seg;

    x = x * pointSize;
    y = y * pointSize;

    const xmcr = round(x - cr);
    const xpcr = round(x + cr);

    const ymcr = round(y - cr);
    const ypcr = round(y + cr);

    x = round(x);
    y = round(y);

    const segDir = this.getDir(seg);
    const prevSegDir = this.getDir(prevSeg);

    let path = '';
    if (cr && roundOuterCorners && prevSegDir === 'we' && segDir === 'ns') {
      path += `L${xmcr} ${y} `;
      path += `Q${x} ${y} ${x} ${ypcr}`;
    } else if (cr && roundOuterCorners && prevSegDir === 'ns' && segDir === 'ew') {
      path += `L${x} ${ymcr} `;
      path += `Q${x} ${y} ${xmcr} ${y}`;
    } else if (cr && roundOuterCorners && prevSegDir === 'ew' && segDir === 'sn') {
      path += `L${xpcr} ${y} `;
      path += `Q${x} ${y} ${x} ${ymcr}`;
    } else if (cr && roundOuterCorners && prevSegDir === 'sn' && segDir === 'we') {
      path += `L${x} ${ypcr} `;
      path += `Q${x} ${y} ${xpcr} ${y}`;
    } else if (cr && roundInnerCorners && prevSegDir === 'sn' && segDir === 'ew') {
      path += `L${x} ${ypcr} `;
      path += `Q${x} ${y} ${xmcr} ${y}`;
    } else if (cr && roundInnerCorners && prevSegDir === 'ew' && segDir === 'ns') {
      path += `L${xpcr} ${y} `;
      path += `Q${x} ${y} ${x} ${ypcr}`;
    } else if (cr && roundInnerCorners && prevSegDir === 'ns' && segDir === 'we') {
      path += `L${x} ${ymcr} `;
      path += `Q${x} ${y} ${xpcr} ${y}`;
    } else if (cr && roundInnerCorners && prevSegDir === 'we' && segDir === 'sn') {
      path += `L${xmcr} ${y} `;
      path += `Q${x} ${y} ${x} ${ymcr}`;
    } else {
      path += `L${x} ${y} `;
    }
    return path;
  }

  private getUniqId() {
    return String(this.lastUniqId++);
  }

  private generatePaths() {
    const {
      pointSize,
      options: { roundOuterCorners, roundInnerCorners, cornerBlocksAsCircles },
    } = this;

    const { lines } = this;
    const paths: string[] = [];

    Object.keys(lines).forEach((key) => {
      let path = '';
      for (const [lineIdx, line] of [lines[key], ...(lines[key].crops as LineSegment[][])].entries()) {
        for (const [segIdx, seg] of line.entries()) {
          let {
            p1: { x, y },
            cr,
          } = seg;

          x = x * pointSize;
          y = y * pointSize;

          const xpcr = round(x + cr);
          const ypcr = round(y + cr);

          x = round(x);
          y = round(y);

          const prevSeg = line[segIdx - 1] || line[line.length - 1];
          const nextSeg = line[segIdx + 1] || line[0];

          const segDir = this.getDir(seg);
          const prevSegDir = this.getDir(prevSeg);

          if (segIdx === 0) {
            if (roundOuterCorners) {
              if (lineIdx === 0) {
                path += `M${xpcr} ${y} `;
              } else {
                path += `M${x} ${ypcr} `;
              }
            } else {
              path += `M${x} ${y} `;
            }
          } else if (segIdx === line.length - 1) {
            path += this.getSubPath(seg, prevSeg, roundOuterCorners, roundInnerCorners);
            path += this.getSubPath(nextSeg, seg, roundOuterCorners, roundInnerCorners);
            path += 'Z';
          } else if (prevSegDir !== segDir) {
            path += this.getSubPath(seg, prevSeg, roundOuterCorners, roundInnerCorners);
          }
        }
      }
      paths.push(`<path d="${path}"/>`);
    });

    if (cornerBlocksAsCircles) {
      const offsetSize = this.pointSize * this.matrixSize - this.pointSize * 7;
      [
        [0, 0],
        [offsetSize, 0],
        [0, offsetSize],
      ].forEach(([ox, oy]) => {
        const centerX = round((this.pointSize * 7) / 2 + ox);
        const centerY = round((this.pointSize * 7) / 2 + oy);

        let outerRadius = round((this.pointSize * 7) / 2);
        const innerRadius = round((this.pointSize * 7) / 2 - this.pointSize);

        // Big circle
        paths.push(`<path d="\
M ${centerX} ${centerY - outerRadius} \
A ${outerRadius} ${outerRadius} 0 1 0 ${centerX} ${round(centerY + outerRadius)} \
A ${outerRadius} ${outerRadius} 0 1 0 ${centerX} ${round(centerY - outerRadius)} \
Z \
M ${centerX} ${centerY - innerRadius} \
A ${innerRadius} ${innerRadius} 0 1 1 ${centerX} ${round(centerY + innerRadius)} \
A ${innerRadius} ${innerRadius} 0 1 1 ${centerX} ${round(centerY - innerRadius)} \
Z" />`);

        // Small circle
        outerRadius = round((this.pointSize * 7) / 2 - this.pointSize * 2);
        paths.push(`<path d="\
M ${centerX} ${centerY - outerRadius} \
A ${outerRadius} ${outerRadius} 0 1 0 ${centerX} ${round(centerY + outerRadius)} \
A ${outerRadius} ${outerRadius} 0 1 0 ${centerX} ${round(centerY - outerRadius)} \
Z" />`);
      });
    }

    this.paths = paths;
  }

  private svgAdditionalContent(additionalContent): string {
    if (typeof additionalContent === 'function') {
      return additionalContent(this);
    }

    if (typeof additionalContent === 'string') {
      return additionalContent;
    }

    return additionalContent || '';
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
