export interface CaseData {
  client?: string;
  lawyer?: string;
  title: string;
  description: string;
  status?: 'open' | 'closed' | 'pending';
}
