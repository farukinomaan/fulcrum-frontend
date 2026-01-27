import axios from 'axios';
import { Invoice, Transaction, AgentResponse } from '@/types';

// The Base URL for your Python Backend
const API_URL = 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_URL,
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