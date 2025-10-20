import { test, expect } from '@playwright/test';

test.describe('Admin Client Management', () => {
  test('should log in as admin and add a new client', async ({ page }) => {
    // Go to the login page
    await page.goto('https://darkviolet-tarsier-894132.hostingersite.com/login.php');

    // Login as admin
    await page.getByRole('textbox', { name: /Email Address/i }).fill('admin@example.com');
    await page.getByRole('textbox', { name: /Password/i }).fill('password123');
    await page.getByRole('button', { name: /Login Now/i }).click();

    // Expect to reach dashboard
    await expect(page).toHaveURL(/dashboard/i);

    // Navigate to Clients -> Add Client
    await page.getByRole('link', { name: /Clients/i }).click();
    await page.getByRole('link', { name: /Add Client/i }).click();

    // Fill out client details
    await page.getByLabel('Client Name').selectOption('225');
    await page.getByLabel('Assign to Lawyer').selectOption('2');
    await page.getByRole('textbox', { name: /Phone Number/i }).fill('09761144420');
    await page.getByRole('textbox', { name: /Address/i }).fill('Somewhere inside the Calipso');

    // Save client
    await page.getByRole('button', { name: /Save Client/i }).click();

    // Verify success
    await expect(page.locator('text=Client added successfully')).toBeVisible({ timeout: 5000 });
  });
});
