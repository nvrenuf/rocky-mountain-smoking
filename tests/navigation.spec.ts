import { expect, test } from '@playwright/test';
import { TOPIC_CATEGORIES } from '../src/data/categories';

test('desktop navigation links to the Survival Library and shows Survival Areas dropdown', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Drops' })).toHaveCount(0);

  const navbar = page.getByTestId('navbar');
  await expect(navbar).toBeVisible();
  await expect(page.getByTestId('nav-home')).toHaveClass(/text-neutral-95/);

  await page.getByRole('link', { name: 'Survival Library' }).click();
  await expect(page).toHaveURL(/\/posts\/$/);

  await page.goto('/');
  const dropdownTrigger = page.getByRole('button', { name: 'Survival Areas' });
  await dropdownTrigger.click();

  const categoryLabels = TOPIC_CATEGORIES.map((category) => category.label);
  for (const label of categoryLabels) {
    await expect(page.getByTestId('survival-areas-desktop').getByRole('link', { name: label })).toBeVisible();
  }
});

test('mobile navigation toggles Survival Library and Survival Areas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByTestId('mobile-menu-toggle').click();
  await expect(page.getByRole('link', { name: 'Survival Library' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Drops' })).toHaveCount(0);

  const mobileDropdown = page.getByTestId('survival-areas-mobile').getByRole('button', { name: 'Survival Areas' });
  await mobileDropdown.press('Enter');

  const firstCategory = TOPIC_CATEGORIES[0];
  await page.getByTestId(`survival-area-${firstCategory.key}-mobile`).click();

  await expect(page).toHaveURL(new RegExp(`/category/${firstCategory.key}/`));
  await expect(page.getByRole('heading', { level: 1 })).toContainText(firstCategory.label);
});
