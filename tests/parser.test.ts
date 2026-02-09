import { describe, it, expect } from 'vitest';
import { parseBoards, parseSingleBoard, parseHeader, parseTeamsLine, parseDigitGroup } from '../src/core/parser.js';

// ── parseDigitGroup ─────────────────────────────────────

describe('parseDigitGroup', () => {
  it('parses single digit', () => {
    expect(parseDigitGroup('7')).toEqual([7]);
    expect(parseDigitGroup('0')).toEqual([0]);
  });

  it('parses double digit (5-axis)', () => {
    expect(parseDigitGroup('03')).toEqual([0, 3]);
    expect(parseDigitGroup('57')).toEqual([5, 7]);
  });

  it('rejects invalid groups', () => {
    expect(() => parseDigitGroup('abc')).toThrow();
    expect(() => parseDigitGroup('123')).toThrow();
  });
});

// ── parseHeader ─────────────────────────────────────────

describe('parseHeader', () => {
  it('parses name, buy-in, and size', () => {
    const h = parseHeader('Office Pool $10 10x10');
    expect(h.name).toBe('Office Pool');
    expect(h.buyIn).toBe(10);
    expect(h.cols).toBe(10);
    expect(h.rows).toBe(10);
    expect(h.reroll).toBe(false);
  });

  it('parses reroll flag', () => {
    const h = parseHeader('Side Bet $25 5x5 reroll');
    expect(h.name).toBe('Side Bet');
    expect(h.buyIn).toBe(25);
    expect(h.cols).toBe(5);
    expect(h.rows).toBe(5);
    expect(h.reroll).toBe(true);
  });

  it('parses re-roll (hyphenated)', () => {
    const h = parseHeader('Pool $25 5x5 re-roll');
    expect(h.reroll).toBe(true);
  });

  it('parses "N squares" format', () => {
    const h = parseHeader('$10 100 squares');
    expect(h.cols).toBe(10);
    expect(h.rows).toBe(10);
  });

  it('parses "25 squares"', () => {
    const h = parseHeader('Family $5 25 squares');
    expect(h.cols).toBe(5);
    expect(h.rows).toBe(5);
  });

  it('parses 5x10 mixed size', () => {
    const h = parseHeader('Mixed $10 5x10');
    expect(h.cols).toBe(5);
    expect(h.rows).toBe(10);
  });

  it('parses 10x5 mixed size', () => {
    const h = parseHeader('Mixed $10 10x5');
    expect(h.cols).toBe(10);
    expect(h.rows).toBe(5);
  });

  it('handles no buy-in', () => {
    const h = parseHeader('Free Pool 10x10');
    expect(h.buyIn).toBeUndefined();
    expect(h.name).toBe('Free Pool');
  });

  it('strips "full" keyword', () => {
    const h = parseHeader('Family $10 5x5 full');
    expect(h.name).toBe('Family');
  });
});

// ── parseTeamsLine ──────────────────────────────────────

describe('parseTeamsLine', () => {
  it('parses simple "Team1 vs Team2"', () => {
    const t = parseTeamsLine('Patriots vs Seahawks');
    expect(t.topTeam).toBe('Patriots');
    expect(t.leftTeam).toBe('Seahawks');
  });

  it('parses with (top)/(left) annotations', () => {
    const t = parseTeamsLine('Seahawks (top) vs Patriots (left)');
    expect(t.topTeam).toBe('Seahawks');
    expect(t.leftTeam).toBe('Patriots');
  });

  it('parses reversed annotations', () => {
    const t = parseTeamsLine('Patriots (left) vs Seahawks (top)');
    expect(t.topTeam).toBe('Seahawks');
    expect(t.leftTeam).toBe('Patriots');
  });

  it('handles multi-word team names', () => {
    const t = parseTeamsLine('Kansas City Chiefs vs San Francisco 49ers');
    expect(t.topTeam).toBe('Kansas City Chiefs');
    expect(t.leftTeam).toBe('San Francisco 49ers');
  });

  it('rejects missing vs', () => {
    expect(() => parseTeamsLine('Patriots Seahawks')).toThrow();
  });
});

// ── parseSingleBoard: my-squares non-reroll ─────────────

