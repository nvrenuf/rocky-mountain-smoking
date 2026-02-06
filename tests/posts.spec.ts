import { expect, test } from '@playwright/test';

test('recipes index lists sample recipes and categories', async ({ page }) => {
  await page.goto('/recipes/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Altitude-tested BBQ');
  await expect(page.getByRole('link', { name: /High-Altitude Brisket/i })).toBeVisible();

  const categoryLinks = page.locator('a[href^="/recipes/category/"]');
  expect(await categoryLinks.count()).toBe(3);
});

test('recipe detail page shows temps and altitude notes', async ({ page }) => {
  await page.goto('/recipes/high-altitude-brisket/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('High-Altitude Brisket');
  await expect(page.getByText(/Pit temp:/i)).toBeVisible();
  await expect(page.getByText(/Altitude Notes/i)).toBeVisible();
});

test('techniques index lists sample techniques', async ({ page }) => {
  await page.goto('/techniques/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Reliable smoke');
  await expect(page.getByRole('link', { name: /Clean Smoke Fire Management/i })).toBeVisible();
});

