// ── Super Bowl Squares – Web UI ────────────────────────────────────────
// Pure DOM manipulation, no frameworks. Imports from the core library.

import {
  Board, BoardConfig, GameState, AxisSize, SquareStatus, NearMiss,
  MySquare, FullBoardData, QuarterDigits,
  parseBoards, serializeBoards,
  checkAllMySquares, getFullBoardCellStatuses, quarterIndex,
  formatDigits,
} from '../core/index.js';

// ── Constants ─────────────────────────────────────────────────────────

const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Final'];
const LS_KEY = 'sb-squares-data';

// ── App State ─────────────────────────────────────────────────────────

let boards: Board[] = [];
let gameState: GameState = { quarter: 0, score: { top: 0, left: 0 } };
let activeTab: 'setup' | 'scoring' = 'setup';

// ── DOM Helpers ───────────────────────────────────────────────────────

function el(
  tag: string,
  classNameOrAttrs?: string | Record<string, string>,
  children?: (Node | string)[],
): HTMLElement {
  const elem = document.createElement(tag);
  if (typeof classNameOrAttrs === 'string') {
    if (classNameOrAttrs) elem.className = classNameOrAttrs;
  } else if (classNameOrAttrs) {
    for (const [k, v] of Object.entries(classNameOrAttrs)) {
      if (k === 'className') elem.className = v;
      else elem.setAttribute(k, v);
    }
  }
  if (children) {
    for (const child of children) {
      elem.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
  }
  return elem;
}

function text(s: string): Text {
  return document.createTextNode(s);
}

function btn(label: string, cls: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', cls, [label]) as HTMLButtonElement;
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

function input(type: string, attrs?: Record<string, string>): HTMLInputElement {
  const inp = document.createElement('input');
  inp.type = type;
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className') inp.className = v;
      else inp.setAttribute(k, v);
    }
  }
  return inp;
}

function selectEl(options: { value: string; label: string }[]): HTMLSelectElement {
  const sel = document.createElement('select');
  for (const opt of options) {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    sel.appendChild(o);
  }
  return sel;
}