describe('parseSingleBoard: my-squares non-reroll', () => {
  it('parses a 10x10 board with one square', () => {
    const input = `Office Pool $10 10x10
Patriots vs Seahawks
Patriots 0, Seahawks 7`;

    const board = parseSingleBoard(input);
    expect(board.config.name).toBe('Office Pool');
    expect(board.config.cols).toBe(10);
    expect(board.config.rows).toBe(10);
    expect(board.config.reroll).toBe(false);
    expect(board.config.topTeam).toBe('Patriots');
    expect(board.config.leftTeam).toBe('Seahawks');
    expect(board.mySquares).toHaveLength(1);
    expect(board.mySquares![0].quarters[0].topDigits).toEqual([0]);
    expect(board.mySquares![0].quarters[0].leftDigits).toEqual([7]);
  });

  it('parses multiple squares', () => {
    const input = `Pool $10 10x10
Patriots vs Seahawks
Patriots 0, Seahawks 7
Patriots 3, Seahawks 4`;

    const board = parseSingleBoard(input);
    expect(board.mySquares).toHaveLength(2);
    expect(board.mySquares![1].quarters[0].topDigits).toEqual([3]);
    expect(board.mySquares![1].quarters[0].leftDigits).toEqual([4]);
  });

  it('parses 5x5 board with double-digit squares', () => {
    const input = `Small $5 5x5
Patriots vs Seahawks
Patriots 03, Seahawks 17`;

    const board = parseSingleBoard(input);
    expect(board.mySquares![0].quarters[0].topDigits).toEqual([0, 3]);
    expect(board.mySquares![0].quarters[0].leftDigits).toEqual([1, 7]);
  });

  it('parses 5x10 mixed board', () => {
    const input = `Mixed $10 5x10
Patriots vs Seahawks
Patriots 45, Seahawks 7`;

    const board = parseSingleBoard(input);
    expect(board.config.cols).toBe(5);
    expect(board.config.rows).toBe(10);
    expect(board.mySquares![0].quarters[0].topDigits).toEqual([4, 5]);
    expect(board.mySquares![0].quarters[0].leftDigits).toEqual([7]);
  });

  it('parses payouts', () => {
    const input = `Pool $10 10x10
Patriots vs Seahawks
Payouts 100 250 100 250
Patriots 0, Seahawks 7`;

    const board = parseSingleBoard(input);
    expect(board.config.payouts).toEqual([100, 250, 100, 250]);
  });

  it('parses payouts on full board', () => {
    const input = `Pool $25 5x5 full
Patriots (top) vs Seahawks (left)
Payouts 50 100 50 200
Top Patriots 03 19 28 46 57
Left Seahawks 65 12 39 47 80
A, B, C, D, E
F, G, H, I, J
K, L, M, N, O
P, Q, R, S, T
U, V, W, X, Y`;

    const board = parseSingleBoard(input);
    expect(board.config.payouts).toEqual([50, 100, 50, 200]);
    expect(board.fullBoard).toBeDefined();
  });
});

// ── parseSingleBoard: my-squares reroll ─────────────────

describe('parseSingleBoard: my-squares reroll', () => {
  it('parses a reroll 5x5 board', () => {
    const input = `Side Bet $25 5x5 reroll
Patriots vs Seahawks
Patriots 03 56 40 78, Seahawks 12 48 43 47`;

    const board = parseSingleBoard(input);
    expect(board.config.reroll).toBe(true);
    expect(board.mySquares).toHaveLength(1);

    const sq = board.mySquares![0];
    expect(sq.quarters).toHaveLength(4);
    // Q1
    expect(sq.quarters[0].topDigits).toEqual([0, 3]);
    expect(sq.quarters[0].leftDigits).toEqual([1, 2]);
    // Q2
    expect(sq.quarters[1].topDigits).toEqual([5, 6]);
    expect(sq.quarters[1].leftDigits).toEqual([4, 8]);
    // Q3
    expect(sq.quarters[2].topDigits).toEqual([4, 0]);
    expect(sq.quarters[2].leftDigits).toEqual([4, 3]);
    // Q4
    expect(sq.quarters[3].topDigits).toEqual([7, 8]);
    expect(sq.quarters[3].leftDigits).toEqual([4, 7]);
  });

  it('parses reroll 10x10 board', () => {
    const input = `Big $25 10x10 reroll
Patriots vs Seahawks
Patriots 0 5 4 7, Seahawks 1 4 3 4`;

    const board = parseSingleBoard(input);
    expect(board.mySquares![0].quarters[0].topDigits).toEqual([0]);
    expect(board.mySquares![0].quarters[3].leftDigits).toEqual([4]);
  });
});

// ── parseSingleBoard: full board ────────────────────────

