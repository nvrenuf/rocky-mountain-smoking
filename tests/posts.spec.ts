import { expect, test } from '@playwright/test';

test('Survival Library excludes homepage posts and stays within 12 per page', async ({ page }) => {
  await page.goto('/');

  const excluded = await page
    .locator('[data-testid$="-section"] a[href^="/posts/"]')
    .evaluateAll((links) => links.map((link) => (link.getAttribute('href') ?? '').replace(/\/posts\/|\/$/g, '')));

  await page.goto('/posts/');
  await expect(page).toHaveTitle(/Survival Library/);

  const articles = page.locator('[data-testid="blog-list"] article a[href^="/posts/"]');
  const librarySlugs = await articles.evaluateAll((links) => links.map((link) => (link.getAttribute('href') ?? '').replace(/\/posts\/|\/$/g, '')));

  excluded.forEach((slug) => expect(librarySlugs).not.toContain(slug));
  expect(librarySlugs.length).toBeLessThanOrEqual(12);

  const totalPagesAttr = await page.getByTestId('blog-list').getAttribute('data-total-pages');
  const totalPages = Number(totalPagesAttr ?? '1');
  if (totalPages > 1) {
    await expect(page.getByTestId('pagination')).toBeVisible();
  } else {
    await expect(page.getByTestId('pagination')).toHaveCount(0);
  }
});

test('individual post pages render without signup forms', async ({ page }) => {
  await page.goto('/posts/');
  const firstPostLink = page.locator('[data-testid="blog-list"] article a[href^="/posts/"]').first();
  const href = await firstPostLink.getAttribute('href');
  expect(href).not.toBeNull();

  await page.goto(href!);
  await expect(page.locator('article')).toBeVisible();
  await expect(page.locator('input[type="email"], form[action*="newsletter"]')).toHaveCount(0);
});