function showToast(message: string): void {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = el('div', 'toast', [message]);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

// ── Persistence ───────────────────────────────────────────────────────

function saveToLocalStorage(): void {
  if (boards.length === 0) {
    localStorage.removeItem(LS_KEY);
    return;
  }
  localStorage.setItem(LS_KEY, serializeBoards(boards));
}

function loadFromLocalStorage(): string | null {
  return localStorage.getItem(LS_KEY);
}

// ── Render Engine ─────────────────────────────────────────────────────

const app = document.getElementById('app')!;

function render(): void {
  app.innerHTML = '';
  app.appendChild(renderBanner());
  app.appendChild(renderTabs());

  if (activeTab === 'setup') {
    app.appendChild(renderSetupPanel());
  } else {
    app.appendChild(renderScoringPanel());
  }
}

// ── Banner ────────────────────────────────────────────────────────────

function renderBanner(): HTMLElement {
  const banner = el('div', 'banner', [
    el('h1', '', ['Super Bowl Squares']),
    el('div', 'subtitle', ['Track your squares, scores, and near-misses']),
  ]);
  return banner;
}

// ── Tabs ──────────────────────────────────────────────────────────────

function renderTabs(): HTMLElement {
  const tabs = el('div', 'tabs');

  const setupBtn = btn('Setup', `${activeTab === 'setup' ? 'active' : ''}`, () => {
    activeTab = 'setup';
    render();
  });

  const scoringBtn = btn('Scoring', `${activeTab === 'scoring' ? 'active' : ''}`, () => {
    if (boards.length === 0) {
      showToast('Load or add boards first');
      return;
    }
    activeTab = 'scoring';
    render();
  });

  tabs.appendChild(setupBtn);
  tabs.appendChild(scoringBtn);
  return tabs;
}

// ── Setup Panel ───────────────────────────────────────────────────────

function renderSetupPanel(): HTMLElement {
  const panel = el('div', 'setup-panel');

  // Restore bar
  const saved = loadFromLocalStorage();
  if (saved && boards.length === 0) {
    panel.appendChild(renderRestoreBar(saved));
  }

  // Paste section
  panel.appendChild(renderPasteSection());

  // Divider
  panel.appendChild(el('div', 'divider', [text('or')]));

  // Manual setup section
  panel.appendChild(renderManualSection());

  // Board list
  if (boards.length > 0) {
    panel.appendChild(renderBoardList());
  }

  return panel;
}

// ── Restore Bar ───────────────────────────────────────────────────────

function renderRestoreBar(saved: string): HTMLElement {
  const bar = el('div', 'restore-bar');
  bar.appendChild(el('span', '', ['Previously saved board data found.']));
  const actions = el('div', 'restore-actions');
  actions.appendChild(btn('Restore', 'btn btn-primary btn-sm', () => {
    try {
      boards = parseBoards(saved);
      saveToLocalStorage();
      activeTab = 'scoring';
      render();
    } catch (e: any) {
      showToast('Error restoring: ' + e.message);
    }
  }));
  actions.appendChild(btn('Dismiss', 'btn btn-secondary btn-sm', () => {
    localStorage.removeItem(LS_KEY);
    render();
  }));
  bar.appendChild(actions);
  return bar;
}

// ── Paste Section ─────────────────────────────────────────────────────

function renderPasteSection(): HTMLElement {
  const section = el('div', 'setup-section');
  section.appendChild(el('h3', '', ['Paste Board Data']));

  const ta = document.createElement('textarea');
  ta.placeholder = 'Paste your board configuration here...\n\nExample:\nOffice Pool $25 10x10\nChiefs vs Eagles\nTop Chiefs 0 1 2 3 4 5 6 7 8 9\nLeft Eagles 0 1 2 3 4 5 6 7 8 9\nAlice, Bob, ...';
  ta.rows = 8;
  section.appendChild(ta);

  const row = el('div', 'form-row mt-1');
  row.appendChild(btn('Add Boards', 'btn btn-primary', () => {
    const val = ta.value.trim();
    if (!val) { showToast('Paste board data first'); return; }
    try {
      const newBoards = parseBoards(val);
      boards.push(...newBoards);
      saveToLocalStorage();
      ta.value = '';
      if (boards.length === newBoards.length) activeTab = 'scoring';
      render();
      showToast(`Added ${newBoards.length} board(s) (${boards.length} total)`);
    } catch (e: any) {
      showToast('Parse error: ' + e.message);
    }
  }));
  row.appendChild(btn('Replace All', 'btn btn-secondary', () => {
    const val = ta.value.trim();
    if (!val) { showToast('Paste board data first'); return; }
    try {
      boards = parseBoards(val);
      saveToLocalStorage();
      activeTab = 'scoring';
      render();
      showToast(`Replaced with ${boards.length} board(s)`);
    } catch (e: any) {
      showToast('Parse error: ' + e.message);
    }
  }));
  section.appendChild(row);

  return section;
}

// ── Manual Setup Section ──────────────────────────────────────────────

function renderManualSection(): HTMLElement {
  const section = el('div', 'setup-section');
  section.appendChild(el('h3', '', ['Set Up Manually']));

  // Board name
  const nameInput = input('text', { placeholder: 'Board name (e.g. Office Pool)', className: '' });
  nameInput.style.flex = '1';
  const nameRow = el('div', 'form-row', [el('label', '', ['Name']), nameInput]);
  section.appendChild(nameRow);

  // Buy-in
  const buyInInput = input('number', { placeholder: '25', className: '' });
  buyInInput.style.width = '6rem';
  const buyInRow = el('div', 'form-row', [
    el('label', '', ['Buy-in ($)']),
    buyInInput,
  ]);
  section.appendChild(buyInRow);

  // Size
  const sizeSelect = selectEl([
    { value: '10x10', label: '10x10 (100 squares)' },
    { value: '5x5', label: '5x5 (25 squares)' },
    { value: '5x10', label: '5x10 (50 squares)' },
    { value: '10x5', label: '10x5 (50 squares)' },
  ]);
  const sizeRow = el('div', 'form-row', [el('label', '', ['Size']), sizeSelect]);
  section.appendChild(sizeRow);

  // Reroll
  const rerollCheck = input('checkbox');
  const rerollRow = el('div', 'form-row', [
    el('label', '', ['Reroll']),
    rerollCheck,
    el('span', 'text-sm text-muted', ['Numbers change each quarter']),
  ]);
  section.appendChild(rerollRow);

  // Teams
  const topTeamInput = input('text', { placeholder: 'Chiefs', className: '' });
  topTeamInput.style.flex = '1';
  const leftTeamInput = input('text', { placeholder: 'Eagles', className: '' });
  leftTeamInput.style.flex = '1';
  const teamsRow = el('div', 'form-row', [
    el('label', '', ['Teams']),
    topTeamInput,
    el('span', 'vs-label', ['vs']),
    leftTeamInput,
  ]);
  section.appendChild(teamsRow);

  // Payouts
  const payoutsInput = input('text', { placeholder: '50 100 150 200 (optional)', className: '' });
  payoutsInput.style.flex = '1';
  const payoutsRow = el('div', 'form-row', [
    el('label', '', ['Payouts']),
    payoutsInput,
  ]);
  section.appendChild(payoutsRow);

  // Mode radio: my squares or full board
  const radioMySquares = input('radio', { name: 'board-mode', value: 'mine' });
  radioMySquares.checked = true;
  const radioFull = input('radio', { name: 'board-mode', value: 'full' });

  const radioGroup = el('div', 'radio-group mt-2', [
    el('label', '', [radioMySquares, text(' Just my squares')]),
    el('label', '', [radioFull, text(' Full board')]),
  ]);
  section.appendChild(radioGroup);

  // My-squares input container
  const mySquaresDiv = el('div', 'mt-1');
  mySquaresDiv.id = 'my-squares-input';
  const mySquaresTa = document.createElement('textarea');
  mySquaresTa.placeholder = 'One square per line:\nChiefs 3, Eagles 7\nChiefs 0, Eagles 2';
  mySquaresTa.rows = 6;
  mySquaresDiv.appendChild(el('label', 'text-sm text-muted mb-1', ['Enter your squares (one per line):']));
  mySquaresDiv.appendChild(mySquaresTa);
  section.appendChild(mySquaresDiv);

  // Full-board input container
  const fullBoardDiv = el('div', 'mt-1 hidden');
  fullBoardDiv.id = 'full-board-input';

  const topNumsInput = input('text', { placeholder: '0 1 2 3 4 5 6 7 8 9', className: '' });
  topNumsInput.style.flex = '1';
  fullBoardDiv.appendChild(el('div', 'form-row', [
    el('label', '', ['Top #s']),
    topNumsInput,
  ]));

  const leftNumsInput = input('text', { placeholder: '0 1 2 3 4 5 6 7 8 9', className: '' });
  leftNumsInput.style.flex = '1';
  fullBoardDiv.appendChild(el('div', 'form-row', [
    el('label', '', ['Left #s']),
    leftNumsInput,
  ]));

  const gridTa = document.createElement('textarea');
  gridTa.placeholder = 'Grid rows (comma-separated names):\nAlice, Bob, Carol, Dave, Eve, Frank, Grace, Hank, Ivy, Jack\n...';
  gridTa.rows = 6;
  fullBoardDiv.appendChild(el('label', 'text-sm text-muted mb-1', ['Grid (one row per line):']));
  fullBoardDiv.appendChild(gridTa);

  const mineInput = input('text', { placeholder: 'Your name(s), comma-separated', className: 'w-full mt-1' });
  fullBoardDiv.appendChild(el('div', 'form-row mt-1', [
    el('label', '', ['Mine']),
    mineInput,
  ]));

  section.appendChild(fullBoardDiv);

  // Toggle visibility
  radioMySquares.addEventListener('change', () => {
    mySquaresDiv.classList.remove('hidden');
    fullBoardDiv.classList.add('hidden');
  });
  radioFull.addEventListener('change', () => {
    mySquaresDiv.classList.add('hidden');
    fullBoardDiv.classList.remove('hidden');
  });

  // Add Board button
  const addRow = el('div', 'form-row mt-2');
  addRow.appendChild(btn('Add Board', 'btn btn-primary', () => {
    try {
      const board = buildBoardFromForm(
        nameInput, buyInInput, sizeSelect, rerollCheck,
        topTeamInput, leftTeamInput, payoutsInput,
        radioMySquares, mySquaresTa,
        topNumsInput, leftNumsInput, gridTa, mineInput,
      );
      boards.push(board);
      saveToLocalStorage();
      render();
      showToast('Board added');
    } catch (e: any) {
      showToast('Error: ' + e.message);
    }
  }));
  section.appendChild(addRow);

  return section;
}

// ── Build Board from Manual Form ──────────────────────────────────────

function buildBoardFromForm(
  nameInput: HTMLInputElement,
  buyInInput: HTMLInputElement,
  sizeSelect: HTMLSelectElement,
  rerollCheck: HTMLInputElement,
  topTeamInput: HTMLInputElement,
  leftTeamInput: HTMLInputElement,
  payoutsInput: HTMLInputElement,
  radioMySquares: HTMLInputElement,
  mySquaresTa: HTMLTextAreaElement,
  topNumsInput: HTMLInputElement,
  leftNumsInput: HTMLInputElement,
  gridTa: HTMLTextAreaElement,
  mineInput: HTMLInputElement,
): Board {
  const name = nameInput.value.trim() || 'Board';
  const buyIn = buyInInput.value ? parseInt(buyInInput.value) : undefined;
  const [cols, rows] = sizeSelect.value.split('x').map(Number) as [AxisSize, AxisSize];
  const reroll = rerollCheck.checked;
  const topTeam = topTeamInput.value.trim() || 'Team A';
  const leftTeam = leftTeamInput.value.trim() || 'Team B';
  const payoutsStr = payoutsInput.value.trim();
  const payouts = payoutsStr
    ? payoutsStr.split(/[\s,]+/).map(Number).filter(n => !isNaN(n))
    : undefined;

  const config: BoardConfig = { name, buyIn, cols, rows, reroll, topTeam, leftTeam, payouts };

  const isMySquares = radioMySquares.checked;

  if (isMySquares) {
    // Build by serializing and re-parsing: construct the text block
    const lines: string[] = [];
    let header = name;
    if (buyIn != null) header += ` $${buyIn}`;
    header += ` ${cols}x${rows}`;
    if (reroll) header += ' reroll';
    lines.push(header);
    lines.push(`${topTeam} vs ${leftTeam}`);
    if (payouts && payouts.length > 0) lines.push('Payouts ' + payouts.join(' '));

    const squareLines = mySquaresTa.value.trim().split('\n').filter(l => l.trim());
    if (squareLines.length === 0) throw new Error('Enter at least one square');
    lines.push(...squareLines);

    return parseBoards(lines.join('\n'))[0];
  } else {
    // Full board
    const lines: string[] = [];
    let header = name;
    if (buyIn != null) header += ` $${buyIn}`;
    header += ` ${cols}x${rows}`;
    if (reroll) header += ' reroll';
    header += ' full';
    lines.push(header);
    lines.push(`${topTeam} (top) vs ${leftTeam} (left)`);
    if (payouts && payouts.length > 0) lines.push('Payouts ' + payouts.join(' '));

    const topNums = topNumsInput.value.trim();
    const leftNums = leftNumsInput.value.trim();
    if (!topNums || !leftNums) throw new Error('Enter top and left numbers');
    lines.push(`Top ${topTeam} ${topNums}`);
    lines.push(`Left ${leftTeam} ${leftNums}`);

    const gridLines = gridTa.value.trim().split('\n').filter(l => l.trim());
    if (gridLines.length !== rows) {
      throw new Error(`Expected ${rows} grid rows, got ${gridLines.length}`);
    }
    lines.push(...gridLines);

    const mineNames = mineInput.value.trim();
    if (mineNames) lines.push('Mine ' + mineNames);

    return parseBoards(lines.join('\n'))[0];
  }
}

// ── Board List ────────────────────────────────────────────────────────

function renderBoardList(): HTMLElement {
  const section = el('div', 'setup-section');
  section.appendChild(el('h3', '', [`Boards (${boards.length})`]));

  for (let i = 0; i < boards.length; i++) {
    const b = boards[i];
    const summary = el('div', 'board-summary');
    const info = el('div', 'board-info', [
      text(`${b.config.name} — ${b.config.cols}x${b.config.rows}`),
    ]);
    const meta = el('div', 'board-meta', [
      text(
        `${b.config.topTeam} vs ${b.config.leftTeam}` +
        (b.fullBoard ? ' (full board)' : ` (${b.mySquares?.length ?? 0} squares)`) +
        (b.config.buyIn ? ` | $${b.config.buyIn}` : ''),
      ),
    ]);
    const removeBtn = btn('Remove', 'btn btn-danger btn-sm', () => {
      boards.splice(i, 1);
      saveToLocalStorage();
      render();
    });
    const left = el('div', '', [info, meta]);
    summary.appendChild(left);
    summary.appendChild(removeBtn);
    section.appendChild(summary);
  }

  const actions = el('div', 'form-row mt-2');
  actions.appendChild(btn('Copy Board Data', 'btn btn-secondary', () => {
    const data = serializeBoards(boards);
    navigator.clipboard.writeText(data).then(() => {
      showToast('Board data copied to clipboard');
    }).catch(() => {
      showToast('Could not copy — check permissions');
    });
  }));
  actions.appendChild(btn('Start Scoring', 'btn btn-primary', () => {
    activeTab = 'scoring';
    render();
  }));
  section.appendChild(actions);

  return section;
}

// ── Scoring Panel ─────────────────────────────────────────────────────

function renderScoringPanel(): HTMLElement {
  const panel = el('div', 'scoring-panel');
  panel.appendChild(renderScoringHeader());

  for (const board of boards) {
    panel.appendChild(renderBoardCard(board));
  }

  return panel;
}

// ── Scoring Header ────────────────────────────────────────────────────

function renderScoringHeader(): HTMLElement {
  const header = el('div', 'scoring-header');

  // Quarter bar
  const qBar = el('div', 'quarter-bar');
  const qLabel = el('span', 'quarter-label', [QUARTER_LABELS[gameState.quarter]]);
  const qActions = el('div', 'flex gap-sm');

  if (gameState.quarter > 0) {
    qActions.appendChild(btn('Prev Quarter', 'btn btn-secondary btn-sm', () => {
      gameState.quarter--;
      render();
    }));
  }
  if (gameState.quarter < 3) {
    qActions.appendChild(btn('Next Quarter', 'btn btn-secondary btn-sm', () => {
      gameState.quarter++;
      render();
    }));
  }

  qBar.appendChild(qLabel);
  qBar.appendChild(qActions);
  header.appendChild(qBar);

  // Determine team labels (use first board's teams or fallback)
  const topTeam = boards.length > 0 ? boards[0].config.topTeam : 'Top';
  const leftTeam = boards.length > 0 ? boards[0].config.leftTeam : 'Left';

  // Score inputs
  const scoreRow = el('div', 'score-row');

  const topInput = input('number', { className: 'score-input', value: String(gameState.score.top) });
  topInput.min = '0';
  const leftInput = input('number', { className: 'score-input', value: String(gameState.score.left) });
  leftInput.min = '0';

  const topGroup = el('div', 'score-group', [
    el('label', '', [topTeam]),
    topInput,
  ]);

  const dash = el('span', 'score-dash', ['\u2013']);

  const leftGroup = el('div', 'score-group', [
    leftInput,
    el('label', '', [leftTeam]),
  ]);

  const updateBtn = btn('Update', 'btn btn-primary btn-sm', () => {
    gameState.score.top = parseInt(topInput.value) || 0;
    gameState.score.left = parseInt(leftInput.value) || 0;
    render();
  });

  // Also update on enter key
  const onEnter = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      gameState.score.top = parseInt(topInput.value) || 0;
      gameState.score.left = parseInt(leftInput.value) || 0;
      render();
    }
  };
  topInput.addEventListener('keydown', onEnter);
  leftInput.addEventListener('keydown', onEnter);

  scoreRow.appendChild(topGroup);
  scoreRow.appendChild(dash);
  scoreRow.appendChild(leftGroup);
  scoreRow.appendChild(updateBtn);

  header.appendChild(scoreRow);

  return header;
}

