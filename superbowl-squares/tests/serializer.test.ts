import { describe, it, expect } from 'vitest';
import { serializeBoards, serializeBoard } from '../src/core/serializer.js';
import { parseBoards, parseSingleBoard } from '../src/core/parser.js';
import { Board } from '../src/core/types.js';

// ── Round-trip tests (serialize → parse → compare) ─────

describe('serializeBoard', () => {
  it('serializes a simple 10x10 non-reroll board', () => {
    const board: Board = {
      config: {
        name: 'Office Pool', buyIn: 10, cols: 10, rows: 10,
        reroll: false, topTeam: 'Patriots', leftTeam: 'Seahawks',
        payouts: [100, 250, 100, 250],
      },
      mySquares: [
        { quarters: [{ topDigits: [0], leftDigits: [7] }] },
        { quarters: [{ topDigits: [3], leftDigits: [4] }] },
      ],
    };

    const text = serializeBoard(board);
    expect(text).toContain('Office Pool');
    expect(text).toContain('$10');
    expect(text).toContain('10x10');
    expect(text).toContain('Patriots vs Seahawks');
    expect(text).toContain('Payouts 100 250 100 250');
    expect(text).toContain('Patriots 0, Seahawks 7');
    expect(text).toContain('Patriots 3, Seahawks 4');
  });

  it('serializes a 5x5 reroll board', () => {
    const board: Board = {
      config: {
        name: 'Side Bet', buyIn: 25, cols: 5, rows: 5,
        reroll: true, topTeam: 'Patriots', leftTeam: 'Seahawks',
      },
      mySquares: [
        {
          quarters: [
            { topDigits: [0, 3], leftDigits: [1, 2] },
            { topDigits: [5, 6], leftDigits: [4, 8] },
            { topDigits: [4, 0], leftDigits: [4, 3] },
            { topDigits: [7, 8], leftDigits: [4, 7] },
          ],
        },
      ],
    };

    const text = serializeBoard(board);
    expect(text).toContain('reroll');
    expect(text).toContain('Patriots 03 56 40 78, Seahawks 12 48 43 47');
  });

  it('serializes a full board', () => {
    const board: Board = {
      config: {
        name: 'Family', buyIn: 10, cols: 5, rows: 5,
        reroll: false, topTeam: 'Seahawks', leftTeam: 'Patriots',
      },
      fullBoard: {
        quarters: [{
          topNumbers: [[0, 3], [1, 9], [2, 8], [4, 6], [5, 7]],
          leftNumbers: [[6, 5], [1, 2], [3, 9], [4, 7], [8, 0]],
        }],
        grid: [
          ['Alice', 'Bob', 'Carol', 'Dan', 'Eve'],
          ['Frank', 'Grace', 'Henry', 'Ivy', 'Jack'],
          ['Kate', 'Leo', 'Mia', 'Noah', 'Olive'],
          ['Pete', 'Quinn', 'Rose', 'Sam', 'Tina'],
          ['Uma', 'Vic', 'Wendy', 'Xander', 'Yara'],
        ],
        mySquareNames: ['Alice', 'Mia', 'Yara'],
      },
    };

    const text = serializeBoard(board);
    expect(text).toContain('full');
    expect(text).toContain('Seahawks (top) vs Patriots (left)');
    expect(text).toContain('Top Seahawks 03 19 28 46 57');
    expect(text).toContain('Left Patriots 65 12 39 47 80');
    expect(text).toContain('Alice, Bob, Carol, Dan, Eve');
    expect(text).toContain('Mine Alice, Mia, Yara');
  });
});

// ── Round-trip: serialize then parse back ───────────────

describe('round-trip serialize→parse', () => {
  it('round-trips a non-reroll my-squares board', () => {
    const original: Board = {
      config: {
        name: 'Pool', buyIn: 10, cols: 10, rows: 10,
        reroll: false, topTeam: 'Chiefs', leftTeam: 'Eagles',
        payouts: [100, 200, 100, 400],
      },
      mySquares: [
        { quarters: [{ topDigits: [3], leftDigits: [7] }] },
        { quarters: [{ topDigits: [0], leftDigits: [0] }] },
      ],
    };

    const text = serializeBoard(original);
    const parsed = parseSingleBoard(text);

    expect(parsed.config.name).toBe('Pool');
    expect(parsed.config.buyIn).toBe(10);
    expect(parsed.config.cols).toBe(10);
    expect(parsed.config.rows).toBe(10);
    expect(parsed.config.reroll).toBe(false);
    expect(parsed.config.topTeam).toBe('Chiefs');
    expect(parsed.config.leftTeam).toBe('Eagles');
    expect(parsed.config.payouts).toEqual([100, 200, 100, 400]);
    expect(parsed.mySquares).toHaveLength(2);
    expect(parsed.mySquares![0].quarters[0].topDigits).toEqual([3]);
    expect(parsed.mySquares![0].quarters[0].leftDigits).toEqual([7]);
  });

  it('round-trips a reroll my-squares board', () => {
    const original: Board = {
      config: {
        name: 'Reroll', buyIn: 25, cols: 5, rows: 5,
        reroll: true, topTeam: 'A', leftTeam: 'B',
      },
      mySquares: [
        {
          quarters: [
            { topDigits: [0, 3], leftDigits: [1, 2] },
            { topDigits: [5, 6], leftDigits: [4, 8] },
            { topDigits: [4, 0], leftDigits: [4, 3] },
            { topDigits: [7, 8], leftDigits: [4, 7] },
          ],
        },
      ],
    };

    const text = serializeBoard(original);
    const parsed = parseSingleBoard(text);
    expect(parsed.config.reroll).toBe(true);
    expect(parsed.mySquares![0].quarters[1].topDigits).toEqual([5, 6]);
    expect(parsed.mySquares![0].quarters[2].leftDigits).toEqual([4, 3]);
  });

  it('round-trips multiple boards', () => {
    const boards: Board[] = [
      {
        config: {
          name: 'Board1', buyIn: 10, cols: 10, rows: 10,
          reroll: false, topTeam: 'X', leftTeam: 'Y',
        },
        mySquares: [{ quarters: [{ topDigits: [5], leftDigits: [5] }] }],
      },
      {
        config: {
          name: 'Board2', buyIn: 5, cols: 5, rows: 5,
          reroll: false, topTeam: 'A', leftTeam: 'B',
        },
        mySquares: [{ quarters: [{ topDigits: [0, 1], leftDigits: [2, 3] }] }],
      },
    ];

    const text = serializeBoards(boards);
    const parsed = parseBoards(text);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].config.name).toBe('Board1');
    expect(parsed[1].config.name).toBe('Board2');
    expect(parsed[1].mySquares![0].quarters[0].topDigits).toEqual([0, 1]);
  });
});
