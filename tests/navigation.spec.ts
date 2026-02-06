import { expect, test } from '@playwright/test';

test('desktop navigation links to Recipes and Techniques', async ({ page }) => {
  await page.goto('/');

  const navbar = page.getByTestId('navbar');
  await expect(navbar).toBeVisible();

  await page.getByTestId('nav-recipes').click();
  await expect(page).toHaveURL(/\/recipes\/?$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Recipes');

  await page.getByTestId('nav-techniques').click();
  await expect(page).toHaveURL(/\/techniques\/?$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Techniques');
});

test('mobile navigation toggles and shows key links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByTestId('mobile-menu-toggle').click();
  await expect(page.getByTestId('mobile-menu')).toBeVisible();

  await expect(page.getByTestId('nav-recipes-mobile')).toBeVisible();
  await expect(page.getByTestId('nav-techniques-mobile')).toBeVisible();
  await expect(page.getByTestId('nav-about-mobile')).toBeVisible();
});
