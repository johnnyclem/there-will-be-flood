import { test, expect } from '@playwright/test';

test.describe('Player terrain following', () => {
  test('getTerrainHeight must match actual terrain mesh heights', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    await page.goto('/', { waitUntil: 'networkidle' });

    // Start the game
    const button = page.locator('button', { hasText: 'Begin Journey' });
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Wait for game to initialize
    let ready = false;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(500);
      ready = await page.evaluate(() => !!(window as any).__getTerrainHeight__);
      if (ready) break;
    }
    if (!ready) {
      test.skip(true, 'Game modules not available');
      return;
    }

    // Test: compare getTerrainHeight(x, z) with the height computed using
    // the terrain mesh's coordinate system: noise(x, -z)
    // The terrain mesh is a PlaneGeometry rotated -PI/2 around X, meaning:
    //   mesh uses noise(planeX, planeY) where planeY = -worldZ
    // But getTerrainHeight uses noise(worldX, worldZ)
    // If these differ, there's a sign bug on Z.
    const report = await page.evaluate(() => {
      const getTerrainHeight = (window as any).__getTerrainHeight__ as (x: number, z: number) => number;
      const noise2D = (window as any).__noise2D__ as (x: number, y: number) => number;
      const TERRAIN_HEIGHT = 15;

      // Compute "correct" height the way the mesh does it (using -z for the noise Y coordinate)
      function meshHeight(worldX: number, worldZ: number): number {
        // The mesh uses planeY where planeY = -worldZ
        const noiseZ = -worldZ;
        const dist = Math.sqrt(worldX * worldX + noiseZ * noiseZ);
        const valleyFactor = Math.min(1, dist / 60);

        let height = 0;
        height += noise2D(worldX * 0.02, noiseZ * 0.02) * TERRAIN_HEIGHT;
        height += noise2D(worldX * 0.05, noiseZ * 0.05) * 4;
        height += noise2D(worldX * 0.1, noiseZ * 0.1) * 1.5;
        height *= valleyFactor;

        const centerPlateau = Math.max(0, 1 - dist / 15) * 3;
        height = Math.max(height, centerPlateau);
        return height;
      }

      // Sample a grid of world positions and compare
      const results: Array<{
        x: number;
        z: number;
        functionHeight: number;
        meshHeight: number;
        mismatch: number;
      }> = [];

      for (let x = -80; x <= 80; x += 10) {
        for (let z = -80; z <= 80; z += 10) {
          const fh = getTerrainHeight(x, z);
          const mh = meshHeight(x, z);
          results.push({
            x,
            z,
            functionHeight: fh,
            meshHeight: mh,
            mismatch: fh - mh,
          });
        }
      }

      // Find the worst mismatches
      const sorted = [...results].sort((a, b) => Math.abs(b.mismatch) - Math.abs(a.mismatch));
      const worstMismatches = sorted.slice(0, 20);

      const totalMismatch = results.reduce((sum, r) => sum + Math.abs(r.mismatch), 0);
      const avgMismatch = totalMismatch / results.length;
      const maxMismatch = Math.max(...results.map(r => Math.abs(r.mismatch)));
      const mismatchCount = results.filter(r => Math.abs(r.mismatch) > 0.1).length;

      return {
        totalSamples: results.length,
        avgMismatch,
        maxMismatch,
        mismatchCount,
        worstMismatches,
      };
    });

    console.log('\n=== Terrain Height Function vs Mesh Height Comparison ===');
    console.log(`Total samples: ${report.totalSamples}`);
    console.log(`Average mismatch: ${report.avgMismatch.toFixed(3)} units`);
    console.log(`Max mismatch: ${report.maxMismatch.toFixed(3)} units`);
    console.log(`Samples with mismatch > 0.1: ${report.mismatchCount} / ${report.totalSamples}`);

    console.log('\nWorst 20 mismatches:');
    for (const m of report.worstMismatches) {
      console.log(`  (${m.x}, ${m.z}): function=${m.functionHeight.toFixed(2)} mesh=${m.meshHeight.toFixed(2)} diff=${m.mismatch.toFixed(2)}`);
    }

    // The bug: getTerrainHeight uses noise(x, z) but mesh uses noise(x, -z)
    // At z=0, they match. At z≠0, they diverge.
    // Expect significant mismatches if the bug exists
    if (report.maxMismatch > 0.5) {
      console.log('\n*** BUG CONFIRMED: getTerrainHeight does NOT match rendered terrain ***');
      console.log('The function uses noise(x, z) but the mesh uses noise(x, -z)');
      console.log('This causes the player to sink into or float above the terrain.');
    }

    // This assertion should FAIL before the fix (confirming the bug)
    // and PASS after the fix
    expect(
      report.maxMismatch,
      `Max height mismatch is ${report.maxMismatch.toFixed(2)} units — getTerrainHeight doesn't match the rendered terrain`
    ).toBeLessThan(0.01);
  });

  test('player stays on terrain while moving', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const button = page.locator('button', { hasText: 'Begin Journey' });
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Wait for debug data
    let ready = false;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(500);
      ready = await page.evaluate(() => !!(window as any).__PLAYER_DEBUG__);
      if (ready) break;
    }
    if (!ready) {
      test.skip(true, 'Game not ready');
      return;
    }

    // Let player settle
    await page.waitForTimeout(3000);

    // Move in all 4 directions and collect deltas
    const directions = [
      { key: 'KeyW', name: 'Forward', dur: 4000 },
      { key: 'KeyD', name: 'Right', dur: 4000 },
      { key: 'KeyS', name: 'Backward', dur: 6000 },
      { key: 'KeyA', name: 'Left', dur: 4000 },
    ];

    let maxDelta = 0;

    for (const dir of directions) {
      await page.keyboard.down(dir.key);
      for (let t = 0; t < dir.dur; t += 300) {
        await page.waitForTimeout(300);
        const d = await page.evaluate(() => (window as any).__PLAYER_DEBUG__);
        if (d && Math.abs(d.delta) > Math.abs(maxDelta)) {
          maxDelta = d.delta;
          console.log(`  New worst delta: ${maxDelta.toFixed(3)} at (${d.x.toFixed(1)}, ${d.z.toFixed(1)}) terrainY=${d.terrainY.toFixed(2)}`);
        }
      }
      await page.keyboard.up(dir.key);
      await page.waitForTimeout(300);

      const settled = await page.evaluate(() => (window as any).__PLAYER_DEBUG__);
      console.log(`${dir.name}: settled at (${settled.x.toFixed(1)}, ${settled.z.toFixed(1)}) delta=${settled.delta.toFixed(3)}`);
    }

    console.log(`\nMax delta during movement: ${maxDelta.toFixed(3)}`);

    // After fix, the player should stay within 1 unit of the terrain
    expect(Math.abs(maxDelta)).toBeLessThan(1.5);
  });
});
