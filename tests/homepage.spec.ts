import { expect, test } from '@playwright/test';

test.describe('Homepage layout', () => {
  test('shows featured spine, supporting grid, and survival areas without duplicates', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('hero-section')).toBeVisible();
    await expect(page.getByTestId('curated-grid-section')).toBeVisible();
    await expect(page.getByTestId('survival-areas-section')).toBeVisible();

    const heroSlug = await page.getByTestId('hero-section').locator('a[href^="/posts/"]').first().getAttribute('href');
    const gridCards = page.getByTestId('curated-grid-section').locator('a[href^="/posts/"]');

    await expect(gridCards).toHaveCount(6);

    const slugs = await page.locator('[data-testid$="-section"] a[href^="/posts/"]').evaluateAll((links) =>
      links
        .map((link) => (link.getAttribute('href') ?? '').replace(/\/posts\/|\/$/g, ''))
        .filter(Boolean),
    );

    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);

    const normalizedHero = heroSlug?.replace(/\/posts\/|\/$/g, '');
    expect(slugs).not.toContain(normalizedHero);
  });

  test('survival areas menu highlights the five navigation hubs', async ({ page }) => {
    await page.goto('/');

    const survivalCards = page.getByTestId('survival-areas-section').locator('a[href^="/category/"]');
    await expect(survivalCards).toHaveCount(5);

    const labels = await survivalCards.evaluateAll((anchors) => anchors.map((anchor) => anchor.textContent?.trim()).filter(Boolean));
    expect(labels.length).toBe(5);
  });

  test('hides newsletter and version switchers', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="email"], form[action*="newsletter"]')).toHaveCount(0);
    expect(await page.getByText(/version/i).count()).toBe(0);
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
