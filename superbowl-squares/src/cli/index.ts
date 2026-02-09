import * as readline from 'readline';
import {
  Board, BoardConfig, GameState, AxisSize, MySquare,
  FullBoardData, QuarterDigits, QuarterNumbers,
  parseBoards, serializeBoards,
  checkAllMySquares, getFullBoardCellStatuses,
  quarterIndex, formatDigits,
} from '../core/index.js';

// ── ANSI Colors ────────────────────────────────────────

const c = {
  green:    (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow:   (s: string) => `\x1b[33m${s}\x1b[0m`,
  red:      (s: string) => `\x1b[31m${s}\x1b[0m`,
  bold:     (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim:      (s: string) => `\x1b[2m${s}\x1b[0m`,
  bgGreen:  (s: string) => `\x1b[42m${s}\x1b[0m`,
  bgYellow: (s: string) => `\x1b[43m${s}\x1b[0m`,
  cyan:     (s: string) => `\x1b[36m${s}\x1b[0m`,
  magenta:  (s: string) => `\x1b[35m${s}\x1b[0m`,
};

// ── Readline helpers ───────────────────────────────────

let rl: readline.Interface;

function initRL() {
  rl = readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(prompt: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(prompt, answer => resolve(answer.trim()));
  });
}

function quarterLabel(q: number): string {
  return q === 3 ? 'Final' : `Q${q + 1}`;
}

// ── Banner ─────────────────────────────────────────────

function printBanner() {
  console.log('');
  console.log(c.bold(c.cyan('╔══════════════════════════════════════╗')));
  console.log(c.bold(c.cyan('║   SUPER BOWL SQUARES TRACKER        ║')));
  console.log(c.bold(c.cyan('╚══════════════════════════════════════╝')));
  console.log('');
}

// ── Multi-line input ───────────────────────────────────

async function readMultiLine(): Promise<string> {
  const lines: string[] = [];
  while (true) {
    const line = await ask('');
    if (line === '') break;
    lines.push(line);
  }
  return lines.join('\n');
}

// ── Manual setup wizard ────────────────────────────────

async function manualSetup(): Promise<Board[]> {
  const boards: Board[] = [];

  for (let i = 0; i < 6; i++) {
    console.log(c.bold(`\n── Board ${i + 1} Setup ──`));

    const name = (await ask('Board name: ')) || 'Board';

    const buyInStr = await ask('Buy-in $ amount (Enter to skip): ');
    const buyIn = buyInStr ? parseInt(buyInStr) : undefined;

    let cols: AxisSize = 10;
    let rows: AxisSize = 10;
    const sizeStr = await ask('Board size? (5x5 / 5x10 / 10x5 / 10x10) [10x10]: ');
    const sizeMatch = sizeStr.match(/^(5|10)\s*x\s*(5|10)$/i);
    if (sizeMatch) {
      cols = parseInt(sizeMatch[1]) as AxisSize;
      rows = parseInt(sizeMatch[2]) as AxisSize;
    }

    const rerollStr = await ask('Reroll each quarter? (y/n) [n]: ');
    const reroll = /^y/i.test(rerollStr);

    const teamsStr = await ask('Teams (e.g., "Chiefs vs Eagles"): ');
    const vsMatch = teamsStr.match(/(.+?)\s+vs\.?\s+(.+)/i);
    const topTeam = vsMatch ? vsMatch[1].trim() : 'Home';
    const leftTeam = vsMatch ? vsMatch[2].trim() : 'Away';

    const payoutsStr = await ask('Payouts per quarter (e.g., "100 250 100 250", Enter to skip): ');
    const payouts = payoutsStr
      ? payoutsStr.split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n))
      : undefined;

    const config: BoardConfig = { name, buyIn, cols, rows, reroll, topTeam, leftTeam, payouts };

    const modeStr = await ask('Full board or just your squares? (full/my) [my]: ');
    const isFull = /^f/i.test(modeStr);

    let board: Board;
    if (isFull) {
      board = { config, fullBoard: await setupFullBoard(config) };
    } else {
      board = { config, mySquares: await setupMySquares(config) };
    }

    boards.push(board);

    if (i < 5) {
      const more = await ask('Add another board? (y/n) [n]: ');
      if (!/^y/i.test(more)) break;
    }
  }

  return boards;
}

