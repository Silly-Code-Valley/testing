import { test as setup, expect } from '@playwright/test';

const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const TEST_LAWYER_EMAIL = process.env.TEST_LAWYER_EMAIL;
const TEST_LAWYER_PASSWORD = process.env.TEST_LAWYER_PASSWORD;
const TEST_CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL;
const TEST_CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD;

const adminFile = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login.php');

  await page.fill('input[name="email"]', TEST_ADMIN_EMAIL!);
  await page.fill('input[name="password"]', TEST_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Login Now' }).click();

  await page.context().storageState({ path: adminFile });
});

const clientFile = 'playwright/.auth/client.json';

setup('authenticate as client', async ({ page }) => {
  await page.goto('/login.php');

  await page.fill('input[name="email"]', TEST_CLIENT_EMAIL!);
  await page.fill('input[name="password"]', TEST_CLIENT_PASSWORD!);
  await page.getByRole('button', { name: 'Login Now' }).click();

  await page.context().storageState({ path: clientFile });
});

const lawyerFile = 'playwright/.auth/lawyer.json';

setup('authenticate as lawyer', async ({ page }) => {
  await page.goto('/login.php');

  await page.fill('input[name="email"]', TEST_LAWYER_EMAIL!);
  await page.fill('input[name="password"]', TEST_LAWYER_PASSWORD!);
  await page.getByRole('button', { name: 'Login Now' }).click();

  await page.context().storageState({ path: lawyerFile });
});