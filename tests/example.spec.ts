import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle('Login • LCM');
});

test('register page', async ({ page }) => {
  await page.goto('/login.php');

  // Click the get started link.
  await page.getByRole('link', { name: 'Create Account' }).click();

  // Expects page to have a button with the name of Create Account.
  await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
});