async function setupMySquares(config: BoardConfig): Promise<MySquare[]> {
  const squares: MySquare[] = [];

  if (!config.reroll) {
    console.log(`Enter squares one per line like "${config.topTeam} 4, ${config.leftTeam} 7" (blank to stop):`);
    while (true) {
      const line = await ask('  Square: ');
      if (!line) break;
      try {
        const parsed = parseBoards(`${config.name} ${config.cols}x${config.rows}\n${config.topTeam} vs ${config.leftTeam}\n${line}`);
        if (parsed[0]?.mySquares?.[0]) squares.push(parsed[0].mySquares[0]);
      } catch (e: any) {
        console.log(c.red(`  Error: ${e.message}`));
      }
    }
  } else {
    console.log(`Enter squares like "${config.topTeam} 0 5 4 7, ${config.leftTeam} 1 4 3 4" (blank to stop):`);
    while (true) {
      const line = await ask('  Square: ');
      if (!line) break;
      try {
        const parsed = parseBoards(`${config.name} ${config.cols}x${config.rows} reroll\n${config.topTeam} vs ${config.leftTeam}\n${line}`);
        if (parsed[0]?.mySquares?.[0]) squares.push(parsed[0].mySquares[0]);
      } catch (e: any) {
        console.log(c.red(`  Error: ${e.message}`));
      }
    }
  }

  return squares;
}

async function setupFullBoard(config: BoardConfig): Promise<FullBoardData> {
  const quarters: QuarterNumbers[] = [];

  if (!config.reroll) {
    console.log('Enter Top numbers (space-separated):');
    const topLine = await ask(`  Top ${config.topTeam}: `);
    console.log('Enter Left numbers (space-separated):');
    const leftLine = await ask(`  Left ${config.leftTeam}: `);
    const topNumbers = topLine.split(/\s+/).map(g => g.split('').map(Number).length === 1 ? [parseInt(g)] : g.split('').map(Number));
    const leftNumbers = leftLine.split(/\s+/).map(g => g.split('').map(Number).length === 1 ? [parseInt(g)] : g.split('').map(Number));
    quarters.push({ topNumbers, leftNumbers });
  } else {
    for (let q = 0; q < 4; q++) {
      console.log(`Enter Q${q + 1} numbers:`);
      const topLine = await ask(`  Top: `);
      const leftLine = await ask(`  Left: `);
      const topNumbers = topLine.split(/\s+/).map(g => g.length === 2 ? [parseInt(g[0]), parseInt(g[1])] : [parseInt(g)]);
      const leftNumbers = leftLine.split(/\s+/).map(g => g.length === 2 ? [parseInt(g[0]), parseInt(g[1])] : [parseInt(g)]);
      quarters.push({ topNumbers, leftNumbers });
    }
  }

  console.log(`Enter grid rows (${config.rows} rows, ${config.cols} names per row, comma-separated):`);
  const grid: string[][] = [];
  for (let r = 0; r < config.rows; r++) {
    const row = await ask(`  Row ${r + 1}: `);
    grid.push(row.split(',').map(n => n.trim()));
  }

  const mineStr = await ask('Your names in the grid (comma-separated, Enter to skip): ');
  const mySquareNames = mineStr ? mineStr.split(',').map(n => n.trim()).filter(Boolean) : [];

  return { quarters, grid, mySquareNames };
}

// ── Display: My Squares ────────────────────────────────

