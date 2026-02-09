import { Page } from '@playwright/test';

/** Board text for a simple 10x10 non-reroll my-squares board */
export const MY_SQUARES_BOARD = `Office Pool $25 10x10
Chiefs vs Eagles
Chiefs 3, Eagles 7
Chiefs 0, Eagles 4`;

/** Board text for a simple 10x10 full board */
export const FULL_BOARD_10x10 = `Work Pool $50 10x10 full
Chiefs (top) vs Eagles (left)
Top Chiefs 0 1 2 3 4 5 6 7 8 9
Left Eagles 0 1 2 3 4 5 6 7 8 9
Alice, Bob, Carol, Dave, Eve, Frank, Grace, Hank, Ivy, Jack
Kate, Leo, Mia, Nick, Olive, Pete, Quinn, Rose, Sam, Tom
Uma, Val, Walt, Xena, Yuri, Zane, Amy, Ben, Cher, Dan
Ella, Finn, Gina, Hugo, Iris, Jake, Kim, Liam, Meg, Nora
Owen, Pam, Reed, Sara, Tina, Ugo, Vera, Will, Xi, Yoko
Zara, Ann, Bill, Chad, Dee, Ed, Fay, Gil, Hal, Ike
Jan, Ken, Lia, Max, Nan, Ora, Pat, Roy, Sue, Ted
Una, Vic, Wes, Xia, Yael, Zoe, Ari, Bea, Cal, Dot
Eli, Flo, Gus, Hap, Ida, Joy, Kip, Lou, Mae, Ned
Obi, Pia, Raj, Sid, Tai, Uri, Van, Wyn, Xan, Yao
Mine Alice, Olive`;

/** Board text for a 5x5 my-squares board */
export const MY_SQUARES_5x5 = `Side Bet $10 5x5
Chiefs vs Eagles
Chiefs 03, Eagles 27`;

/** Board text for two boards separated by --- */
export const TWO_BOARDS = `${MY_SQUARES_BOARD}
---
${MY_SQUARES_5x5}`;

/** Clear localStorage and navigate to the app */
export async function freshPage(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.waitForSelector('.banner');
}

/** Paste board data into the textarea and click Add Boards */
export async function pasteAndAddBoards(page: Page, boardData: string): Promise<void> {
  await page.locator('.setup-section textarea').first().fill(boardData);
  await page.getByRole('button', { name: 'Add Boards' }).click();
}

/** Paste board data into the textarea and click Replace All */
export async function pasteAndReplaceBoards(page: Page, boardData: string): Promise<void> {
  await page.locator('.setup-section textarea').first().fill(boardData);
  await page.getByRole('button', { name: 'Replace All' }).click();
}

/** Set score inputs and click Update */
export async function setScore(page: Page, top: number, left: number): Promise<void> {
  const topInput = page.locator('.score-input').first();
  const leftInput = page.locator('.score-input').last();
  await topInput.fill(String(top));
  await leftInput.fill(String(left));
  await page.getByRole('button', { name: 'Update' }).click();
}

/** Navigate to the scoring tab */
export async function goToScoring(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Scoring' }).click();
}

/** Navigate to the setup tab */
export async function goToSetup(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Setup' }).click();
}
