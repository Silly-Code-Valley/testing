import { test, expect } from '@playwright/test';
import crypto from 'crypto';

// Localize environment variables
const TEST_USER_NAME = process.env.TEST_USER_NAME;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const TEST_LAWYER_EMAIL = process.env.TEST_LAWYER_EMAIL;
const TEST_LAWYER_PASSWORD = process.env.TEST_LAWYER_PASSWORD;
const TEST_CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL;
const TEST_CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD;

// Check if required environment variables are set
if (!TEST_USER_NAME || !TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error('Missing required environment variables: TEST_USER_NAME, TEST_USER_EMAIL, TEST_USER_PASSWORD');
}

if (!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) {
  throw new Error('Missing required environment variables: TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD');
}

if (!TEST_LAWYER_EMAIL || !TEST_LAWYER_PASSWORD) {
  throw new Error('Missing required environment variables: TEST_LAWYER_EMAIL, TEST_LAWYER_PASSWORD');
}

if (!TEST_CLIENT_EMAIL || !TEST_CLIENT_PASSWORD) {
  throw new Error('Missing required environment variables: TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD');
}

// Setup test - ensure test user exists for duplicate tests
test.beforeAll('setup: create test user if not exists', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('/register.php');

    // Try to create the test user
    await page.fill('input[name="first_name"]', TEST_USER_NAME);
    await page.fill('input[name="last_name"]', TEST_USER_NAME);
    await page.fill('input[name="email"]', TEST_USER_EMAIL);
    await page.fill('input[name="password"]', TEST_USER_PASSWORD);

    await page.getByRole('button', { name: 'Create Account' }).click();

    // Don't fail if user already exists - that's what we want
    console.log('Test user setup completed (may already exist)');
  } catch (error) {
    console.log('Test user setup: user might already exist');
  } finally {
    await context.close();
  }
});

function generateUniqueUser() {
    const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    return {
        first_name: `${uniqueId}`,
        last_name: `TestUser`,
        email: `test+${uniqueId}@example.com`,
        password: 'Password123!'
    };
}

test.describe("User Registration", () => {

    test('users can register with unique email', async ({ page }) => {
        await page.goto('/register.php');

        const user = generateUniqueUser();

        // Fill in registration form with unique email
        await page.fill('input[name="first_name"]', user.first_name);
        await page.fill('input[name="last_name"]', user.last_name);
        await page.fill('input[name="email"]', user.email);
        await page.fill('input[name="password"]', user.password);
		await page.fill('input[name="confirm_password"]', user.password);
        await page.getByRole('button', { name: 'Create Account' }).click();

        await expect(page).toHaveURL(/login/);
    });

    test('users cannot register with duplicate email', async ({ page }) => {
        await page.goto('/register.php');

        const user = generateUniqueUser();

        await page.fill('input[name="first_name"]', user.first_name);
        await page.fill('input[name="last_name"]', user.last_name);
        await page.fill('input[name="email"]', TEST_USER_EMAIL);
        await page.fill('input[name="password"]', user.password);
		await page.fill('input[name="confirm_password"]', user.password);
        await page.getByRole('button', { name: 'Create Account' }).click();

        await expect(page.locator('.alert-danger')).toBeVisible();
    });
})

test.describe("User Login", () => {

    test('users can login with correct email and password', async ({ page }) => {
        await page.goto('/login.php');

        await page.fill('input[name="email"]', TEST_USER_EMAIL!);
        await page.fill('input[name="password"]', TEST_USER_PASSWORD!);
        await page.getByRole('button', { name: 'Login' }).click();

        await expect(page).toHaveURL(/dashboard/);
    });

    test('users cannot login with incorrect email or password', async ({ page }) => {
        await page.goto('/login.php');

        await page.fill('input[name="email"]', TEST_USER_EMAIL!);
        await page.fill('input[name="password"]', 'wrongpassword123');
        await page.getByRole('button', { name: 'Login' }).click();

        await expect(page.locator('.alert-danger')).toBeVisible();
        await expect(page).toHaveURL(/login/);
    });
})

test.describe("Role Based Access Control", () => {

    test.describe("Admin Role", () => {
        test.use({ storageState: 'playwright/.auth/admin.json' });

        test('admin users can access admin features', async ({ page }) => {
            await page.goto('/login.php');

            await expect(page).toHaveURL(/dashboard/);
            await expect(page.locator('span.badge-role')).toHaveText(/Admin/i);
        });
    });

    test.describe("Lawyer Role", () => {
        test.use({ storageState: 'playwright/.auth/lawyer.json' });

        test('lawyers can access lawyer features', async ({ page }) => {
            await page.goto('/login.php');

            await expect(page).toHaveURL(/dashboard/);
            await expect(page.locator('span.badge-role')).toHaveText(/Lawyer/i);
        });
    });

    test.describe("Client Role", () => {
        test.use({ storageState: 'playwright/.auth/client.json' });

        test('clients can access client features', async ({ page }) => {
            await page.goto('/login.php');

            await expect(page).toHaveURL(/dashboard/);
            await expect(page.locator('span.badge-role')).toHaveText(/Client/i);
        });
    });
});
