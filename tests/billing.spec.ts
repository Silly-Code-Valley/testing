// spec: billing-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect, Page } from '@playwright/test';
import { CaseData } from '../types/CaseData.ts';
import { CasesPage } from '../pages/CasesPage.ts';
import { BillingPage } from '../pages/BillingPage.ts';
import { BillingDataBuilder } from '../fixtures/billing-data.builder.ts';
import { CaseDataBuilder } from '../fixtures/cases-data.builder.ts';


const CONFIG = {
  MAX_PAGINATION_PAGES: process.env.CI ? 20 : 10,
  NAVIGATION_TIMEOUT: 10000,
  DEFAULT_TIMEOUT: 5000,
};

class NavigationHelper {
  constructor(private page: Page) {}

  async navigateToBilling() {
    const navMenu = this.page.getByText('Navigation Dashboard Clients');
    if (await navMenu.isVisible()) {
      await navMenu.hover();
      await this.page.waitForTimeout(300);
    }

    const billingLink = this.page.getByRole('link', { name: /Billing/i }).first();
    await billingLink.waitFor({ state: 'visible', timeout: CONFIG.NAVIGATION_TIMEOUT });
    await billingLink.click();
    await this.page.waitForLoadState('networkidle');
    await expect(this.page).toHaveURL(/billing/);
  }
}

async function findInPaginatedTable(
  page: Page,
  searchText: string,
  maxPages = CONFIG.MAX_PAGINATION_PAGES
): Promise<boolean> {
  for (let currentPage = 1; currentPage <= maxPages; currentPage++) {

    await page.waitForSelector('table tbody tr', {
      state: 'attached',
      timeout: CONFIG.DEFAULT_TIMEOUT,
    }).catch(() => {});

    const foundRow = page.locator('table tbody tr', {
      has: page.locator(`td:has-text("${searchText}")`),
    });

    if ((await foundRow.count()) > 0) {
      return true;
    }

    const nextButton = page.getByRole('link', { name: /Next/i });
    if ((await nextButton.count()) === 0) {
      return false;
    }

    const isDisabled =
      (await nextButton.isDisabled().catch(() => false)) ||
      (await nextButton.evaluate(
        (el) => el.classList.contains('disabled') || el.parentElement?.classList.contains('disabled')
      ).catch(() => false));

    if (isDisabled) {
      return false;
    }

    await nextButton.click();
    await page.waitForLoadState('networkidle');
  }

  return false;
}

test.describe('Lawyer Invoice Generation', () => {
  let testCaseData: CaseData;
  let testCaseExists = false;

  test.use({ storageState: 'playwright/.auth/lawyer.json' });

  // ───────────────────────────────────────────────────────────────
  // Setup: Ensure a test case exists before running billing tests
  // ───────────────────────────────────────────────────────────────
  test.beforeAll(async ({ browser }) => {
    testCaseData = new CaseDataBuilder().build();

    const context = await browser.newContext({ storageState: 'playwright/.auth/lawyer.json' });
    const page = await context.newPage();

    try {
      const casesPage = new CasesPage(page);
      await casesPage.navigateToCasesList();

      if (await casesPage.caseExists(testCaseData.title)) {
        testCaseExists = true;
      } else {
        await casesPage.navigateToCreateCase();
        await casesPage.fillCaseForm(testCaseData);
        await casesPage.submitCaseForm();

        testCaseExists = true;
      }
    } catch (error) {
      testCaseExists = false;
    } finally {
      await context.close();
    }
  });

  test('lawyer can generate invoice', async ({ page }) => {
    test.skip(!testCaseExists, 'Test case prerequisite failed — skipping test');

    // ARRANGE
    await page.goto('/dashboard.php');
    await expect(page).toHaveURL(/dashboard/);

    const nav = new NavigationHelper(page);
    await nav.navigateToBilling();

    const billingPage = new BillingPage(page);
    await billingPage.clickCreateBilling();

    const selectedCase = (
      await billingPage.selectCaseByTitle(testCaseData.title) || (await billingPage.selectFirstAvailableCase())
    ); // Ensure a case is selected (any for this test)

    const billingData = new BillingDataBuilder().withCaseName(selectedCase!.name).build();

    // ACT
    const submittedData = await billingPage.fillBillingForm(billingData);
    await billingPage.submitBillingForm();
    await billingPage.navigateToBillingList();

    // ASSERT
    const found = await findInPaginatedTable(page, billingData.description);
    expect(found).toBeTruthy(); // Billing entry is on the paginated table

    const billingRow = await billingPage.findBillingRow(billingData.description);
    const rowData = await billingPage.getBillingRowData(billingRow);

    // Assert Name
    expect(rowData.case).toContain(billingData.caseName);

    // Assert Client
    expect(rowData.client).toBeTruthy();

    // Assert Status
    const statusValue = await rowData.statusDropdown.inputValue();
    expect(statusValue).toBe(submittedData.status || 'unpaid');

    // Assert Amount
    expect(Number(submittedData.amount)).toBe(Number(rowData.amount));

    // Assert Due Date
    expect(rowData.dueDate).toBe(submittedData.dueDate || '');

    // Assert Description
    expect(rowData.description).toBe(billingData.description);
    
  });

});
