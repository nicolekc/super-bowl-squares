# Board Image Processing Prompt

Use this prompt with an AI vision model (e.g., Claude) alongside a photo or screenshot of a Super Bowl squares board. Paste the prompt below, attach the image, and you'll get output you can directly paste into the Super Bowl Squares Tracker (terminal or web).

---

## The Prompt

```
Look at this Super Bowl squares board image and produce output in the exact text format described below. Be precise — every digit matters.

STEP 1: Read the board and identify:
- Which team is across the TOP (columns)
- Which team is down the LEFT side (rows)
- The digits assigned to each column (top team's numbers, left to right)
- The digits assigned to each row (left team's numbers, top to bottom)
- The name/initials in every cell of the grid (row by row, left to right)

STEP 2: Determine the board size:
- Count the columns and rows
- 10 columns × 10 rows = 10x10 (each position has 1 digit, 0-9)
- 5 columns × 5 rows = 5x5 (each position has 2 digits, covering 0-9 across 5 slots)
- 5 columns × 10 rows = 5x10 (top team has 2-digit slots, left team has 1-digit slots)
- 10 columns × 5 rows = 10x5 (top team has 1-digit slots, left team has 2-digit slots)

STEP 3: Output the board in this exact format:

<Board Name> $<BuyIn> <Cols>x<Rows> full
<TopTeam> (top) vs <LeftTeam> (left)
Top <TopTeam> <numbers>
Left <LeftTeam> <numbers>
<grid row 1>
<grid row 2>
...
Mine <your names if I tell you>

FORMAT RULES:

HEADER LINE:
  <name> $<amount> <cols>x<rows> full
  - Name: whatever the board is called (e.g., "Office Pool", "Family Board")
  - $amount: buy-in if visible, otherwise omit
  - Size: 5x5, 5x10, 10x5, or 10x10
  - "full" keyword is required for full boards

TEAMS LINE:
  <TopTeam> (top) vs <LeftTeam> (left)
  - Use the team names exactly as shown on the board
  - (top) and (left) annotations are required for full boards

NUMBER LINES:
  Top <TeamName> <digit_groups separated by spaces>
  Left <TeamName> <digit_groups separated by spaces>

  Digit group format depends on axis size:
  - For a 10-position axis: single digits, e.g., "0 1 2 3 4 5 6 7 8 9"
  - For a 5-position axis: two-digit pairs, e.g., "03 19 28 46 57"

  For a 5-position axis, each two-digit pair represents BOTH digits
  that map to that column/row. For example, "03" means both 0 AND 3.
  Together the 5 pairs must cover all 10 digits (0-9) exactly once.

  IMPORTANT: Read the digits left-to-right for columns (top) and
  top-to-bottom for rows (left), matching the visual order on the board.

GRID ROWS:
  One line per row, names separated by commas.
  Read left to right, top to bottom.
  Use exactly the name/initials shown in each cell.
  Every row must have exactly <cols> names.

MINE LINE (optional):
  Mine <name1>, <name2>, ...
  Only include if I tell you which squares are mine.

EXAMPLE — 5x5 board:

Family Pool $10 5x5 full
Seahawks (top) vs Patriots (left)
Top Seahawks 03 19 28 46 57
Left Patriots 65 12 39 47 80
Alice, Bob, Carol, Dan, Eve
Frank, Grace, Henry, Ivy, Jack
Kate, Leo, Mia, Noah, Olive
Pete, Quinn, Rose, Sam, Tina
Uma, Vic, Wendy, Xander, Yara
Mine Alice, Mia, Yara

EXAMPLE — 10x10 board:

Work Pool $25 10x10 full
Chiefs (top) vs Eagles (left)
Top Chiefs 0 1 2 3 4 5 6 7 8 9
Left Eagles 0 1 2 3 4 5 6 7 8 9
AA, AB, AC, AD, AE, AF, AG, AH, AI, AJ
BA, BB, BC, BD, BE, BF, BG, BH, BI, BJ
CA, CB, CC, CD, CE, CF, CG, CH, CI, CJ
DA, DB, DC, DD, DE, DF, DG, DH, DI, DJ
EA, EB, EC, ED, EE, EF, EG, EH, EI, EJ
FA, FB, FC, FD, FE, FF, FG, FH, FI, FJ
GA, GB, GC, GD, GE, GF, GG, GH, GI, GJ
HA, HB, HC, HD, HE, HF, HG, HH, HI, HJ
IA, IB, IC, ID, IE, IF, IG, IH, II, IJ
JA, JB, JC, JD, JE, JF, JG, JH, JI, JJ

REROLL BOARDS:
If the board has MULTIPLE sets of numbers (one per quarter), add "reroll"
to the header and use this format for the number lines instead:

<Board Name> $<BuyIn> <Cols>x<Rows> reroll full
<TopTeam> (top) vs <LeftTeam> (left)
Q1 Top <numbers>, Left <numbers>
Q2 Top <numbers>, Left <numbers>
Q3 Top <numbers>, Left <numbers>
Q4 Top <numbers>, Left <numbers>
<grid rows>
Mine <names>

If only one set of numbers is visible, it's NOT a reroll board.

IMPORTANT NOTES:
- Double-check every digit. A single wrong digit means wrong results.
- If a cell is empty or illegible, use "?" as the name.
- If digits are hard to read, state your uncertainty.
- Preserve the exact order: columns left-to-right, rows top-to-bottom.
- Do NOT reorder digits numerically — use the physical board order.
```

---

## Usage

1. Copy the prompt above (everything inside the code fence)
2. Open Claude (or another vision-capable AI)
3. Paste the prompt
4. Attach your board image
5. Optionally add: "My squares are: Alice, Mia, Yara" (or whatever your names are)
6. Copy the output into the Super Bowl Squares Tracker (paste into the terminal CLI or web UI)

## Tips

- **Blurry images**: Crop and zoom into the numbers before sending if they're hard to read
- **Multiple boards**: Process one image at a time, then combine the outputs separated by `---`
- **Verify**: Always spot-check a few cells against the image before using the output
