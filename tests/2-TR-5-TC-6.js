import { test, expect } from '@playwright/test';

test.describe('Lawyer Dashboard Navigation', () => {
  test('should log in as lawyer and access the Clients page', async ({ page }) => {
    // --- LOGIN ---
    await page.goto('https://darkviolet-tarsier-894132.hostingersite.com/login.php');

    await page.getByRole('textbox', { name: /Email Address/i }).fill('lawyer@example.com');
    await page.getByRole('textbox', { name: /Password/i }).fill('password123');
    await page.getByRole('button', { name: /Login Now/i }).click();

    // Verify successful login
    await expect(page).toHaveURL(/dashboard/i);
    await expect(page.locator('span.badge-role')).toHaveText(/Lawyer/i);

    // --- NAVIGATE TO CLIENTS ---
    await page.getByRole('link', { name: /Clients/i }).click();

    // Verify Clients page loaded
    await expect(page).toHaveURL(/clients/i);
  });
});
