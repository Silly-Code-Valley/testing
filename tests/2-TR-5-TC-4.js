import { test, expect } from '@playwright/test';

test.describe('Admin User Management', () => {
  test('should log in and delete a user successfully', async ({ page }) => {
    // Go to the login page
    await page.goto('https://darkviolet-tarsier-894132.hostingersite.com/login.php');

    // --- LOGIN ---
    await page.getByRole('textbox', { name: /Email Address/i }).fill('admin@example.com');
    await page.getByRole('textbox', { name: /Password/i }).fill('password123');
    await page.getByRole('button', { name: /Login Now/i }).click();

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/dashboard/i);

    // --- NAVIGATE TO USERS ---
    await page.getByRole('link', { name: /Users/i }).click();
    await expect(page).toHaveURL(/users/i);

    // --- DELETE A USER ---
    // Click the first action button for a user
    await page.locator('.action-buttons').first().click();

    // Confirm deletion
    await page.getByRole('button', { name: /Delete User/i }).click();
    await page.getByRole('button', { name: /^OK$/i }).click();

    // --- VERIFY USER IS DELETED ---
    // Example: check for success message or absence of user name
    await expect(page.locator('text=User deleted successfully')).toBeVisible({ timeout: 5000 });
  });
});