function displayMySquares(board: Board, state: GameState) {
  const config = board.config;
  const sizeStr = `${config.cols}x${config.rows}`;
  const buyInStr = config.buyIn != null ? ` ($${config.buyIn})` : '';
  console.log(c.bold(`\n  ${config.name}${buyInStr} \u2014 ${sizeStr}`));

  const statuses = checkAllMySquares(board, state);
  const qi = quarterIndex(board, state.quarter);
  let hasOutput = false;

  for (let i = 0; i < statuses.length; i++) {
    const st = statuses[i];
    const sq = board.mySquares![i];
    const digits = sq.quarters[qi];

    if (st.isWinner) {
      const payoutStr = config.payouts?.[state.quarter] != null
        ? `  [$${config.payouts[state.quarter]}]`
        : '';
      console.log(c.green(c.bold(
        `    \u2726 WINNER ${config.topTeam} ${formatDigits(digits.topDigits)}, ${config.leftTeam} ${formatDigits(digits.leftDigits)}${payoutStr}`
      )));
      hasOutput = true;
    }

    if (st.nearMisses.length > 0) {
      for (const nm of st.nearMisses) {
        console.log(c.yellow(c.dim(
          `    \u25CB Near: ${config.topTeam} ${formatDigits(digits.topDigits)}, ${config.leftTeam} ${formatDigits(digits.leftDigits)} \u2192 ${nm.team} +${nm.points}`
        )));
      }
      hasOutput = true;
    }
  }

  if (!hasOutput) {
    console.log(c.dim('    No winners or near misses'));
  }
}

// ── Display: Full Board Grid ───────────────────────────

function displayFullBoard(board: Board, state: GameState) {
  const fb = board.fullBoard!;
  const config = board.config;
  const qi = quarterIndex(board, state.quarter);
  const qn = fb.quarters[qi];
  const sizeStr = `${config.cols}x${config.rows}`;
  const buyInStr = config.buyIn != null ? ` ($${config.buyIn})` : '';

  console.log(c.bold(`\n  ${config.name}${buyInStr} \u2014 ${sizeStr}`));

  const cellStatuses = getFullBoardCellStatuses(board, state);
  const mineSet = new Set(fb.mySquareNames.map(n => n.toLowerCase()));
  const cellW = config.cols === 10 ? 8 : 10;

  // Top header row
  const corner = pad('', cellW);
  const topCells = qn.topNumbers.map(d => pad(formatDigits(d), cellW));

  // Top border
  console.log('    ' + '\u250C' + repeat('\u2500', cellW) + topCells.map(() => '\u252C' + repeat('\u2500', cellW)).join('') + '\u2510');
  // Header row with team numbers
  console.log('    ' + '\u2502' + corner + '\u2502' + topCells.map(tc => tc + '\u2502').join(''));
  // Separator after header
  console.log('    ' + '\u251C' + repeat('\u2500', cellW) + topCells.map(() => '\u253C' + repeat('\u2500', cellW)).join('') + '\u2524');

  // Data rows
  for (let r = 0; r < config.rows; r++) {
    const leftLabel = pad(formatDigits(qn.leftNumbers[r]), cellW);
    let rowStr = '    \u2502' + leftLabel + '\u2502';

    for (let col = 0; col < config.cols; col++) {
      const name = fb.grid[r]?.[col] ?? '';
      const key = `${r},${col}`;
      const cs = cellStatuses.get(key);
      let cellText = pad(name, cellW);

      if (mineSet.has(name.toLowerCase())) {
        cellText = c.bold(cellText);
      }

      if (cs?.isWinner) {
        cellText = c.bgGreen(cellText);
      } else if (cs && cs.nearMisses.length > 0) {
        cellText = c.bgYellow(cellText);
      }

      rowStr += cellText + '\u2502';
    }
    console.log(rowStr);

    // Row separator (except after last row)
    if (r < config.rows - 1) {
      console.log('    ' + '\u251C' + repeat('\u2500', cellW) + Array.from({ length: config.cols }, () => '\u253C' + repeat('\u2500', cellW)).join('') + '\u2524');
    }
  }

  // Bottom border
  console.log('    ' + '\u2514' + repeat('\u2500', cellW) + Array.from({ length: config.cols }, () => '\u2534' + repeat('\u2500', cellW)).join('') + '\u2518');

  // Summary below grid
  for (const [key, cs] of cellStatuses) {
    const [rStr, cStr] = key.split(',');
    const r = parseInt(rStr);
    const col = parseInt(cStr);
    const name = fb.grid[r]?.[col] ?? '?';

    if (cs.isWinner) {
      const payoutStr = config.payouts?.[state.quarter] != null
        ? `  [$${config.payouts[state.quarter]}]`
        : '';
      const mineTag = cs.isMine ? ' (YOURS!)' : '';
      console.log(c.green(c.bold(`    \u2726 Winner: ${name}${mineTag}${payoutStr}`)));
    }
  }

  for (const [key, cs] of cellStatuses) {
    if (cs.nearMisses.length > 0 && cs.isMine) {
      const [rStr, cStr] = key.split(',');
      const r = parseInt(rStr);
      const col = parseInt(cStr);
      const name = fb.grid[r]?.[col] ?? '?';
      for (const nm of cs.nearMisses) {
        console.log(c.yellow(`    \u25CB Near: ${name} \u2192 ${nm.team} +${nm.points}`));
      }
    }
  }
}

