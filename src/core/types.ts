export type AxisSize = 5 | 10;

export interface BoardConfig {
  name: string;
  buyIn?: number;
  cols: AxisSize;     // top team axis (number of columns)
  rows: AxisSize;     // left team axis (number of rows)
  reroll: boolean;
  topTeam: string;
  leftTeam: string;
  payouts?: number[]; // per-quarter payout amounts
}

/** Digits for one square in one quarter */
export interface QuarterDigits {
  topDigits: number[];   // 1 digit for 10-col, 2 digits for 5-col
  leftDigits: number[];  // 1 digit for 10-row, 2 digits for 5-row
}

/** A square the user is tracking (my squares mode) */
export interface MySquare {
  // Non-reroll: length 1 (same digits all quarters)
  // Reroll: length 4 (Q1-Q4)
  quarters: QuarterDigits[];
}

/** Column/row number assignments for one quarter */
export interface QuarterNumbers {
  topNumbers: number[][];   // topNumbers[colIndex] = [digit(s)]
  leftNumbers: number[][];  // leftNumbers[rowIndex] = [digit(s)]
}

/** Full board data (when the user has the entire board) */
export interface FullBoardData {
  // Non-reroll: length 1; Reroll: length 4
  quarters: QuarterNumbers[];
  grid: string[][];           // grid[row][col] = owner name
  mySquareNames: string[];    // names the user is tracking
}

export interface Board {
  config: BoardConfig;
  fullBoard?: FullBoardData;
  mySquares?: MySquare[];
}

export interface Score {
  top: number;
  left: number;
}

export interface GameState {
  quarter: number; // 0-based: 0=Q1, 1=Q2, 2=Q3, 3=Final
  score: Score;
}

export interface NearMiss {
  team: string;
  points: number; // 3 or 7
}

export interface SquareStatus {
  isWinner: boolean;
  nearMisses: NearMiss[];
}

export interface BoardPosition {
  row: number;
  col: number;
}

export interface CellStatus {
  pos: BoardPosition;
  isWinner: boolean;
  isMine: boolean;
  nearMisses: NearMiss[];
}

export interface FullBoardStatus {
  winnerPos: BoardPosition;
  nearMissPositions: Array<{
    pos: BoardPosition;
    nearMiss: NearMiss;
  }>;
}
