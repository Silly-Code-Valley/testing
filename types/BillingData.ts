
export interface BillingData {
  caseName: string;
  amount: string;
  description: string;
  status?: 'unpaid' | 'paid' | 'overdue';
  dueDate?: string;
}