// ── Helpers ────────────────────────────────────────────

function pad(s: string, width: number): string {
  if (s.length >= width) return s.slice(0, width);
  const left = Math.floor((width - s.length) / 2);
  return ' '.repeat(left) + s + ' '.repeat(width - s.length - left);
}

function repeat(ch: string, n: number): string {
  return ch.repeat(n);
}

// ── Display all boards ─────────────────────────────────

function displayDigitSummary(boards: Board[], state: GameState) {
  let any = false;
  for (const board of boards) {
    const qi = quarterIndex(board, state.quarter);
    const topDigits = new Set<number>();
    const leftDigits = new Set<number>();

    if (board.mySquares && board.mySquares.length > 0) {
      for (const sq of board.mySquares) {
        const d = sq.quarters[qi];
        for (const n of d.topDigits) topDigits.add(n);
        for (const n of d.leftDigits) leftDigits.add(n);
      }
    } else if (board.fullBoard && board.fullBoard.mySquareNames.length > 0) {
      const fb = board.fullBoard;
      const qn = fb.quarters[qi];
      const mineSet = new Set(fb.mySquareNames.map(n => n.toLowerCase()));
      for (let r = 0; r < board.config.rows; r++) {
        for (let col = 0; col < board.config.cols; col++) {
          const owner = fb.grid[r]?.[col] ?? '';
          if (mineSet.has(owner.toLowerCase())) {
            for (const n of qn.topNumbers[col]) topDigits.add(n);
            for (const n of qn.leftNumbers[r]) leftDigits.add(n);
          }
        }
      }
    }

    if (topDigits.size === 0 && leftDigits.size === 0) continue;
    if (!any) {
      console.log(c.dim('  My Digits This Quarter:'));
      any = true;
    }
    const sorted = (s: Set<number>) => [...s].sort((a, b) => a - b);
    console.log(c.bold(`  ${board.config.name}`));
    console.log(`    ${board.config.topTeam}: ${c.cyan('[' + sorted(topDigits).join(', ') + ']')}`);
    console.log(`    ${board.config.leftTeam}: ${c.cyan('[' + sorted(leftDigits).join(', ') + ']')}`);
  }
}

function displayAllBoards(boards: Board[], state: GameState) {
  const ql = quarterLabel(state.quarter);
  console.log('');
  console.log(c.bold(c.cyan(`  ${ql} | ${boards[0]?.config.topTeam ?? 'Team1'} ${state.score.top} - ${boards[0]?.config.leftTeam ?? 'Team2'} ${state.score.left}`)));

  displayDigitSummary(boards, state);

  for (const board of boards) {
    if (board.fullBoard) {
      displayFullBoard(board, state);
    } else {
      displayMySquares(board, state);
    }
  }
}

// ── Scoring loop ───────────────────────────────────────

