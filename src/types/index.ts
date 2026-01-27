// src/types/index.ts

export interface Invoice {
  id: string;             // Python sends a UUID string
  external_id: string;    // e.g. "INV-2026-001"
  source_system: string;
  customer_id: string;    // Backend sends ID, not "customer" name
  currency: string;
  total_amount: number;
  tax_amount: number;
  issue_date: string;
  due_date: string;
  status: string;         // 'draft' | 'sent' | 'paid' etc.
  zatca_hash?: string;
  qr_code_string?: string;
  zatca_qr?: string;      // The Base64 encoded string
  vat_amount?: number;    // The 15% VAT component
  base_amount?: number;
}

export interface Transaction {
  id: string;
  external_id: string;
  source_system: string;
  amount: number;
  currency: string;
  transaction_date: string;
  description: string;
  payer_name?: string;
  status: string;
  reconciliation_status: string; // 'matched' | 'unmatched'
}

export interface AgentResponse {
  invoice_id: string;
  recommended_channel: string;
  draft_message: string;
}