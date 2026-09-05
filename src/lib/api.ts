// centralized API Client. used Axios to create a dedicated service layer that abstracts all the network communication between my Next.js frontend and FastAPI backend.

import axios from 'axios';
import { Invoice, Transaction, AgentResponse } from '@/types';
import {
  MonthlyReportResponse,
  AgingReportResponse,
  CashFlowResponse,
  SavedReportMeta,
} from "@/types/report";

// The Base URL for your Python Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
});

export const api = {
  // --- DASHBOARD DATA ---
  // We use the same endpoint for both but extract different parts

  getInvoices: async (userId: string) => {
    // Calls dashboard/stats to get filtered invoices
    const response = await client.get('/dashboard/stats', {
      params: { user_id: userId }
    });
    return response.data.recent_invoices;
  },

  getTransactions: async (userId: string) => {
    // Calls dashboard/stats to get filtered transactions
    const response = await client.get('/dashboard/stats', {
      params: { user_id: userId }
    });
    // The Page expects { transactions: [...] } or just the array
    // Our dashboard endpoint returns { ..., transactions: [...] }
    return response.data;
  },

  // --- ACTIONS ---

  runReconciliation: async (userId: string) => {
    // POST request to trigger the AI matching
    const response = await client.post('/transactions/run-reconciliation', null, {
      params: { user_id: userId }
    });
    return response.data;
  },

  draftMessage: async (invoiceId: string) => {
    const response = await client.post<AgentResponse>(`/agent/draft-message/${invoiceId}`);
    return response.data;
  },

  downloadPdf: async (invoiceId: string) => {
    const response = await client.get(`/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  chat: async (query: string) => {
    const response = await client.post('/agent/chat', { query });
    return response.data;
  }
};

// 1. Fetch Monthly P&L Report (with optional Month/Year filter)
export async function fetchMonthlyReport(
  month?: number,
  year?: number
): Promise<MonthlyReportResponse> {
  const params = new URLSearchParams();
  if (month) params.append("month", month.toString());
  if (year) params.append("year", year.toString());
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE_URL}/api/v1/reports/monthly${query}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch report: ${res.statusText}`);
  return res.json();
}

// 2. Download Report PDF
export async function downloadReportPdf(month?: number, year?: number): Promise<void> {
  const params = new URLSearchParams();
  if (month) params.append("month", month.toString());
  if (year) params.append("year", year.toString());
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE_URL}/api/v1/reports/download-pdf${query}`);
  if (!res.ok) throw new Error("Failed to download PDF");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Fulcrum_Report_${year || new Date().getFullYear()}_${month || new Date().getMonth() + 1}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// 3. Fetch AR Aging Report
export async function fetchAgingReport(): Promise<AgingReportResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/aging/`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch aging report: ${res.statusText}`);
  return res.json();
}
// 4. Fetch Cash Flow Statement
export async function fetchCashFlow(
  month?: number,
  year?: number
): Promise<CashFlowResponse> {
  const params = new URLSearchParams();
  if (month) params.append("month", month.toString());
  if (year) params.append("year", year.toString());
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE_URL}/api/v1/cashflow/${query}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch cash flow: ${res.statusText}`);
  return res.json();
}
// 5. Fetch Versioned / Saved Reports List
export async function fetchSavedReports(): Promise<SavedReportMeta[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/saved`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    return [];
  }
}