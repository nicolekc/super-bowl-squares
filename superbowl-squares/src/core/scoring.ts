import {
  Board, GameState, SquareStatus, NearMiss,
  FullBoardStatus, BoardPosition, QuarterDigits, QuarterNumbers,
} from './types.js';

export function lastDigit(score: number): number {
  return Math.abs(score) % 10;
}

/**
 * For reroll boards, use the quarter index directly.
 * For non-reroll, always use index 0.
 */
export function quarterIndex(board: Board, quarter: number): number {
  return board.config.reroll ? quarter : 0;
}

// ── My-Squares scoring ─────────────────────────────────

export function checkMySquare(
  digits: QuarterDigits,
  topScore: number,
  leftScore: number,
  topTeam: string,
  leftTeam: string,
): SquareStatus {
  const td = lastDigit(topScore);
  const ld = lastDigit(leftScore);

  const isWinner =
    digits.topDigits.includes(td) && digits.leftDigits.includes(ld);

  if (isWinner) return { isWinner: true, nearMisses: [] };

  const nearMisses: NearMiss[] = [];

  // Top team scores +3 or +7
  for (const pts of [3, 7] as const) {
    const nd = lastDigit(topScore + pts);
    if (digits.topDigits.includes(nd) && digits.leftDigits.includes(ld)) {
      nearMisses.push({ team: topTeam, points: pts });
    }
  }

  // Left team scores +3 or +7
  for (const pts of [3, 7] as const) {
    const nd = lastDigit(leftScore + pts);
    if (digits.topDigits.includes(td) && digits.leftDigits.includes(nd)) {
      nearMisses.push({ team: leftTeam, points: pts });
    }
  }

  return { isWinner, nearMisses };
}

/**
 * Check all of a user's squares on one board for a given game state.
 * Returns an array parallel to board.mySquares.
 */
export function checkAllMySquares(board: Board, state: GameState): SquareStatus[] {
  if (!board.mySquares) return [];
  const qi = quarterIndex(board, state.quarter);
  const { topTeam, leftTeam } = board.config;

  return board.mySquares.map(sq => {
    const digits = sq.quarters[qi];
    return checkMySquare(digits, state.score.top, state.score.left, topTeam, leftTeam);
  });
}

// ── Full-board scoring ──────────────────────────────────

export function findPosition(
  numbers: number[][],
  digit: number,
): number {
  return numbers.findIndex(ds => ds.includes(digit));
}

export function checkFullBoard(
  qn: QuarterNumbers,
  topScore: number,
  leftScore: number,
  topTeam: string,
  leftTeam: string,
): FullBoardStatus {
  const td = lastDigit(topScore);
  const ld = lastDigit(leftScore);

  const winCol = findPosition(qn.topNumbers, td);
  const winRow = findPosition(qn.leftNumbers, ld);
  const winnerPos: BoardPosition = { row: winRow, col: winCol };

  const nearMissPositions: FullBoardStatus['nearMissPositions'] = [];

  // Top team +3, +7
  for (const pts of [3, 7] as const) {
    const nd = lastDigit(topScore + pts);
    const nearCol = findPosition(qn.topNumbers, nd);
    if (nearCol !== -1 && nearCol !== winCol) {
      nearMissPositions.push({
        pos: { row: winRow, col: nearCol },
        nearMiss: { team: topTeam, points: pts },
      });
    }
  }

  // Left team +3, +7
  for (const pts of [3, 7] as const) {
    const nd = lastDigit(leftScore + pts);
    const nearRow = findPosition(qn.leftNumbers, nd);
    if (nearRow !== -1 && nearRow !== winRow) {
      nearMissPositions.push({
        pos: { row: nearRow, col: winCol },
        nearMiss: { team: leftTeam, points: pts },
      });
    }
  }

  return { winnerPos, nearMissPositions };
}

/**
 * Produce a map of grid positions → CellStatus for display purposes.
 * Key is "row,col".
 */
export function getFullBoardCellStatuses(
  board: Board,
  state: GameState,
): Map<string, { isWinner: boolean; isMine: boolean; nearMisses: NearMiss[] }> {
  if (!board.fullBoard) return new Map();

  const qi = quarterIndex(board, state.quarter);
  const qn = board.fullBoard.quarters[qi];
  const { topTeam, leftTeam } = board.config;
  const result = checkFullBoard(qn, state.score.top, state.score.left, topTeam, leftTeam);

  const mineSet = new Set(
    board.fullBoard.mySquareNames.map(n => n.toLowerCase()),
  );

  const map = new Map<string, { isWinner: boolean; isMine: boolean; nearMisses: NearMiss[] }>();

  // Winner
  const wk = `${result.winnerPos.row},${result.winnerPos.col}`;
  const winName = board.fullBoard.grid[result.winnerPos.row]?.[result.winnerPos.col] ?? '';
  map.set(wk, {
    isWinner: true,
    isMine: mineSet.has(winName.toLowerCase()),
    nearMisses: [],
  });

  // Near misses
  for (const nm of result.nearMissPositions) {
    const nk = `${nm.pos.row},${nm.pos.col}`;
    const name = board.fullBoard.grid[nm.pos.row]?.[nm.pos.col] ?? '';
    const existing = map.get(nk);
    if (existing) {
      existing.nearMisses.push(nm.nearMiss);
    } else {
      map.set(nk, {
        isWinner: false,
        isMine: mineSet.has(name.toLowerCase()),
        nearMisses: [nm.nearMiss],
      });
    }
  }

  return map;
}

/**
 * Format a QuarterDigits as a readable string like "03" or "7"
 */
export function formatDigits(digits: number[]): string {
  return digits.length === 2 ? `${digits[0]}${digits[1]}` : `${digits[0]}`;
}