describe('parseSingleBoard: full board non-reroll', () => {
  it('parses a 5x5 full board', () => {
    const input = `Family Pool $10 5x5 full
Seahawks (top) vs Patriots (left)
Top Seahawks 03 19 28 46 57
Left Patriots 65 12 39 47 80
Alice, Bob, Carol, Dan, Eve
Frank, Grace, Henry, Ivy, Jack
Kate, Leo, Mia, Noah, Olive
Pete, Quinn, Rose, Sam, Tina
Uma, Vic, Wendy, Xander, Yara
Mine Alice, Mia, Yara`;

    const board = parseSingleBoard(input);
    expect(board.config.topTeam).toBe('Seahawks');
    expect(board.config.leftTeam).toBe('Patriots');
    expect(board.fullBoard).toBeDefined();

    const fb = board.fullBoard!;
    expect(fb.quarters).toHaveLength(1);
    expect(fb.quarters[0].topNumbers).toEqual([[0, 3], [1, 9], [2, 8], [4, 6], [5, 7]]);
    expect(fb.quarters[0].leftNumbers).toEqual([[6, 5], [1, 2], [3, 9], [4, 7], [8, 0]]);
    expect(fb.grid).toHaveLength(5);
    expect(fb.grid[0]).toEqual(['Alice', 'Bob', 'Carol', 'Dan', 'Eve']);
    expect(fb.grid[2][2]).toBe('Mia');
    expect(fb.mySquareNames).toEqual(['Alice', 'Mia', 'Yara']);
  });

  it('parses space-separated grid names', () => {
    const input = `Pool $10 5x5 full
A (top) vs B (left)
Top 03 19 28 46 57
Left 65 12 39 47 80
A1 A2 A3 A4 A5
B1 B2 B3 B4 B5
C1 C2 C3 C4 C5
D1 D2 D3 D4 D5
E1 E2 E3 E4 E5
Mine A1, C3`;

    const board = parseSingleBoard(input);
    expect(board.fullBoard!.grid[0]).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
    expect(board.fullBoard!.mySquareNames).toEqual(['A1', 'C3']);
  });

  it('parses full board without Mine line', () => {
    const input = `Pool $10 5x5 full
A (top) vs B (left)
Top 03 19 28 46 57
Left 65 12 39 47 80
A1 A2 A3 A4 A5
B1 B2 B3 B4 B5
C1 C2 C3 C4 C5
D1 D2 D3 D4 D5
E1 E2 E3 E4 E5`;

    const board = parseSingleBoard(input);
    expect(board.fullBoard!.mySquareNames).toEqual([]);
  });
});

describe('parseSingleBoard: full board reroll', () => {
  it('parses a 5x5 reroll full board', () => {
    const input = `Family $10 5x5 reroll full
Seahawks (top) vs Patriots (left)
Q1 Top 03 19 28 46 57, Left 65 12 39 47 80
Q2 Top 14 28 05 69 37, Left 23 57 89 01 46
Q3 Top 59 06 37 12 48, Left 90 34 67 28 15
Q4 Top 27 80 14 59 36, Left 48 01 56 73 29
A, B, C, D, E
F, G, H, I, J
K, L, M, N, O
P, Q, R, S, T
U, V, W, X, Y
Mine A, M, Y`;

    const board = parseSingleBoard(input);
    expect(board.config.reroll).toBe(true);
    expect(board.fullBoard!.quarters).toHaveLength(4);
    expect(board.fullBoard!.quarters[0].topNumbers[0]).toEqual([0, 3]);
    expect(board.fullBoard!.quarters[1].leftNumbers[2]).toEqual([8, 9]);
    expect(board.fullBoard!.grid[2][2]).toBe('M');
    expect(board.fullBoard!.mySquareNames).toEqual(['A', 'M', 'Y']);
  });
});

// ── parseBoards: multiple boards ────────────────────────

describe('parseBoards', () => {
  it('parses multiple boards separated by ---', () => {
    const input = `Office Pool $10 10x10
Patriots vs Seahawks
Patriots 0, Seahawks 7
---
Side Bet $25 5x5 reroll
Patriots vs Seahawks
Patriots 03 56 40 78, Seahawks 12 48 43 47`;

    const boards = parseBoards(input);
    expect(boards).toHaveLength(2);
    expect(boards[0].config.name).toBe('Office Pool');
    expect(boards[0].config.reroll).toBe(false);
    expect(boards[1].config.name).toBe('Side Bet');
    expect(boards[1].config.reroll).toBe(true);
  });

  it('ignores comment lines', () => {
    const input = `# This is a comment
Pool $10 10x10
# Teams below
Patriots vs Seahawks
Patriots 0, Seahawks 7`;

    const boards = parseBoards(input);
    expect(boards).toHaveLength(1);
    expect(boards[0].config.name).toBe('Pool');
  });
});
