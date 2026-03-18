import { test, expect } from '@playwright/test';

test.describe('Tutorial system', () => {
  test('tutorial appears and guides the player through game mechanics', async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Start the game
    const startBtn = page.locator('button', { hasText: 'Begin Journey' });
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();

    // Wait for canvas (game loaded)
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Step 1: Welcome message should appear after ~2 seconds
    const tutorialBox = page.locator('text=A Divine Voicemail');
    await expect(tutorialBox).toBeVisible({ timeout: 10000 });

    // Verify the tutorial has the speaker badge
    await expect(page.locator('text=THE ALMIGHTY')).toBeVisible();

    // Verify the welcome message content
    await expect(
      page.locator("text=Noah! It's Me. God. Yes, THE God.")
    ).toBeVisible();

    // Verify the hint is shown
    await expect(page.locator('text=Use WASD to move')).toBeVisible();

    // Verify "Got it!" button and "Skip Tutorial" are present
    const gotItBtn = page.locator('button', { hasText: 'Got it!' });
    await expect(gotItBtn).toBeVisible();
    await expect(
      page.locator('button', { hasText: 'Skip Tutorial' })
    ).toBeVisible();

    // Verify progress dots (5 total)
    // Take a screenshot of the first tutorial step
    await page.screenshot({ path: 'tests/tutorial-step1-welcome.png' });

    // Dismiss the welcome message
    await gotItBtn.click();

    // Tutorial should fade out
    await expect(tutorialBox).not.toBeVisible({ timeout: 2000 });

    // Step 2: Move the player to trigger "Holy Lumberjacking"
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(2000);
    await page.keyboard.up('KeyW');

    // The resources tutorial should appear after moving >5 units
    const resourcesTitle = page.locator('text=Holy Lumberjacking');
    await expect(resourcesTitle).toBeVisible({ timeout: 10000 });

    // Verify resource tutorial mentions key mechanics
    await expect(page.locator('text=press E to gather')).toBeVisible();
    await expect(page.locator('.tut-scroll', { hasText: 'Gopher Wood' })).toBeVisible();

    await page.screenshot({ path: 'tests/tutorial-step2-resources.png' });

    // Dismiss
    await page.locator('button', { hasText: 'Got it!' }).click();
    await expect(resourcesTitle).not.toBeVisible({ timeout: 2000 });

    console.log('Tutorial steps 1-2 verified successfully!');
  });

  test('skip tutorial button dismisses all messages', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const startBtn = page.locator('button', { hasText: 'Begin Journey' });
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();

    await page.waitForSelector('canvas', { timeout: 10000 });

    // Wait for welcome message
    await expect(
      page.locator('text=A Divine Voicemail')
    ).toBeVisible({ timeout: 10000 });

    // Click "Skip Tutorial"
    await page.locator('button', { hasText: 'Skip Tutorial' }).click();

    // Tutorial should disappear and not come back
    await expect(
      page.locator('text=A Divine Voicemail')
    ).not.toBeVisible({ timeout: 2000 });

    // Move around — no tutorial should appear
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(3000);
    await page.keyboard.up('KeyW');

    // Verify no tutorial is visible
    await expect(
      page.locator('text=Holy Lumberjacking')
    ).not.toBeVisible({ timeout: 3000 });

    await page.screenshot({ path: 'tests/tutorial-skipped.png' });
    console.log('Skip tutorial verified!');
  });
});
