import crypto from 'crypto';
import { BillingData } from '../types/BillingData';

export class BillingDataBuilder {
  private data: Partial<BillingData> = {};

  constructor() {
    this.withDefaults();
  }

  // Defaults
  private withDefaults(): this {
    const uniqueId = this.generateUniqueId();
    this.data = {
      amount: this.generateRandomAmount(),
      description: `Legal consultation services ${uniqueId}`,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'unpaid'
    };
    return this;
  }

  // Setters
  withCaseName(caseName: string): this {
    this.data.caseName = caseName;
    return this;
  }

  withAmount(amount: string): this {
    this.data.amount = amount;
    return this;
  }

  withRandomAmount(min = 1000, max = 9999): this {
    this.data.amount = this.generateRandomAmount(min, max);
    return this;
  }

  withStatus(status: 'unpaid' | 'paid' | 'overdue'): this {
    this.data.status = status;
    return this;
  }

  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  withDueDate(dueDate: string): this {
    this.data.dueDate = dueDate;
    return this;
  }

  private generateUniqueId(): string {
    const timestamp = Date.now();
    const random = crypto.randomUUID().slice(0, 8);
    return `${timestamp}-${random}`;
  }

  private generateRandomAmount(min = 1000, max = 9999): string {
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  build(): BillingData {
    const { caseName, amount, description } = this.data;
    if (!caseName) throw new Error('caseName is required');
    if (!amount) throw new Error('amount is required');
    if (!description) throw new Error('description is required');

    return this.data as BillingData;
  }

  static create(overrides?: Partial<BillingData>): BillingData {
    const builder = new BillingDataBuilder();
    if (overrides) Object.assign(builder.data, overrides);
    return builder.build();
  }
}

export function generateBillingData(overrides?: Partial<BillingData>): BillingData {
  return BillingDataBuilder.create(overrides);
}
