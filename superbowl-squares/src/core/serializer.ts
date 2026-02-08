import { Board, BoardConfig, MySquare, FullBoardData } from './types.js';
import { formatDigits } from './scoring.js';

export function serializeBoards(boards: Board[]): string {
  return boards.map(serializeBoard).join('\n---\n');
}

export function serializeBoard(board: Board): string {
  const lines: string[] = [];
  const c = board.config;

  // Header
  let header = c.name;
  if (c.buyIn != null) header += ` $${c.buyIn}`;
  header += ` ${c.cols}x${c.rows}`;
  if (c.reroll) header += ' reroll';
  if (board.fullBoard) header += ' full';
  lines.push(header);

  // Teams
  if (board.fullBoard) {
    lines.push(`${c.topTeam} (top) vs ${c.leftTeam} (left)`);
  } else {
    lines.push(`${c.topTeam} vs ${c.leftTeam}`);
  }

  // Payouts
  if (c.payouts && c.payouts.length > 0) {
    lines.push('Payouts ' + c.payouts.join(' '));
  }

  // Data
  if (board.fullBoard) {
    lines.push(...serializeFullBoard(board.fullBoard, c));
  } else if (board.mySquares) {
    lines.push(...serializeMySquares(board.mySquares, c));
  }

  return lines.join('\n');
}

function serializeMySquares(squares: MySquare[], config: BoardConfig): string[] {
  return squares.map(sq => {
    if (config.reroll) {
      // "Team1 d1 d2 d3 d4, Team2 d1 d2 d3 d4"
      const topParts = sq.quarters.map(q => formatDigits(q.topDigits));
      const leftParts = sq.quarters.map(q => formatDigits(q.leftDigits));
      return `${config.topTeam} ${topParts.join(' ')}, ${config.leftTeam} ${leftParts.join(' ')}`;
    } else {
      const q = sq.quarters[0];
      return `${config.topTeam} ${formatDigits(q.topDigits)}, ${config.leftTeam} ${formatDigits(q.leftDigits)}`;
    }
  });
}

function serializeFullBoard(fb: FullBoardData, config: BoardConfig): string[] {
  const lines: string[] = [];

  if (fb.quarters.length === 1) {
    // Non-reroll: Top/Left lines
    const qn = fb.quarters[0];
    lines.push(`Top ${config.topTeam} ${qn.topNumbers.map(formatDigits).join(' ')}`);
    lines.push(`Left ${config.leftTeam} ${qn.leftNumbers.map(formatDigits).join(' ')}`);
  } else {
    // Reroll: Q1-Q4 lines
    for (let q = 0; q < fb.quarters.length; q++) {
      const qn = fb.quarters[q];
      lines.push(
        `Q${q + 1} Top ${qn.topNumbers.map(formatDigits).join(' ')}, Left ${qn.leftNumbers.map(formatDigits).join(' ')}`,
      );
    }
  }

  // Grid
  for (const row of fb.grid) {
    lines.push(row.join(', '));
  }

  // Mine
  if (fb.mySquareNames.length > 0) {
    lines.push('Mine ' + fb.mySquareNames.join(', '));
  }

  return lines;
}
