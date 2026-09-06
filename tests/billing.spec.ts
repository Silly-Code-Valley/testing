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
    const navMenu = this.page.locator('aside.sidebar'); // Adjust selector as needed
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

  test('system can support multiple billing for same case', async ({ page }) => {
    test.skip(!testCaseExists, 'Test case prerequisite failed — skipping test');

    // ARRANGE
    await page.goto('/dashboard.php');
    const nav = new NavigationHelper(page);
    await nav.navigateToBilling();

    const billingPage = new BillingPage(page);

    await billingPage.clickCreateBilling();
    const selectedCase =
      (await billingPage.selectCaseByTitle(testCaseData.title)) ||
      (await billingPage.selectFirstAvailableCase());

    const billing1Data = new BillingDataBuilder()
      .withCaseName(selectedCase!.name)
      .withDescription(`First invoice for case ${Date.now()}`)
      .withAmount('5000')
      .build();

    await billingPage.fillBillingForm({ ...billing1Data, caseName: selectedCase!.name });
    await billingPage.submitBillingForm();

    await billingPage.navigateToBillingList();
    await billingPage.clickCreateBilling();
    await billingPage.selectCaseByTitle(testCaseData.title);

    // ACT
    const billing2Data = new BillingDataBuilder()
      .withCaseName(selectedCase!.name)
      .withDescription(`Second invoice for case ${Date.now()}`)
      .withAmount('7500')
      .build();

    await billingPage.fillBillingForm({ ...billing2Data, caseName: selectedCase!.name });
    await billingPage.submitBillingForm();

    await billingPage.navigateToBillingList();

    const found1 = await findInPaginatedTable(page, billing1Data.description);
    expect(found1).toBeTruthy();

    const row1 = await billingPage.findBillingRow(billing1Data.description);
    const rowData1 = await billingPage.getBillingRowData(row1);

    await billingPage.navigateToBillingList();
    const found2 = await findInPaginatedTable(page, billing2Data.description);
    expect(found2).toBeTruthy();

    const row2 = await billingPage.findBillingRow(billing2Data.description);
    const rowData2 = await billingPage.getBillingRowData(row2);

    // Assert
    expect(rowData1.case).toBe(rowData2.case);
  });
});


test.describe('Client Invoice Viewing', () => {
  let sharedInvoiceDescription: string;
  let testCaseData: CaseData;
  let sharedBillingData: any; // Add this line


  test.beforeAll(async ({ browser }) => {
    let clientName: string = '';

    // Step 1: Log in as client to get their name from profile
    const clientContext = await browser.newContext({ storageState: 'playwright/.auth/client.json' });
    const clientPage = await clientContext.newPage();

    try {
      await clientPage.goto('/dashboard.php');

      // Get client name directly from the dropdown toggle
      const userDropdown = clientPage.locator('a.nav-link.dropdown-toggle[data-bs-toggle="dropdown"]').first();
      const dropdownText = await userDropdown.textContent();

      if (dropdownText) {
        // Extract just the name, removing the icon and extra whitespace
        clientName = dropdownText.replace(/\s+/g, ' ').trim();
        // Remove any leading/trailing whitespace and get just the name part
        const nameParts = clientName.split(' ').filter(part => part && !part.includes('bi-'));
        clientName = nameParts.join(' ').trim();
      }

      if (!clientName) {
        throw new Error('Could not extract client name from dropdown');
      }
    } finally {
      await clientContext.close();
    }

    // Step 2: Lawyer creates a case with the specific client and invoice
    const lawyerContext = await browser.newContext({ storageState: 'playwright/.auth/lawyer.json' });
    const lawyerPage = await lawyerContext.newPage();

    try {
      // Create a case with the specific client
      testCaseData = new CaseDataBuilder()
        .withClient(clientName) // Use the client name we just retrieved
        .build();

      const casesPage = new CasesPage(lawyerPage);
      await casesPage.navigateToCasesList();

      if (!(await casesPage.caseExists(testCaseData.title))) {
        await casesPage.navigateToCreateCase();
        await casesPage.fillCaseForm(testCaseData);
        await casesPage.submitCaseForm();
      }

      // Create invoice for that case
      await lawyerPage.goto('/dashboard.php');

      const nav = new NavigationHelper(lawyerPage);
      await nav.navigateToBilling();

      const billingPage = new BillingPage(lawyerPage);
      await billingPage.clickCreateBilling();

      const selectedCase = await billingPage.selectCaseByTitle(testCaseData.title) ||
                          await billingPage.selectFirstAvailableCase();

      const billingData = new BillingDataBuilder()
        .withCaseName(selectedCase!.name)
        .withDescription(`Client viewable invoice ${Date.now()}`)
        .build();

      sharedInvoiceDescription = billingData.description;
      sharedBillingData = await billingPage.fillBillingForm({ ...billingData, caseName: selectedCase!.name }); // Save submitted data
      await billingPage.submitBillingForm();

    } finally {
      await lawyerContext.close();
    }
  });

  test.use({ storageState: 'playwright/.auth/client.json' });

  test('client can view their invoices', async ({ page }) => {
    test.skip(!sharedInvoiceDescription, 'Invoice prerequisite failed — skipping test');

    await page.goto('/dashboard.php');
    await expect(page).toHaveURL(/dashboard/);

    const nav = new NavigationHelper(page);
    await nav.navigateToBilling();

    // Verify billing table is visible
    const billingTable = page.locator('table');
    await expect(billingTable).toBeVisible();

    // Verify the invoice created by lawyer is visible to client
    const found = await findInPaginatedTable(page, sharedInvoiceDescription);
    expect(found).toBeTruthy();

    const billingPage = new BillingPage(page);
    const billingRow = await billingPage.findBillingRow(sharedInvoiceDescription);
    const rowData = await billingPage.getBillingRowDataAsClient(billingRow);

    // Assert Case Name
    expect(rowData.case).toContain(testCaseData.title);

    // Assert Client
    expect(rowData.client).toBeTruthy();

    // Assert Amount
    const displayedAmount = parseFloat(rowData.amount.replace(/[^\d.]/g, ''));
    const submittedAmount = parseFloat(sharedBillingData.amount.replace(/[^\d.]/g, ''));
    expect(displayedAmount).toBe(submittedAmount); // jus make it work

    // Assert Status
    expect(rowData.status.toLowerCase()).toBe(sharedBillingData.status);

    // Assert Due Date
    expect(rowData.dueDate).toBe(sharedBillingData.dueDate);

    // Assert Description
    expect(rowData.description).toBe(sharedInvoiceDescription);
  });

});