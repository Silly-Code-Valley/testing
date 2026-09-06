import { Page, Locator } from '@playwright/test';
import { CaseData } from '../types/CaseData';

export class CasesPage {
  constructor(private page: Page) {}

  async navigateToCasesList() {
    await this.page.goto('/cases/list.php');
    await this.page.waitForSelector('table tbody tr');
  }

  async caseExists(title: string): Promise<boolean> {
    const existingCase = this.page.locator('table tbody tr').filter({
      has: this.page.locator(`td:has-text("${title}")`)
    });
    return (await existingCase.count()) > 0;
  }

  async navigateToCreateCase() {
    await this.page.getByRole('link', { name: /Add Case/i }).click();
    await this.page.waitForSelector('form');
  }

  async fillCaseForm(data: CaseData) {
    const form = this.page.locator('form');

    // Title
    const titleField = form.locator(
      'input[name="title"], input[name="case_title"], input#title, input#case_title'
    ).first();
    await titleField.waitFor({ state: 'visible', timeout: 5000 });
    await titleField.fill(data.title);

    // Client
    const clientSelect = form.locator('select[name*="client"], select#client_id, [name="client_id"]').first();
    await this.trySelectOption(clientSelect, data.client, 'Client');

    // Lawyer
    const lawyerSelect = form.locator(
      'select[name*="lawyer"], select#lawyer_id, select[name="assigned_lawyer"], select#assigned_lawyer'
    ).first();
    await this.trySelectOption(lawyerSelect, data.lawyer ?? 'John Doeadeer', 'Lawyer');

    // Description
    const descriptionField = form.locator('textarea[name*="description"], #description').first();
    if (await descriptionField.isVisible()) {
      await descriptionField.fill(data.description);
    }

    // Case type
    await this.selectFirstAvailableOption(form.locator('select[name*="type"], select#case_type').first());

    // Status
    if (data.status) {
      const statusSelect = form.locator('select[name*="status"], select#status, select#case_status').first();
      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption(data.status);
      }
    }

    return form;
  }

  private async trySelectOption(select: Locator, value?: string, label?: string) {
    if (!(await select.isVisible())) return;

    if (value) {
      const option = select.locator('option', { hasText: new RegExp(value, 'i') }).first();
      if (await option.count()) {
        const val = await option.getAttribute('value');
        if (val) {
          await select.selectOption(val);
          return;
        }
      }
      console.warn(`⚠️ ${label ?? 'Option'} "${value}" not found, selecting first available`);
    }

    await this.selectFirstAvailableOption(select);
  }

  private async selectFirstAvailableOption(select: Locator) {
    if (!(await select.isVisible())) return;

    const options = await select.locator('option[value]:not([disabled])').all();
    if (options.length > 1) {
      // skip placeholder
      const first = options[1];
      const val = await first.getAttribute('value');
      if (val) await select.selectOption(val);
    } else if (options.length === 1) {
      const val = await options[0].getAttribute('value');
      if (val) await select.selectOption(val);
    }
  }

  async submitCaseForm() {
    const form = this.page.locator('form');
    await form.getByRole('button', { name: /Create|Submit|Save/i }).click();
  }
}