// ── Board Card ────────────────────────────────────────────────────────

function renderBoardCard(board: Board): HTMLElement {
  const card = el('div', 'board-card');

  const configSummary = [
    `${board.config.cols}x${board.config.rows}`,
    board.config.reroll ? 'reroll' : '',
    board.config.buyIn ? `$${board.config.buyIn}` : '',
  ].filter(Boolean).join(' | ');

  card.appendChild(el('h3', '', [board.config.name]));
  card.appendChild(el('div', 'card-meta', [
    `${board.config.topTeam} vs ${board.config.leftTeam} — ${configSummary}`,
  ]));

  if (board.fullBoard) {
    card.appendChild(renderFullBoardGrid(board));
    card.appendChild(renderFullBoardSummary(board));
  } else if (board.mySquares) {
    card.appendChild(renderMySquaresList(board));
  }

  return card;
}

// ── My Squares List ───────────────────────────────────────────────────

function renderMySquaresList(board: Board): HTMLElement {
  const statuses = checkAllMySquares(board, gameState);
  const list = el('ul', 'square-list');

  board.mySquares!.forEach((sq, i) => {
    const status = statuses[i];
    const qi = quarterIndex(board, gameState.quarter);
    const digits = sq.quarters[qi];
    const label = `${board.config.topTeam} ${formatDigits(digits.topDigits)}, ${board.config.leftTeam} ${formatDigits(digits.leftDigits)}`;

    const li = document.createElement('li');

    if (status.isWinner) {
      li.className = 'status-winner';
      let winText = `\u2605 WINNER: ${label}`;
      if (board.config.payouts && board.config.payouts[gameState.quarter] != null) {
        winText += ` — $${board.config.payouts[gameState.quarter]}`;
      }
      li.textContent = winText;
    } else if (status.nearMisses.length > 0) {
      li.className = 'status-near';
      const nearDesc = status.nearMisses
        .map(nm => `${nm.team} +${nm.points}`)
        .join(', ');
      li.textContent = `\u25CB Near: ${label} (${nearDesc})`;
    } else {
      li.className = 'status-dim';
      li.textContent = `\u00B7 ${label}`;
    }

    list.appendChild(li);
  });

  return list;
}