async function scoringLoop(boards: Board[]) {
  const state: GameState = {
    quarter: 0,
    score: { top: 0, left: 0 },
  };

  console.log(c.bold('\n\u2550\u2550\u2550 Scoring Mode \u2550\u2550\u2550'));
  console.log(c.dim('Commands:'));
  console.log(c.dim('  Two numbers (e.g., "14 7") to update score'));
  console.log(c.dim('  "q" or "quarter" to advance quarter'));
  console.log(c.dim('  "add" to add more boards'));
  console.log(c.dim('  "mine" to set which squares you\'re tracking on a full board'));
  console.log(c.dim('  "save" to print board data for saving'));
  console.log(c.dim('  "exit" or "quit" to exit'));

  displayAllBoards(boards, state);

  while (true) {
    const input = await ask('\nScore> ');

    if (!input) continue;

    if (input === 'exit' || input === 'quit') {
      console.log(c.dim('Goodbye!'));
      break;
    }

    if (input === 'q' || input === 'quarter') {
      if (state.quarter >= 3) {
        console.log(c.yellow('Already at Final. Game is over!'));
        continue;
      }
      state.quarter++;
      console.log(c.bold(c.magenta(`\n  >>> Advancing to ${quarterLabel(state.quarter)} <<<`)));
      displayAllBoards(boards, state);
      continue;
    }

    if (input === 'add') {
      console.log('Paste board data (blank line when done), or enter manually:\n');
      const text = await readMultiLine();
      if (text.length > 0) {
        try {
          const newBoards = parseBoards(text);
          boards.push(...newBoards);
          console.log(c.green(`Added ${newBoards.length} board(s) (${boards.length} total)`));
        } catch (e: any) {
          console.log(c.red(`Parse error: ${e.message}`));
        }
      } else {
        const newBoards = await manualSetup();
        boards.push(...newBoards);
        console.log(c.green(`Added ${newBoards.length} board(s) (${boards.length} total)`));
      }
      displayAllBoards(boards, state);
      continue;
    }

    if (input === 'mine') {
      const fullBoards = boards
        .map((b, i) => ({ b, i }))
        .filter(({ b }) => b.fullBoard);
      if (fullBoards.length === 0) {
        console.log(c.yellow('No full boards loaded. "mine" only works with full boards.'));
        continue;
      }
      let target: { b: Board; i: number };
      if (fullBoards.length === 1) {
        target = fullBoards[0];
      } else {
        console.log('Which board?');
        fullBoards.forEach(({ b, i }) => console.log(`  ${i + 1}. ${b.config.name}`));
        const choice = await ask('Board #: ');
        const idx = parseInt(choice) - 1;
        const found = fullBoards.find(({ i }) => i === idx);
        if (!found) { console.log(c.red('Invalid choice.')); continue; }
        target = found;
      }
      console.log(`Current: ${target.b.fullBoard!.mySquareNames.join(', ') || '(none)'}`);
      const names = await ask('Your names (comma-separated): ');
      target.b.fullBoard!.mySquareNames = names
        .split(',')
        .map(n => n.trim())
        .filter(n => n.length > 0);
      console.log(c.green(`Tracking: ${target.b.fullBoard!.mySquareNames.join(', ')}`));
      displayAllBoards(boards, state);
      continue;
    }

    if (input === 'save') {
      console.log('\n' + c.dim('\u2500'.repeat(50)));
      console.log(c.bold(c.cyan('Board data:')));
      console.log('');
      console.log(serializeBoards(boards));
      console.log('');
      console.log(c.dim('\u2500'.repeat(50)));
      continue;
    }

    const scoreMatch = input.match(/^(\d+)\s+(\d+)$/);
    if (scoreMatch) {
      state.score.top = parseInt(scoreMatch[1]);
      state.score.left = parseInt(scoreMatch[2]);
      displayAllBoards(boards, state);
      continue;
    }

    console.log(c.red('Unknown command. Enter two numbers, "q", "add", "save", or "exit".'));
  }
}

// ── Main ───────────────────────────────────────────────

async function main() {
  initRL();
  printBanner();

  console.log('Paste your saved board data below (blank line when done),');
  console.log('or press Enter to set up manually:\n');

  const pastedText = await readMultiLine();

  let boards: Board[];

  if (pastedText.length > 0) {
    try {
      boards = parseBoards(pastedText);
      console.log(c.green(`\nParsed ${boards.length} board(s) successfully!`));
    } catch (e: any) {
      console.log(c.red(`\nParse error: ${e.message}`));
      console.log('Falling back to manual setup...');
      boards = await manualSetup();
    }
  } else {
    boards = await manualSetup();
  }

  if (boards.length === 0) {
    console.log(c.red('No boards configured. Exiting.'));
    rl.close();
    return;
  }

  // Print serialized data for saving
  console.log('\n' + c.dim('\u2500'.repeat(50)));
  console.log(c.bold(c.cyan('Save this for next time:')));
  console.log('');
  console.log(serializeBoards(boards));
  console.log('');
  console.log(c.dim('\u2500'.repeat(50)));

  await scoringLoop(boards);

  rl.close();
}

main().catch(err => {
  console.error(c.red(`Fatal error: ${err.message}`));
  process.exit(1);
});
