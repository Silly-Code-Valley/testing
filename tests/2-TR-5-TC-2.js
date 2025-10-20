import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Navigation', () => {
  test('should log in as admin and navigate to Clients page', async ({ page }) => {
    // Go to login page
    await page.goto('https://darkviolet-tarsier-894132.hostingersite.com/login.php');

    // Fill in login form
    await page.getByRole('textbox', { name: /Email Address/i }).fill('admin@example.com');
    await page.getByRole('textbox', { name: /Password/i }).fill('password123');

    // Submit the form
    await page.getByRole('button', { name: /Login Now/i }).click();

    // Verify successful login
    await expect(page).toHaveURL(/dashboard/i);

    // Navigate to Dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();

    // Navigate to Clients page
    await page.getByRole('link', { name: /Clients/i }).click();

    // Verify Clients page loaded
    await expect(page).toHaveURL(/clients/i);
  });
});
