import { getProp, round, neighborOffsets, contour } from './utils';

type QGSvgOptions = {
  size: number;
  radiusFactor: number;
  roundExternalCorners: boolean;
  roundInternalCorners: boolean;
  cornerBlocksAsCircles: boolean;
  fill: string;
};

type Pride = 1 | 0;

type Cell = {
  pride: Pride;
  x: number;
  y: number;
  blockId?: string;
  isCornerBlock: boolean;
};

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

export class QGSvg {
  options: QGSvgOptions = {
    size: 0,
    radiusFactor: 0.75,
    roundExternalCorners: true,
    roundInternalCorners: true,
    cornerBlocksAsCircles: false,
    fill: 'currentColor',
  };

  matrix!: Cell[][];

  matrixSize!: number;

  lines: Record<string, any> = {};

  lastUniqId = 0;

  pointSize = 0;

  cr = 0;

  constructor(qrModules: (boolean | null)[][] = [], options: Partial<QGSvgOptions>) {
    for (const i in options) {
      this.options[i] = options[i];
    }

    if (!(this.options.size > 0)) {
      throw new Error("Expected 'size' value to be higher than zero!");
    }

    this.matrixSize = qrModules.length;
    this.pointSize = this.options.size / this.matrixSize;
    this.cr = (this.pointSize / 2) * Math.min(this.options.radiusFactor, 10);

    console.log('this.pointSize', this.pointSize);
    console.log('this.cr', this.cr);

    this.matrix = (() => {
      const result: Cell[][] = [];
      qrModules.forEach((row, rowIdx) => {
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
  }

  detectBlocks() {
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

  detectLines() {
    const { lines, matrixSize, matrix } = this;

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
                p1: { y: y + contour[idx][0][0], x: x + contour[idx][0][1] },
                p2: { y: y + contour[idx][1][0], x: x + contour[idx][1][1] },
                cell,
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
            resultSeg = { p1: nextSeg.p1, p2: nextSeg.p2 };
          } else if (nextSeg.p2.y === py && nextSeg.p2.x === px) {
            resultSeg = { p1: nextSeg.p2, p2: nextSeg.p1 };
          }
          result.push(resultSeg);
          proc(resultSeg.p2.y, resultSeg.p2.x, result, nextSeg.cell);
        }
      };
      line[0].processed = true;
      const result = [line[0]];
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
          lines[key].crops.push(cropResult);
        } else {
          checkCrops = false;
        }
      }
    });
  }

  getDir(seg) {
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

  getSubPath(seg, prevSeg, roundExternalCorners, roundInternalCorners) {
    const { pointSize, cr } = this;

    let {
      p1: { x, y },
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
    if (cr && roundExternalCorners && prevSegDir === 'we' && segDir === 'ns') {
      path += `L${xmcr} ${y} `;
      path += `Q${x} ${y} ${x} ${ypcr}`;
    } else if (cr && roundExternalCorners && prevSegDir === 'ns' && segDir === 'ew') {
      path += `L${x} ${ymcr} `;
      path += `Q${x} ${y} ${xmcr} ${y}`;
    } else if (cr && roundExternalCorners && prevSegDir === 'ew' && segDir === 'sn') {
      path += `L${xpcr} ${y} `;
      path += `Q${x} ${y} ${x} ${ymcr}`;
    } else if (cr && roundExternalCorners && prevSegDir === 'sn' && segDir === 'we') {
      path += `L${x} ${ypcr} `;
      path += `Q${x} ${y} ${xpcr} ${y}`;
    } else if (cr && roundInternalCorners && prevSegDir === 'sn' && segDir === 'ew') {
      path += `L${x} ${ypcr} `;
      path += `Q${x} ${y} ${xmcr} ${y}`;
    } else if (cr && roundInternalCorners && prevSegDir === 'ew' && segDir === 'ns') {
      path += `L${xpcr} ${y} `;
      path += `Q${x} ${y} ${x} ${ypcr}`;
    } else if (cr && roundInternalCorners && prevSegDir === 'ns' && segDir === 'we') {
      path += `L${x} ${ymcr} `;
      path += `Q${x} ${y} ${xpcr} ${y}`;
    } else if (cr && roundInternalCorners && prevSegDir === 'we' && segDir === 'sn') {
      path += `L${xmcr} ${y} `;
      path += `Q${x} ${y} ${x} ${ymcr}`;
    } else {
      path += `L${x} ${y} `;
    }
    return path;
  }

  getUniqId() {
    return String(this.lastUniqId++);
  }

  generate() {
    const {
      pointSize,
      cr,
      options: { roundExternalCorners, roundInternalCorners, size, fill, cornerBlocksAsCircles },
    } = this;

    const { lines } = this;
    const paths: string[] = [];
    const circles: string[] = [];

    Object.keys(lines).forEach((key) => {
      let path = '';
      for (const [lineIdx, line] of [lines[key], ...lines[key].crops].entries()) {
        for (const [segIdx, seg] of line.entries()) {
          let {
            p1: { x, y },
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
            if (roundExternalCorners) {
              if (lineIdx === 0) {
                path += `M${xpcr} ${y} `;
              } else {
                path += `M${x} ${ypcr} `;
              }
            } else {
              path += `M${x} ${y} `;
            }
          } else if (segIdx === line.length - 1) {
            path += this.getSubPath(seg, prevSeg, roundExternalCorners, roundInternalCorners);
            path += this.getSubPath(nextSeg, seg, roundExternalCorners, roundInternalCorners);
            path += 'Z';
          } else if (prevSegDir !== segDir) {
            path += this.getSubPath(seg, prevSeg, roundExternalCorners, roundInternalCorners);
          }
        }
      }
      paths.push(`<path d="${path}"/>`);
    });

    if (cornerBlocksAsCircles) {
      [
        [0, 0],
        [this.pointSize * this.matrixSize - this.pointSize * 7, 0],
        [0, this.pointSize * this.matrixSize - this.pointSize * 7],
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

    return `\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" fill="${fill}">
  ${paths.join('\n  ')}
  ${circles.join('\n  ')}
</svg>`;
  }
}
