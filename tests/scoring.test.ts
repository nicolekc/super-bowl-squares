import { describe, it, expect } from 'vitest';
import {
  lastDigit, checkMySquare, checkFullBoard,
  checkAllMySquares, getFullBoardCellStatuses, quarterIndex,
} from '../src/core/scoring.js';
import { Board, QuarterDigits, QuarterNumbers, GameState } from '../src/core/types.js';

// ── lastDigit ───────────────────────────────────────────

describe('lastDigit', () => {
  it('returns last digit of a number', () => {
    expect(lastDigit(14)).toBe(4);
    expect(lastDigit(7)).toBe(7);
    expect(lastDigit(0)).toBe(0);
    expect(lastDigit(100)).toBe(0);
    expect(lastDigit(29)).toBe(9);
  });
});

// ── checkMySquare ───────────────────────────────────────

describe('checkMySquare', () => {
  it('detects a winner (10x10 single-digit)', () => {
    const digits: QuarterDigits = { topDigits: [4], leftDigits: [7] };
    const result = checkMySquare(digits, 14, 7, 'Patriots', 'Seahawks');
    expect(result.isWinner).toBe(true);
    expect(result.nearMisses).toEqual([]);
  });

  it('detects a winner (5x5 double-digit)', () => {
    const digits: QuarterDigits = { topDigits: [4, 5], leftDigits: [3, 7] };
    // Score: Patriots 14, Seahawks 7 → last digits 4, 7
    const result = checkMySquare(digits, 14, 7, 'Patriots', 'Seahawks');
    expect(result.isWinner).toBe(true);
  });

  it('detects a winner with 5-axis second digit', () => {
    const digits: QuarterDigits = { topDigits: [4, 5], leftDigits: [3, 7] };
    // Score: 15-3 → last digits 5, 3
    const result = checkMySquare(digits, 15, 3, 'Patriots', 'Seahawks');
    expect(result.isWinner).toBe(true);
  });

  it('returns no match and no near misses', () => {
    const digits: QuarterDigits = { topDigits: [9], leftDigits: [9] };
    const result = checkMySquare(digits, 14, 7, 'Patriots', 'Seahawks');
    expect(result.isWinner).toBe(false);
    expect(result.nearMisses).toEqual([]);
  });

  it('detects near miss: top team +3', () => {
    // Current: 14-7 → last digits 4, 7
    // If Patriots +3 → 17, last digit 7
    const digits: QuarterDigits = { topDigits: [7], leftDigits: [7] };
    const result = checkMySquare(digits, 14, 7, 'Patriots', 'Seahawks');
    expect(result.isWinner).toBe(false);
    expect(result.nearMisses).toContainEqual({ team: 'Patriots', points: 3 });
  });

  it('detects near miss: top team +7', () => {
    // Current: 14-7 → digits 4, 7
    // If Patriots +7 → 21, last digit 1
    const digits: QuarterDigits = { topDigits: [1], leftDigits: [7] };
    const result = checkMySquare(digits, 14, 7, 'Patriots', 'Seahawks');
    expect(result.isWinner).toBe(false);
    expect(result.nearMisses).toContainEqual({ team: 'Patriots', points: 7 });
  });

  it('detects near miss: left team +3', () => {
    // Current: 14-7 → digits 4, 7
    // If Seahawks +3 → 10, last digit 0
    const digits: QuarterDigits = { topDigits: [4], leftDigits: [0] };
    const result = checkMySquare(digits, 14, 7, 'Patriots', 'Seahawks');
    expect(result.isWinner).toBe(false);
    expect(result.nearMisses).toContainEqual({ team: 'Seahawks', points: 3 });
  });

  it('detects near miss: left team +7', () => {
    // Current: 14-7 → digits 4, 7
    // If Seahawks +7 → 14, last digit 4
    const digits: QuarterDigits = { topDigits: [4], leftDigits: [4] };
    const result = checkMySquare(digits, 14, 7, 'Patriots', 'Seahawks');
    expect(result.isWinner).toBe(false);
    expect(result.nearMisses).toContainEqual({ team: 'Seahawks', points: 7 });
  });

  it('detects multiple near misses', () => {
    // Current: 0-0 → digits 0, 0
    // 5-axis top: [3,7] does NOT include 0 → not a winner
    // Patriots +3 → 3, topDigits has 3, leftDigits has 0 → near miss
    // Patriots +7 → 7, topDigits has 7, leftDigits has 0 → near miss
    const digits: QuarterDigits = { topDigits: [3, 7], leftDigits: [0] };
    const result = checkMySquare(digits, 0, 0, 'Patriots', 'Seahawks');
    expect(result.isWinner).toBe(false);
    expect(result.nearMisses).toHaveLength(2);
    expect(result.nearMisses).toContainEqual({ team: 'Patriots', points: 3 });
    expect(result.nearMisses).toContainEqual({ team: 'Patriots', points: 7 });
  });

  it('does not report near misses when already winning', () => {
    const digits: QuarterDigits = { topDigits: [0], leftDigits: [0] };
    const result = checkMySquare(digits, 10, 10, 'A', 'B');
    expect(result.isWinner).toBe(true);
    expect(result.nearMisses).toEqual([]);
  });

  it('5-axis near miss within same slot is not a near miss (stays winner)', () => {
    // Digits [0,3], [7]. Score 10-7 → digit 0, 7 → WINNER
    // If top +3 → 13 → digit 3, still in slot [0,3] → still winner
    // But since already winner, no near misses reported
    const digits: QuarterDigits = { topDigits: [0, 3], leftDigits: [7] };
    const result = checkMySquare(digits, 10, 7, 'A', 'B');
    expect(result.isWinner).toBe(true);
    expect(result.nearMisses).toEqual([]);
  });
});

