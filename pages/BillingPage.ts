import { Page, Locator } from '@playwright/test';
import { BillingData } from '../types/BillingData';

export class BillingPage {
  constructor(private page: Page) {}

  async navigateToBillingList() {
    await this.page.goto('/billing/list.php');
    await this.page.waitForSelector('table tbody tr');
  }

  async clickCreateBilling() {
    const createButton = this.page.getByRole('link', { name: /Create Billing/i });
    await createButton.waitFor({ state: 'visible', timeout: 5000 });
    await createButton.click();
    await this.page.waitForSelector('form');
  }

  async fillBillingForm(data: BillingData): Promise<BillingData> {
    const form = this.page.locator('form');

    // Select case
    const caseSelect = form.getByLabel(/Select Case/i);
    if (data.caseName) {
      await caseSelect.selectOption(data.caseName);
    }

    // Amount
    const amountField = form.getByLabel(/Amount/i);
    await amountField.fill(data.amount);
    const formattedAmount = await amountField.inputValue();

    // Description
    const descriptionField = form.getByLabel(/Description/i);
    await descriptionField.fill(data.description);

    // Status (optional)
    if (data.status) {
      const statusSelect = form.getByLabel(/Status/i);
      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption(data.status);
      }
    }

    // Due Date (optional)
    if (data.dueDate) {
      const dueDateField = form.getByLabel(/Due Date/i);
      if (await dueDateField.isVisible()) {
        await dueDateField.evaluate((el, value) => {
          (el as HTMLInputElement).value = value;
        }, data.dueDate);
      }
    }

    return { ...data, amount: formattedAmount };
  }

  async submitBillingForm() {
    const form = this.page.locator('form');
    const submitButton = form.getByRole('button', { name: /Create Billing/i });
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    await submitButton.click();
    await this.page.waitForSelector('table, .alert, .success');
  }

  async findBillingRow(searchText: string): Promise<Locator> {
    return this.page.locator('table tbody tr').filter({
      has: this.page.locator(`td:has-text("${searchText}")`)
    });
  }

  async getBillingRowData(row: Locator) {
    const cells = await row.locator('td').all();
    return {
      case: (await cells[0]?.textContent())?.trim() || '',
      client: (await cells[1]?.textContent())?.trim() || '',
      amount: (await cells[2]?.textContent())?.trim() || '',
      statusDropdown: row.locator('select.status-dropdown'),
      dueDate: (await cells[4]?.textContent())?.trim() || '',
      description: (await cells[5]?.textContent())?.trim() || '',
    };
  }

  async selectFirstAvailableCase(): Promise<{ value: string; name: string }> {
    const form = this.page.locator('form');
    const caseSelect = form.getByLabel(/Select Case/i);

    const options = await caseSelect.locator('option[value]').all();
    if (options.length < 2) {
      throw new Error('No cases available for billing. Please create at least one case.');
    }

    // Skip placeholder (index 0)
    const firstRealOption = options[1];
    const value = (await firstRealOption.getAttribute('value')) || '';
    const name = (await firstRealOption.textContent())?.trim() || '';

    return { value, name };
  }

  async selectCaseByTitle(title: string): Promise<{ value: string; name: string } | null> {
    const form = this.page.locator('form');
    const caseSelect = form.getByLabel(/Select Case/i);

    const caseOption = caseSelect.locator('option', { hasText: title }).first();
    if (await caseOption.count() === 0) return null;

    const value = (await caseOption.getAttribute('value')) || '';
    const name = (await caseOption.textContent())?.trim() || '';

    return { value, name };
  }
}
