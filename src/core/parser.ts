import {
  Board, BoardConfig, MySquare, QuarterDigits,
  FullBoardData, QuarterNumbers, AxisSize,
} from './types.js';

export function parseBoards(input: string): Board[] {
  const blocks = input
    .split(/\n\s*---\s*\n/)
    .map(b => b.trim())
    .filter(b => b.length > 0);
  return blocks.map(parseSingleBoard);
}

export function parseSingleBoard(block: string): Board {
  const lines = block
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));

  if (lines.length < 2) {
    throw new Error('Board needs at least a header and teams line');
  }

  let idx = 0;

  // Line 1: Header
  const config = parseHeader(lines[idx++]);

  // Line 2: Teams
  const teams = parseTeamsLine(lines[idx++]);
  config.topTeam = teams.topTeam;
  config.leftTeam = teams.leftTeam;

  // Optional: Payouts
  if (idx < lines.length && /^payouts?\b/i.test(lines[idx])) {
    config.payouts = parsePayoutsLine(lines[idx++]);
  }

  const remaining = lines.slice(idx);
  if (remaining.length === 0) {
    throw new Error('Board must have square data or full board data');
  }

  if (isFullBoardBlock(remaining)) {
    return { config, fullBoard: parseFullBoardBlock(remaining, config) };
  } else {
    return { config, mySquares: parseMySquaresBlock(remaining, config) };
  }
}

// ── Header ──────────────────────────────────────────────

export function parseHeader(line: string): BoardConfig {
  let rest = line;

  // Extract buy-in ($N)
  let buyIn: number | undefined;
  const buyMatch = rest.match(/\$(\d+)/);
  if (buyMatch) {
    buyIn = parseInt(buyMatch[1]);
    rest = rest.replace(buyMatch[0], ' ');
  }

  // Extract size: NxN
  let cols: AxisSize = 10;
  let rows: AxisSize = 10;
  const dimMatch = rest.match(/\b(5|10)\s*x\s*(5|10)\b/i);
  if (dimMatch) {
    cols = parseInt(dimMatch[1]) as AxisSize;
    rows = parseInt(dimMatch[2]) as AxisSize;
    rest = rest.replace(dimMatch[0], ' ');
  } else {
    const sqMatch = rest.match(/\b(25|50|100)\s*squares?\b/i);
    if (sqMatch) {
      const total = parseInt(sqMatch[1]);
      if (total === 25) { cols = 5; rows = 5; }
      else if (total === 100) { cols = 10; rows = 10; }
      else { cols = 5; rows = 10; }
      rest = rest.replace(sqMatch[0], ' ');
    }
  }

  // Extract reroll
  const reroll = /\bre-?roll\b/i.test(rest);
  rest = rest.replace(/\bre-?roll\b/gi, ' ');

  // Remove "full" keyword
  rest = rest.replace(/\bfull\b/gi, ' ');

  // Remaining is the board name
  let name = rest.replace(/\s+/g, ' ').trim();
  if (!name) name = 'Board';

  return { name, buyIn, cols, rows, reroll, topTeam: '', leftTeam: '' };
}

// ── Teams ───────────────────────────────────────────────

export function parseTeamsLine(line: string): { topTeam: string; leftTeam: string } {
  const vsMatch = line.match(/(.+?)\s+vs\.?\s+(.+)/i);
  if (!vsMatch) {
    throw new Error(`Expected "Team1 vs Team2", got: "${line}"`);
  }

  let t1 = vsMatch[1].trim();
  let t2 = vsMatch[2].trim();

  // Check for (top)/(left) annotations
  const t1Top = /\(top\)/i.test(t1);
  const t1Left = /\(left\)/i.test(t1);
  const t2Top = /\(top\)/i.test(t2);
  const t2Left = /\(left\)/i.test(t2);

  const clean = (s: string) => s.replace(/\s*\((top|left)\)\s*/gi, '').trim();
  t1 = clean(t1);
  t2 = clean(t2);

  if (t1Left || t2Top) {
    return { topTeam: t2, leftTeam: t1 };
  }
  // Default or explicit: first=top, second=left
  return { topTeam: t1, leftTeam: t2 };
}

// ── Payouts ─────────────────────────────────────────────

function parsePayoutsLine(line: string): number[] {
  const m = line.match(/^payouts?\s+(.+)/i);
  if (!m) return [];
  return m[1].split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n));
}

// ── Detection ───────────────────────────────────────────

function isFullBoardBlock(lines: string[]): boolean {
  const first = lines[0];
  return /^top\s/i.test(first) || /^q[1-4]\s/i.test(first);
}

// ── My Squares ──────────────────────────────────────────

function parseMySquaresBlock(lines: string[], config: BoardConfig): MySquare[] {
  return lines.map(line => parseMySquareLine(line, config));
}

function parseMySquareLine(line: string, config: BoardConfig): MySquare {
  const comma = findTeamSplitIndex(line, config);
  const topPart = line.substring(0, comma).trim();
  const leftPart = line.substring(comma + 1).trim();

  const topGroups = extractDigitGroups(topPart, config.topTeam);
  const leftGroups = extractDigitGroups(leftPart, config.leftTeam);

  if (config.reroll) {
    if (topGroups.length !== 4 || leftGroups.length !== 4) {
      throw new Error(
        `Reroll board needs 4 digit-groups per team. Got top=${topGroups.length}, left=${leftGroups.length} in: "${line}"`,
      );
    }
    return {
      quarters: Array.from({ length: 4 }, (_, q) => ({
        topDigits: topGroups[q],
        leftDigits: leftGroups[q],
      })),
    };
  }

  if (topGroups.length !== 1 || leftGroups.length !== 1) {
    throw new Error(
      `Non-reroll board needs 1 digit-group per team. Got top=${topGroups.length}, left=${leftGroups.length} in: "${line}"`,
    );
  }
  return {
    quarters: [{ topDigits: topGroups[0], leftDigits: leftGroups[0] }],
  };
}