// ── checkFullBoard ──────────────────────────────────────

describe('checkFullBoard', () => {
  // 5x5 board with known numbers
  const qn: QuarterNumbers = {
    topNumbers: [[0, 3], [1, 9], [2, 8], [4, 6], [5, 7]],
    leftNumbers: [[6, 5], [1, 2], [3, 9], [4, 7], [8, 0]],
  };

  it('finds the winning position', () => {
    // Score: 14-7 → digits 4, 7
    // Top: 4 is in slot 3 (index 3: [4,6])
    // Left: 7 is in slot 3 (index 3: [4,7])
    const result = checkFullBoard(qn, 14, 7, 'Seahawks', 'Patriots');
    expect(result.winnerPos).toEqual({ row: 3, col: 3 });
  });

  it('finds near-miss positions for top team +3', () => {
    // Score: 14-7 → digits 4, 7
    // Winner: col 3, row 3
    // Top +3 → 17 → digit 7 → col 4 ([5,7])
    // Near miss at (row 3, col 4)
    const result = checkFullBoard(qn, 14, 7, 'Seahawks', 'Patriots');
    const topPlus3 = result.nearMissPositions.find(
      nm => nm.nearMiss.team === 'Seahawks' && nm.nearMiss.points === 3,
    );
    expect(topPlus3).toBeDefined();
    expect(topPlus3!.pos).toEqual({ row: 3, col: 4 });
  });

  it('finds near-miss positions for left team +3', () => {
    // Score: 14-7 → digits 4, 7
    // Left +3 → 10 → digit 0 → row 4 ([8,0])
    const result = checkFullBoard(qn, 14, 7, 'Seahawks', 'Patriots');
    const leftPlus3 = result.nearMissPositions.find(
      nm => nm.nearMiss.team === 'Patriots' && nm.nearMiss.points === 3,
    );
    expect(leftPlus3).toBeDefined();
    expect(leftPlus3!.pos).toEqual({ row: 4, col: 3 });
  });

  it('does not duplicate winning position in near misses', () => {
    // Score 0-0 → digits 0, 0
    // Winner: top col 0 ([0,3]), left row ... find where 0 is:
    // leftNumbers[4] = [8,0] → row 4
    // So winner at (4, 0)
    // Top +3 → digit 3 → still col 0! ([0,3]) → same col, skip
    const result = checkFullBoard(qn, 0, 0, 'S', 'P');
    const topPlus3 = result.nearMissPositions.find(
      nm => nm.nearMiss.team === 'S' && nm.nearMiss.points === 3,
    );
    expect(topPlus3).toBeUndefined(); // Same column, no near miss
  });
});

