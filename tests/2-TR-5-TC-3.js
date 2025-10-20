import { test, expect } from '@playwright/test';

test.describe('Admin User Editing', () => {
  test('should log in and update user information successfully', async ({ page }) => {
    // --- LOGIN ---
    await page.goto('https://darkviolet-tarsier-894132.hostingersite.com/login.php');
    await page.getByRole('textbox', { name: /Email Address/i }).fill('admin@example.com');
    await page.getByRole('textbox', { name: /Password/i }).fill('password123');
    await page.getByRole('button', { name: /Login Now/i }).click();

    // Verify successful login
    await expect(page).toHaveURL(/dashboard/i);

    // --- NAVIGATE TO USERS PAGE ---
    await page.getByRole('link', { name: /Users/i }).click();
    await expect(page).toHaveURL(/users/i);

    // --- EDIT SPECIFIC USER ---
    // Click the 3rd edit button (index 2)
    await page.getByRole('button', { name: // }).nth(2).click();

    // Update form fields
    await page.locator('input[name="last_name"]').fill('Cheessezeronio');
    await page.locator('input[name="first_name"]').fill('Eddie_cheesecake');
    await page.getByRole('combobox').selectOption('partner');

    // Save changes
    await page.getByRole('button', { name: /Save Changes/i }).click();

    // --- VERIFY SUCCESS ---
    // Optional: update this to match your real success message
    await expect(page.locator('text=User updated successfully')).toBeVisible({ timeout: 5000 });
  });
});
