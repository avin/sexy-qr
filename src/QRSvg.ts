// ts-ignore

type QGSvgOptions = {
  size: number;
  radiusFactor: number;
  roundExternalCorners: boolean;
  roundInternalCorners: boolean;
};

type Pride = 1 | 0;

type Cell = {
  pride: Pride;
  x: number;
  y: number;
  meshId?: string;
};

const neighborOffsets = [
  [-1, 0],
  [0, -1],
  [1, 0],
  [0, 1],
];

const contour = [
  [
    [0, 0],
    [0, 1],
  ],
  [
    [0, 0],
    [1, 0],
  ],
  [
    [1, 0],
    [1, 1],
  ],
  [
    [0, 1],
    [1, 1],
  ],
];

const getProp = (object, keys, defaultVal = undefined) => {
  keys = Array.isArray(keys) ? keys : keys.split('.');
  object = object[keys[0]];
  if (object && keys.length > 1) {
    return getProp(object, keys.slice(1));
  }
  return object === undefined ? defaultVal : object;
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
    size: 100,
    radiusFactor: 0.5,
    roundExternalCorners: true,
    roundInternalCorners: true,
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

    this.matrixSize = qrModules.length;
    this.pointSize = this.options.size / this.matrixSize;
    console.log('this.pointSize', this.pointSize);
    this.cr = (this.pointSize / 2) * this.options.radiusFactor;

    this.matrix = (() => {
      const result: Cell[][] = [];
      qrModules.forEach((row, rowIdx) => {
        result[rowIdx] = [];
        row.forEach((val, idx) => {
          result[rowIdx][idx] = {
            pride: val ? 1 : 0,
            x: idx,
            y: rowIdx,
            meshId: undefined,
          } as Cell;
        });
      });
      return result;
    })();

    this.detectMeshes();
    this.detectLines();
  }

  detectMeshes() {
    const { matrixSize, matrix } = this;

    for (let y = 0; y < matrixSize; y++) {
      for (let x = 0; x < matrixSize; x++) {
        const currCell = matrix[y][x];
        if (currCell.meshId === undefined && currCell.pride === 1) {
          const cells: Cell[] = [];
          findNeighbors(matrix, currCell, 1, cells);
          const meshId = this.getUniqId();
          cells.forEach((cell) => {
            cell.meshId = meshId;
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
        if (cell.meshId === undefined) {
          continue;
        }

        neighborOffsets.forEach((offset, idx) => {
          const neighborCell = getProp(matrix, [y + offset[0], x + offset[1]]);
          if (!neighborCell || neighborCell.meshId !== cell.meshId) {
            if (cell.meshId) {
              // Нет соседа
              lines[cell.meshId] = lines[cell.meshId] || [];
              lines[cell.meshId].push({
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
            // В приоритете соседняя линия того же квадратика
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
        // Если есть остатки - делаем контур для вырезания
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

    const { p1: p } = seg;

    const segDir = this.getDir(seg);
    const prevSegDir = this.getDir(prevSeg);

    let path = '';
    if (roundExternalCorners && prevSegDir === 'we' && segDir === 'ns') {
      path += `L${p.x * pointSize - cr} ${p.y * pointSize} `;
      path += `Q${p.x * pointSize} ${p.y * pointSize} ${p.x * pointSize} ${p.y * pointSize + cr}`;
    } else if (roundExternalCorners && prevSegDir === 'ns' && segDir === 'ew') {
      path += `L${p.x * pointSize} ${p.y * pointSize - cr} `;
      path += `Q${p.x * pointSize} ${p.y * pointSize} ${p.x * pointSize - cr} ${p.y * pointSize}`;
    } else if (roundExternalCorners && prevSegDir === 'ew' && segDir === 'sn') {
      path += `L${p.x * pointSize + cr} ${p.y * pointSize} `;
      path += `Q${p.x * pointSize} ${p.y * pointSize} ${p.x * pointSize} ${p.y * pointSize - cr}`;
    } else if (roundExternalCorners && prevSegDir === 'sn' && segDir === 'we') {
      path += `L${p.x * pointSize} ${p.y * pointSize + cr} `;
      path += `Q${p.x * pointSize} ${p.y * pointSize} ${p.x * pointSize + cr} ${p.y * pointSize}`;
    } else if (roundInternalCorners && prevSegDir === 'sn' && segDir === 'ew') {
      path += `L${p.x * pointSize} ${p.y * pointSize + cr} `;
      path += `Q${p.x * pointSize} ${p.y * pointSize} ${p.x * pointSize - cr} ${p.y * pointSize}`;
    } else if (roundInternalCorners && prevSegDir === 'ew' && segDir === 'ns') {
      path += `L${p.x * pointSize + cr} ${p.y * pointSize} `;
      path += `Q${p.x * pointSize} ${p.y * pointSize} ${p.x * pointSize} ${p.y * pointSize + cr}`;
    } else if (roundInternalCorners && prevSegDir === 'ns' && segDir === 'we') {
      path += `L${p.x * pointSize} ${p.y * pointSize - cr} `;
      path += `Q${p.x * pointSize} ${p.y * pointSize} ${p.x * pointSize + cr} ${p.y * pointSize}`;
    } else if (roundInternalCorners && prevSegDir === 'we' && segDir === 'sn') {
      path += `L${p.x * pointSize - cr} ${p.y * pointSize} `;
      path += `Q${p.x * pointSize} ${p.y * pointSize} ${p.x * pointSize} ${p.y * pointSize - cr}`;
    } else {
      path += `L${p.x * pointSize} ${p.y * pointSize} `;
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
      options: { roundExternalCorners, roundInternalCorners },
    } = this;

    const { lines } = this;
    const paths: string[] = [];

    Object.keys(lines).forEach((key) => {
      let path = '';
      for (const [lineIdx, line] of [lines[key], ...lines[key].crops].entries()) {
        for (const [segIdx, seg] of line.entries()) {
          const { p1: from } = seg;
          const prevSeg = line[segIdx - 1] || line[line.length - 1];
          const nextSeg = line[segIdx + 1] || line[0];

          const segDir = this.getDir(seg);
          const prevSegDir = this.getDir(prevSeg);

          if (segIdx === 0) {
            if (roundExternalCorners) {
              if (lineIdx === 0) {
                path += `M${from.x * pointSize + cr} ${from.y * pointSize} `;
              } else {
                path += `M${from.x * pointSize} ${from.y * pointSize + cr} `;
              }
            } else {
              path += `M${from.x * pointSize} ${from.y * pointSize} `;
            }
          } else if (segIdx === line.length - 1) {
            path += this.getSubPath(seg, prevSeg, roundExternalCorners, roundInternalCorners);
            path += this.getSubPath(nextSeg, seg, roundExternalCorners, roundInternalCorners);
            path += 'Z ';
          } else if (prevSegDir !== segDir) {
            path += this.getSubPath(seg, prevSeg, roundExternalCorners, roundInternalCorners);
          }
        }
      }
      paths.push(`<path d="${path}"/>`);
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.options.size} ${this.options.size}">${paths.join('\n')}</svg>`;
  }
}
