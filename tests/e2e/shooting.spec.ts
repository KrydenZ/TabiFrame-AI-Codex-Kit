import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://commons.wikimedia.org/**', (route) => route.abort());
  await page.goto('/');
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('tabiframe-ai');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
  });
  await page.reload();
});

test('shot 10 persists and mobile layout has no page overflow', async ({ page }, testInfo) => {
  await expect(page.getByRole('heading', { name: '就按照这份清单拍' })).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(38);
  await expect(page.locator('figure.reference-card')).toHaveCount(5);

  await page.getByRole('checkbox', { name: '10 ★ 仲町下坡' }).check();
  await expect(page.getByTestId('progress-count')).toContainText('1 / 38组完成 · 3 / 67条');
  await expect(page.getByText('已保存到当前浏览器')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('checkbox', { name: '10 ★ 仲町下坡' })).toBeChecked();
  await expect(page.getByTestId('progress-count')).toContainText('1 / 38组完成 · 3 / 67条');

  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    pageWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewportWidth);

  if (testInfo.project.name === 'mobile-chrome-360') {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath('mobile-top.png') });
    await page.getByRole('checkbox', { name: '10 ★ 仲町下坡' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('mobile-shot-10.png') });
    await page.screenshot({ path: testInfo.outputPath('mobile-full-page.png'), fullPage: true });
  }
});
