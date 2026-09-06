import crypto from 'crypto';
import { CaseData } from '../types/CaseData';

export class CaseDataBuilder {
  private data: Partial<CaseData> = {};

  constructor() {
    this.withDefaults();
  }

  // Defaults
  private withDefaults(): this {
    const uniqueId = this.generateUniqueId();
    this.data = {
      title: `Case ${uniqueId}`,
      description: `Case description ${uniqueId}`,
      status: 'open'
    };
    return this;
  }

  // Setters
  withClient(client: string): this {
    this.data.client = client;
    return this;
  }

  withLawyer(lawyer: string): this {
    this.data.lawyer = lawyer;
    return this;
  }

  withTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  withStatus(status: 'open' | 'closed' | 'pending'): this {
    this.data.status = status;
    return this;
  }

  private generateUniqueId(): string {
    const timestamp = Date.now();
    const random = crypto.randomUUID().slice(0, 6);
    return `${timestamp}-${random}`;
  }

  build(): CaseData {
    const { title, description } = this.data;
    if (!title) throw new Error('title is required');
    if (!description) throw new Error('description is required');

    return this.data as CaseData;
  }

  static create(overrides?: Partial<CaseData>): CaseData {
    const builder = new CaseDataBuilder();
    if (overrides) Object.assign(builder.data, overrides);
    return builder.build();
  }
}

export function generateCaseData(overrides?: Partial<CaseData>): CaseData {
  return CaseDataBuilder.create(overrides);
}
