import { describe, it, expect } from 'vitest';
import {
  lastDigit, checkMySquare, checkFullBoard, findPosition,
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

// ── Swapped-team scoring ──────────────────────────────────
// These tests verify the core functions produce correct results when
// the caller correctly maps the scores. The actual bug was that the
// web UI was passing the wrong scores to boards with reversed teams.

describe('scoring with swapped team order', () => {
  // Simulates the real scenario:
  // Board 1 (canonical): Seahawks (top) vs Patriots (left)
  //   gameState.score.top = Seahawks score, .left = Patriots score
  // Board 2 (swapped): Patriots (top) vs Seahawks (left)
  //   Must swap: topScore = Patriots score = gameState.score.left
  //              leftScore = Seahawks score = gameState.score.top

  const board2: Board = {
    config: {
      name: 'Swapped Board', cols: 10, rows: 10, reroll: false,
      topTeam: 'New England Patriots', leftTeam: 'Seattle Seahawks',
    },
    fullBoard: {
      quarters: [{
        topNumbers: [[9], [3], [6], [0], [7], [5], [4], [2], [8], [1]],
        leftNumbers: [[4], [5], [8], [3], [7], [6], [0], [9], [2], [1]],
      }],
      grid: Array.from({ length: 10 }, (_, r) =>
        Array.from({ length: 10 }, (_, c) => `R${r}C${c}`),
      ),
      mySquareNames: [],
    },
  };

  it('wrong scores produce wrong winner', () => {
    // Seahawks 3 - Patriots 0 (canonical gameState)
    // If we INCORRECTLY pass top=3 (Seahawks) as Patriots (board top),
    // top digit 3 → col 1 ([3]), left digit 0 → row 6 ([0])
    // Wrong winner: R6C1
    const wrongState: GameState = { quarter: 0, score: { top: 3, left: 0 } };
    const wrongStatuses = getFullBoardCellStatuses(board2, wrongState);
    const wrongWinner = wrongStatuses.get('6,1');
    expect(wrongWinner?.isWinner).toBe(true); // Wrong cell!
  });

  it('correctly mapped scores produce correct winner', () => {
    // Seahawks 3 - Patriots 0 (canonical gameState)
    // CORRECTLY swap: topScore = Patriots = 0, leftScore = Seahawks = 3
    // top digit 0 → col 3 ([0]), left digit 3 → row 3 ([3])
    // Correct winner: R3C3
    const correctState: GameState = { quarter: 0, score: { top: 0, left: 3 } };
    const correctStatuses = getFullBoardCellStatuses(board2, correctState);
    const correctWinner = correctStatuses.get('3,3');
    expect(correctWinner?.isWinner).toBe(true);
  });

  it('near misses are on the right axes when scores are mapped', () => {
    // Patriots 0, Seahawks 3 → top digit 0, left digit 3
    // Winner: col 3 ([0]), row 3 ([3]) → R3C3
    // Patriots (top) +3 → digit 3 → col 1 ([3]) ≠ col 3 → near miss at R3C1
    // Patriots (top) +7 → digit 7 → col 4 ([7]) ≠ col 3 → near miss at R3C4
    // Seahawks (left) +3 → digit 6 → row 5 ([6]) ≠ row 3 → near miss at R5C3
    // Seahawks (left) +7 → digit 0 → row 6 ([0]) ≠ row 3 → near miss at R6C3
    const state: GameState = { quarter: 0, score: { top: 0, left: 3 } };
    const statuses = getFullBoardCellStatuses(board2, state);

    const nearR3C1 = statuses.get('3,1');
    expect(nearR3C1).toBeDefined();
    expect(nearR3C1!.isWinner).toBe(false);
    expect(nearR3C1!.nearMisses).toContainEqual({
      team: 'New England Patriots', points: 3,
    });

    const nearR3C4 = statuses.get('3,4');
    expect(nearR3C4).toBeDefined();
    expect(nearR3C4!.nearMisses).toContainEqual({
      team: 'New England Patriots', points: 7,
    });

    const nearR5C3 = statuses.get('5,3');
    expect(nearR5C3).toBeDefined();
    expect(nearR5C3!.nearMisses).toContainEqual({
      team: 'Seattle Seahawks', points: 3,
    });

    const nearR6C3 = statuses.get('6,3');
    expect(nearR6C3).toBeDefined();
    expect(nearR6C3!.nearMisses).toContainEqual({
      team: 'Seattle Seahawks', points: 7,
    });
  });
});

// ── 5-axis (2-digit) full board near misses ───────────────

describe('checkFullBoard 5-axis near misses', () => {
  // 5x5 board: each position has 2 digits
  const qn5x5: QuarterNumbers = {
    topNumbers: [[0, 2], [1, 7], [3, 6], [8, 5], [4, 9]],
    leftNumbers: [[6, 4], [1, 5], [7, 2], [8, 9], [3, 0]],
  };

  it('finds winner correctly on 5x5', () => {
    // Score: top=13, left=20 → digits 3, 0
    // Top: 3 in position 2 ([3,6])
    // Left: 0 in position 4 ([3,0])
    const result = checkFullBoard(qn5x5, 13, 20, 'NE', 'SEA');
    expect(result.winnerPos).toEqual({ row: 4, col: 2 });
  });

  it('finds near misses that land in different positions', () => {
    // Score: top=13, left=20 → digits 3, 0
    // Winner: col 2, row 4
    // NE +3: digit 6 → col 2 ([3,6]) → same col! Skip.
    // NE +7: digit 0 → col 0 ([0,2]) → different col → near miss at (4, 0)
    // SEA +3: digit 3 → row 4 ([3,0]) → same row! Skip.
    // SEA +7: digit 7 → row 2 ([7,2]) → different row → near miss at (2, 2)
    const result = checkFullBoard(qn5x5, 13, 20, 'NE', 'SEA');

    expect(result.nearMissPositions).toHaveLength(2);

    const nePlus7 = result.nearMissPositions.find(
      nm => nm.nearMiss.team === 'NE' && nm.nearMiss.points === 7,
    );
    expect(nePlus7).toBeDefined();
    expect(nePlus7!.pos).toEqual({ row: 4, col: 0 });

    const seaPlus7 = result.nearMissPositions.find(
      nm => nm.nearMiss.team === 'SEA' && nm.nearMiss.points === 7,
    );
    expect(seaPlus7).toBeDefined();
    expect(seaPlus7!.pos).toEqual({ row: 2, col: 2 });
  });

  it('filters near misses that land in the same 2-digit position as winner', () => {
    // Score: top=13, left=20 → digits 3, 0
    // NE +3: digit 6 → position 2 ([3,6]) → same as winCol (2). Filtered.
    // SEA +3: digit 3 → position 4 ([3,0]) → same as winRow (4). Filtered.
    const result = checkFullBoard(qn5x5, 13, 20, 'NE', 'SEA');

    const nePlus3 = result.nearMissPositions.find(
      nm => nm.nearMiss.team === 'NE' && nm.nearMiss.points === 3,
    );
    expect(nePlus3).toBeUndefined();

    const seaPlus3 = result.nearMissPositions.find(
      nm => nm.nearMiss.team === 'SEA' && nm.nearMiss.points === 3,
    );
    expect(seaPlus3).toBeUndefined();
  });

  it('finds all 4 near misses when none overlap with winner position', () => {
    // Score: top=11, left=14 → digits 1, 4
    // Top: 1 in position 1 ([1,7])
    // Left: 4 in position 0 ([6,4])
    // Winner: col 1, row 0
    // NE +3: digit 4 → position 4 ([4,9]) → col 4 ≠ 1 → near miss at (0, 4)
    // NE +7: digit 8 → position 3 ([8,5]) → col 3 ≠ 1 → near miss at (0, 3)
    // SEA +3: digit 7 → position 2 ([7,2]) → row 2 ≠ 0 → near miss at (2, 1)
    // SEA +7: digit 1 → position 1 ([1,5]) → row 1 ≠ 0 → near miss at (1, 1)
    const result = checkFullBoard(qn5x5, 11, 14, 'NE', 'SEA');

    expect(result.winnerPos).toEqual({ row: 0, col: 1 });
    expect(result.nearMissPositions).toHaveLength(4);

    expect(result.nearMissPositions).toContainEqual({
      pos: { row: 0, col: 4 },
      nearMiss: { team: 'NE', points: 3 },
    });
    expect(result.nearMissPositions).toContainEqual({
      pos: { row: 0, col: 3 },
      nearMiss: { team: 'NE', points: 7 },
    });
    expect(result.nearMissPositions).toContainEqual({
      pos: { row: 2, col: 1 },
      nearMiss: { team: 'SEA', points: 3 },
    });
    expect(result.nearMissPositions).toContainEqual({
      pos: { row: 1, col: 1 },
      nearMiss: { team: 'SEA', points: 7 },
    });
  });
});

// ── 5x10 mixed-axis near misses ──────────────────────────

describe('checkFullBoard 5x10 near misses', () => {
  // 5 columns (2-digit) x 10 rows (1-digit)
  const qn5x10: QuarterNumbers = {
    topNumbers: [[6, 5], [7, 2], [4, 9], [3, 0], [8, 1]],
    leftNumbers: [[4], [2], [8], [7], [3], [9], [5], [1], [0], [6]],
  };

  it('finds winner with 2-digit top and 1-digit left', () => {
    // Score: top=3, left=0 → digits 3, 0
    // Top: 3 in position 3 ([3,0])
    // Left: 0 in position 8 ([0])
    const result = checkFullBoard(qn5x10, 3, 0, 'NE', 'SEA');
    expect(result.winnerPos).toEqual({ row: 8, col: 3 });
  });

  it('2-digit top position filters near miss in same col', () => {
    // Score: top=3, left=0 → digits 3, 0
    // Winner: col 3 ([3,0]), row 8 ([0])
    // NE +7: digit 0 → position 3 ([3,0]) → same col! Filtered.
    const result = checkFullBoard(qn5x10, 3, 0, 'NE', 'SEA');
    const nePlus7 = result.nearMissPositions.find(
      nm => nm.nearMiss.team === 'NE' && nm.nearMiss.points === 7,
    );
    expect(nePlus7).toBeUndefined();
  });

  it('1-digit left rows produce normal near misses', () => {
    // Score: top=3, left=0 → digits 3, 0
    // Winner: col 3, row 8
    // SEA +3: digit 3 → row 4 ([3]) → row 4 ≠ 8 → near miss at (4, 3)
    // SEA +7: digit 7 → row 3 ([7]) → row 3 ≠ 8 → near miss at (3, 3)
    const result = checkFullBoard(qn5x10, 3, 0, 'NE', 'SEA');

    expect(result.nearMissPositions).toContainEqual({
      pos: { row: 4, col: 3 },
      nearMiss: { team: 'SEA', points: 3 },
    });
    expect(result.nearMissPositions).toContainEqual({
      pos: { row: 3, col: 3 },
      nearMiss: { team: 'SEA', points: 7 },
    });
  });
});

// ── getFullBoardCellStatuses with 5-axis board ───────────

describe('getFullBoardCellStatuses on 5x5 board', () => {
  const board5x5: Board = {
    config: {
      name: 'Test 5x5', cols: 5, rows: 5, reroll: false,
      topTeam: 'NE', leftTeam: 'SEA',
    },
    fullBoard: {
      quarters: [{
        topNumbers: [[0, 2], [1, 7], [3, 6], [8, 5], [4, 9]],
        leftNumbers: [[6, 4], [1, 5], [7, 2], [8, 9], [3, 0]],
      }],
      grid: [
        ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'],
        ['Frank', 'Grace', 'Hank', 'Ivy', 'Jack'],
        ['Kate', 'Leo', 'Mia', 'Nick', 'Olive'],
        ['Pete', 'Quinn', 'Rose', 'Sam', 'Tom'],
        ['Uma', 'Val', 'Walt', 'Xena', 'Yuri'],
      ],
      mySquareNames: ['Mia', 'Alice'],
    },
  };

  it('highlights correct winner cell on 5x5', () => {
    // Score: NE 11, SEA 14 → digits 1, 4
    // Top: 1 in position 1 ([1,7])
    // Left: 4 in position 0 ([6,4])
    // Winner: (0, 1) = Bob
    const state: GameState = { quarter: 0, score: { top: 11, left: 14 } };
    const statuses = getFullBoardCellStatuses(board5x5, state);
    const winner = statuses.get('0,1');
    expect(winner).toBeDefined();
    expect(winner!.isWinner).toBe(true);
  });

  it('highlights near-miss cells on 5x5', () => {
    // Score: NE 11, SEA 14 → digits 1, 4
    // Winner: col 1, row 0
    // NE +3: digit 4 → col 4 → near miss at (0, 4) = Eve
    // NE +7: digit 8 → col 3 → near miss at (0, 3) = Dave
    // SEA +3: digit 7 → row 2 → near miss at (2, 1) = Leo
    // SEA +7: digit 1 → row 1 → near miss at (1, 1) = Grace
    const state: GameState = { quarter: 0, score: { top: 11, left: 14 } };
    const statuses = getFullBoardCellStatuses(board5x5, state);

    expect(statuses.get('0,4')?.nearMisses).toContainEqual({ team: 'NE', points: 3 });
    expect(statuses.get('0,3')?.nearMisses).toContainEqual({ team: 'NE', points: 7 });
    expect(statuses.get('2,1')?.nearMisses).toContainEqual({ team: 'SEA', points: 3 });
    expect(statuses.get('1,1')?.nearMisses).toContainEqual({ team: 'SEA', points: 7 });
  });

  it('tracks isMine correctly on near-miss cells', () => {
    // Score: NE 13, SEA 20 → digits 3, 0
    // Winner: col 2 ([3,6]), row 4 ([3,0]) = Walt
    // NE +7: digit 0 → col 0 ([0,2]) → near miss at (4, 0) = Uma
    // SEA +7: digit 7 → row 2 ([7,2]) → near miss at (2, 2) = Mia (tracked!)
    const state: GameState = { quarter: 0, score: { top: 13, left: 20 } };
    const statuses = getFullBoardCellStatuses(board5x5, state);

    const mia = statuses.get('2,2');
    expect(mia).toBeDefined();
    expect(mia!.isMine).toBe(true);
    expect(mia!.nearMisses.length).toBeGreaterThan(0);
  });
});