// ── checkAllMySquares ───────────────────────────────────

describe('checkAllMySquares', () => {
  it('checks all squares for a non-reroll board', () => {
    const board: Board = {
      config: {
        name: 'Test', cols: 10, rows: 10, reroll: false,
        topTeam: 'A', leftTeam: 'B',
      },
      mySquares: [
        { quarters: [{ topDigits: [4], leftDigits: [7] }] },
        { quarters: [{ topDigits: [0], leftDigits: [0] }] },
      ],
    };
    const state: GameState = { quarter: 0, score: { top: 14, left: 7 } };
    const results = checkAllMySquares(board, state);
    expect(results).toHaveLength(2);
    expect(results[0].isWinner).toBe(true);
    expect(results[1].isWinner).toBe(false);
  });

  it('uses correct quarter for reroll boards', () => {
    const board: Board = {
      config: {
        name: 'Test', cols: 10, rows: 10, reroll: true,
        topTeam: 'A', leftTeam: 'B',
      },
      mySquares: [
        {
          quarters: [
            { topDigits: [0], leftDigits: [0] }, // Q1
            { topDigits: [4], leftDigits: [7] }, // Q2
            { topDigits: [9], leftDigits: [9] }, // Q3
            { topDigits: [1], leftDigits: [1] }, // Q4
          ],
        },
      ],
    };

    // Q1: score 14-7, digits 4,7 → not [0],[0] → no win
    expect(checkAllMySquares(board, { quarter: 0, score: { top: 14, left: 7 } })[0].isWinner).toBe(false);

    // Q2: score 14-7, digits 4,7 → matches [4],[7] → win!
    expect(checkAllMySquares(board, { quarter: 1, score: { top: 14, left: 7 } })[0].isWinner).toBe(true);
  });
});

// ── quarterIndex ────────────────────────────────────────

describe('quarterIndex', () => {
  it('returns 0 for non-reroll regardless of quarter', () => {
    const board: Board = {
      config: { name: 'T', cols: 10, rows: 10, reroll: false, topTeam: 'A', leftTeam: 'B' },
    };
    expect(quarterIndex(board, 0)).toBe(0);
    expect(quarterIndex(board, 3)).toBe(0);
  });

  it('returns quarter for reroll', () => {
    const board: Board = {
      config: { name: 'T', cols: 10, rows: 10, reroll: true, topTeam: 'A', leftTeam: 'B' },
    };
    expect(quarterIndex(board, 2)).toBe(2);
  });
});

// ── getFullBoardCellStatuses ────────────────────────────

describe('getFullBoardCellStatuses', () => {
  it('marks winner and mine correctly', () => {
    const board: Board = {
      config: {
        name: 'Test', cols: 5, rows: 5, reroll: false,
        topTeam: 'S', leftTeam: 'P',
      },
      fullBoard: {
        quarters: [{
          topNumbers: [[0, 3], [1, 9], [2, 8], [4, 6], [5, 7]],
          leftNumbers: [[6, 5], [1, 2], [3, 9], [4, 7], [8, 0]],
        }],
        grid: [
          ['A', 'B', 'C', 'D', 'E'],
          ['F', 'G', 'H', 'I', 'J'],
          ['K', 'L', 'M', 'N', 'O'],
          ['P', 'Q', 'R', 'S', 'T'],
          ['U', 'V', 'W', 'X', 'Y'],
        ],
        mySquareNames: ['S', 'A'],
      },
    };
    const state: GameState = { quarter: 0, score: { top: 14, left: 7 } };
    const statuses = getFullBoardCellStatuses(board, state);

    // Winner: top digit 4 → col 3 ([4,6]), left digit 7 → row 3 ([4,7])
    const winner = statuses.get('3,3');
    expect(winner).toBeDefined();
    expect(winner!.isWinner).toBe(true);
    expect(winner!.isMine).toBe(true); // 'S' is in mySquareNames

    // Near miss should exist
    expect(statuses.size).toBeGreaterThan(1);
  });
});