// ── Full Board Grid ───────────────────────────────────────────────────

function renderFullBoardGrid(board: Board): HTMLElement {
  const fb = board.fullBoard!;
  const qi = quarterIndex(board, gameState.quarter);
  const qn = fb.quarters[qi];
  const cellStatuses = getFullBoardCellStatuses(board, gameState);
  const mineSet = new Set(fb.mySquareNames.map(n => n.toLowerCase()));

  const wrapper = el('div', 'grid-table-wrapper');
  const table = el('table', 'grid-table');

  // Header row with top numbers
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const corner = document.createElement('th');
  corner.className = 'corner';
  headerRow.appendChild(corner);

  for (let c = 0; c < board.config.cols; c++) {
    const th = document.createElement('th');
    th.textContent = formatDigits(qn.topNumbers[c]);
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body rows
  const tbody = document.createElement('tbody');
  for (let r = 0; r < board.config.rows; r++) {
    const tr = document.createElement('tr');

    // Left number header
    const rowTh = document.createElement('th');
    rowTh.textContent = formatDigits(qn.leftNumbers[r]);
    tr.appendChild(rowTh);

    for (let c = 0; c < board.config.cols; c++) {
      const td = document.createElement('td');
      const owner = fb.grid[r]?.[c] ?? '';
      td.textContent = owner;
      td.title = owner;

      const key = `${r},${c}`;
      const cs = cellStatuses.get(key);
      const classes: string[] = [];

      if (cs?.isWinner) classes.push('cell-winner');
      else if (cs && cs.nearMisses.length > 0) classes.push('cell-near');
      if (mineSet.has(owner.toLowerCase())) classes.push('cell-mine');

      if (classes.length > 0) td.className = classes.join(' ');
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  wrapper.appendChild(table);

  return wrapper;
}

// ── Full Board Summary ────────────────────────────────────────────────

function renderFullBoardSummary(board: Board): HTMLElement {
  const fb = board.fullBoard!;
  const qi = quarterIndex(board, gameState.quarter);
  const qn = fb.quarters[qi];
  const cellStatuses = getFullBoardCellStatuses(board, gameState);
  const mineSet = new Set(fb.mySquareNames.map(n => n.toLowerCase()));

  const summary = el('div', 'status-summary');

  // Find the winner cell info
  for (const [key, cs] of cellStatuses.entries()) {
    const [r, c] = key.split(',').map(Number);
    const owner = fb.grid[r]?.[c] ?? '???';

    if (cs.isWinner) {
      const isMine = mineSet.has(owner.toLowerCase());
      const winLine = el('div', isMine ? 'status-winner' : '', [
        text(`\u2605 Winner: ${owner} [${formatDigits(qn.topNumbers[c])}, ${formatDigits(qn.leftNumbers[r])}]`),
      ]);
      if (isMine && board.config.payouts && board.config.payouts[gameState.quarter] != null) {
        winLine.appendChild(text(` — $${board.config.payouts[gameState.quarter]}`));
      }
      summary.appendChild(winLine);
    }
  }

  // Near misses that are mine
  const myNears: string[] = [];
  for (const [key, cs] of cellStatuses.entries()) {
    if (cs.nearMisses.length > 0) {
      const [r, c] = key.split(',').map(Number);
      const owner = fb.grid[r]?.[c] ?? '???';
      if (mineSet.has(owner.toLowerCase())) {
        const desc = cs.nearMisses.map(nm => `${nm.team} +${nm.points}`).join(', ');
        myNears.push(`\u25CB ${owner} [${formatDigits(qn.topNumbers[c])}, ${formatDigits(qn.leftNumbers[r])}] (${desc})`);
      }
    }
  }

  if (myNears.length > 0) {
    for (const line of myNears) {
      summary.appendChild(el('div', 'status-near', [line]));
    }
  }

  if (mineSet.size > 0 && myNears.length === 0) {
    // Check if any of mine won
    let anyMineWon = false;
    for (const [, cs] of cellStatuses.entries()) {
      if (cs.isWinner && cs.isMine) anyMineWon = true;
    }
    if (!anyMineWon) {
      summary.appendChild(el('div', 'status-dim text-sm', ['No near-misses for your squares this quarter.']));
    }
  }

  return summary;
}

// ── Initialize ────────────────────────────────────────────────────────

function init(): void {
  render();
}

init();