/** Find the comma that separates Team1 data from Team2 data */
function findTeamSplitIndex(line: string, config: BoardConfig): number {
  // For reroll squares the line can contain many digits, so we need to find
  // the comma that separates the two team sections. We look for ", <LeftTeam>"
  const pattern = new RegExp(`,\\s*${escapeRegex(config.leftTeam)}\\b`, 'i');
  const m = line.match(pattern);
  if (m && m.index !== undefined) return m.index;

  // Fallback: first comma
  const idx = line.indexOf(',');
  if (idx === -1) throw new Error(`No comma separator in square line: "${line}"`);
  return idx;
}

function extractDigitGroups(part: string, teamName: string): number[][] {
  // Remove team name prefix
  const re = new RegExp(`^${escapeRegex(teamName)}\\s+`, 'i');
  const digitStr = part.replace(re, '').trim();
  return digitStr.split(/\s+/).map(parseDigitGroup);
}

export function parseDigitGroup(g: string): number[] {
  if (g.length === 1 && /\d/.test(g)) return [parseInt(g)];
  if (g.length === 2 && /\d\d/.test(g)) return [parseInt(g[0]), parseInt(g[1])];
  throw new Error(`Invalid digit group "${g}": expected 1 or 2 digits`);
}

// ── Full Board ──────────────────────────────────────────

function parseFullBoardBlock(lines: string[], config: BoardConfig): FullBoardData {
  let idx = 0;
  const quarters: QuarterNumbers[] = [];

  if (config.reroll) {
    for (let q = 0; q < 4; q++) {
      if (idx >= lines.length) throw new Error(`Missing Q${q + 1} line`);
      quarters.push(parseQuarterLine(lines[idx++], config));
    }
  } else {
    // Two lines: Top ... and Left ...
    if (idx + 1 >= lines.length) throw new Error('Need Top and Left lines');
    const topNums = parseNumbersLine(lines[idx++], config.cols);
    const leftNums = parseNumbersLine(lines[idx++], config.rows);
    quarters.push({ topNumbers: topNums, leftNumbers: leftNums });
  }

  // Grid rows
  const grid: string[][] = [];
  for (let r = 0; r < config.rows; r++) {
    if (idx >= lines.length) throw new Error(`Missing grid row ${r + 1}`);
    grid.push(parseGridRow(lines[idx++], config.cols));
  }

  // Optional Mine line
  let mySquareNames: string[] = [];
  if (idx < lines.length && /^mine\b/i.test(lines[idx])) {
    const mineStr = lines[idx++].replace(/^mine\s+/i, '');
    mySquareNames = mineStr.split(',').map(n => n.trim()).filter(n => n.length > 0);
  }

  return { quarters, grid, mySquareNames };
}

function parseQuarterLine(line: string, config: BoardConfig): QuarterNumbers {
  // Format: "Q1 Top 03 19 28 46 57, Left 65 12 39 47 80"
  const content = line.replace(/^q[1-4]\s+/i, '').trim();
  const splitMatch = content.match(/^top\s+(.*?)\s*,\s*left\s+(.*)/i);
  if (!splitMatch) {
    throw new Error(`Expected "Q_ Top ..., Left ..." format in: "${line}"`);
  }

  const topStr = stripTeamName(splitMatch[1].trim());
  const leftStr = stripTeamName(splitMatch[2].trim());

  const topNumbers = topStr.split(/\s+/).map(parseDigitGroup);
  const leftNumbers = leftStr.split(/\s+/).map(parseDigitGroup);

  if (topNumbers.length !== config.cols) {
    throw new Error(`Expected ${config.cols} top numbers, got ${topNumbers.length}`);
  }
  if (leftNumbers.length !== config.rows) {
    throw new Error(`Expected ${config.rows} left numbers, got ${leftNumbers.length}`);
  }

  return { topNumbers, leftNumbers };
}

function parseNumbersLine(line: string, axisSize: AxisSize): number[][] {
  // Remove "Top"/"Left" keyword and optional team name
  let content = line.replace(/^(top|left)\s+/i, '').trim();
  content = stripTeamName(content);

  const groups = content.split(/\s+/).map(parseDigitGroup);
  if (groups.length !== axisSize) {
    throw new Error(`Expected ${axisSize} number groups, got ${groups.length} in: "${line}"`);
  }
  return groups;
}

/** Strip a team name prefix before digits */
function stripTeamName(s: string): string {
  const i = s.search(/\d/);
  if (i <= 0) return s;
  return s.substring(i).trim();
}

function parseGridRow(line: string, expectedCols: number): string[] {
  // Prefer comma-separated
  if (line.includes(',')) {
    const names = line.split(',').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === expectedCols) return names;
  }
  // Fall back to space-separated
  const names = line.split(/\s+/).filter(n => n.length > 0);
  if (names.length === expectedCols) return names;

  throw new Error(
    `Grid row needs ${expectedCols} names, couldn't parse: "${line}"`,
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
