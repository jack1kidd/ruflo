export const COLS = 15;
export const ROWS = 10;
export const CELL = 48;

// Grid coordinates the path travels through, in order. Row/col based so the
// path can be rendered as a strip and reused to validate tower placement.
const PATH_CELLS = [
  [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
  [4, 3], [4, 4], [4, 5], [4, 6],
  [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6],
  [10, 5], [10, 4], [10, 3], [10, 2], [10, 1],
  [11, 1], [12, 1], [13, 1], [14, 1],
];

function cellCenter([col, row]) {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
}

// Waypoints enemies walk through, including an off-screen entry/exit so
// enemies visibly spawn and leave rather than popping in place.
export const WAYPOINTS = [
  { x: -CELL / 2, y: cellCenter(PATH_CELLS[0]).y },
  ...PATH_CELLS.map(cellCenter),
  { x: COLS * CELL + CELL / 2, y: cellCenter(PATH_CELLS[PATH_CELLS.length - 1]).y },
];

const pathCellSet = new Set(PATH_CELLS.map(([c, r]) => `${c},${r}`));

export function isPathCell(col, row) {
  return pathCellSet.has(`${col},${row}`);
}

export function inBounds(col, row) {
  return col >= 0 && col < COLS && row >= 0 && row < ROWS;
}

export function drawMap(ctx) {
  ctx.save();
  ctx.strokeStyle = "#25304b";
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL, 0);
    ctx.lineTo(c * CELL, ROWS * CELL);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL);
    ctx.lineTo(COLS * CELL, r * CELL);
    ctx.stroke();
  }

  ctx.fillStyle = "#2c3a5c";
  for (const [c, r] of PATH_CELLS) {
    ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
  }

  ctx.fillStyle = "rgba(79, 214, 123, 0.35)";
  const [sc, sr] = PATH_CELLS[0];
  ctx.fillRect(sc * CELL, sr * CELL, CELL, CELL);

  ctx.fillStyle = "rgba(255, 93, 93, 0.35)";
  const [ec, er] = PATH_CELLS[PATH_CELLS.length - 1];
  ctx.fillRect(ec * CELL, er * CELL, CELL, CELL);

  ctx.restore();
}
