import { expect, test } from '@playwright/test';

test.describe('Homepage layout', () => {
  test('shows hero, recipe and technique entry points, and newsletter', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('High-altitude BBQ');
    await expect(page.getByRole('link', { name: 'Browse recipes' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Learn techniques' })).toBeVisible();

    const recipeLinks = page.locator('a[href^="/recipes/"]');
    expect(await recipeLinks.count()).toBeGreaterThan(2);

    const techniqueLinks = page.locator('a[href^="/techniques/"]');
    expect(await techniqueLinks.count()).toBeGreaterThan(1);

    await expect(page.getByRole('heading', { name: 'Beef, pork, chicken' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('mobile layout stays stacked without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);

    expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 2);

    await page.getByTestId('mobile-menu-toggle').click();
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
  });
});
