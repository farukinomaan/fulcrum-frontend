// -------------------------------------------------------------
// Monthly P&L and Report Types
// -------------------------------------------------------------
export interface PnL {
    revenue: number;
    expenses: number;
    net_income: number;
    profit_margin_pct: number;
    expense_breakdown: Record<string, number>;
}

export interface MoMComparison {
    prev_month_str: string;
    prev_revenue: number;
    prev_expenses: number;
    prev_net_income: number;
    revenue_change_pct: number | null;
    expense_change_pct: number | null;
    net_income_change_pct: number | null;
}

export interface CustomerRevenue {
    customer_name: string;
    total_revenue: number;
    percentage_of_total: number;
    transaction_count: number;
}

export interface RevenueConcentration {
    top_customers: CustomerRevenue[];
    top_customer_pct: number;
    hhi_index: number;
    concentration_risk: "low" | "moderate" | "high";
}

export interface ReportCounts {
    invoices_issued: number;
    invoices_paid: number;
    invoices_overdue: number;
    expenses_logged: number;
}

export interface MonthlyReportResponse {
    period: {
        year: number;
        month: number;
        month_name: string;
        start_date: string;
        end_date: string;
    };
    pnl: PnL;
    mom: MoMComparison;
    revenue_concentration: RevenueConcentration;
    counts: ReportCounts;
    executive_summary: string;
    generated_at: string;
}

// -------------------------------------------------------------
// AR Aging Report Types
// -------------------------------------------------------------
export interface AgingInvoice {
    id: string;
    customer_name: string;
    amount: number;
    due_date: string;
    days_overdue: number;
    status: string;
}

export interface AgingBucket {
    range: string;
    total_amount: number;
    invoice_count: number;
    invoices: AgingInvoice[];
}

export interface AgingReportResponse {
    as_of_date: string;
    total_outstanding: number;
    total_overdue: number;
    buckets: {
        current: AgingBucket;
        days_1_30: AgingBucket;
        days_31_60: AgingBucket;
        days_61_90: AgingBucket;
        days_90_plus: AgingBucket;
    };
    summary: string;
}

// -------------------------------------------------------------
// Cash Flow Statement Types
// -------------------------------------------------------------
export interface CashFlowCategory {
    name: string;
    amount: number;
}

export interface CashFlowActivity {
    net_amount: number;
    categories: CashFlowCategory[];
}

export interface CashFlowResponse {
    period: {
        year: number;
        month: number;
        month_name: string;
    };
    operating_activities: CashFlowActivity;
    investing_activities: CashFlowActivity;
    financing_activities: CashFlowActivity;
    net_cash_flow: number;
    opening_cash_balance: number;
    closing_cash_balance: number;
    burn_rate: number;
    runway_months: number | null;
    summary: string;
}

// -------------------------------------------------------------
// Saved Report Metadata
// -------------------------------------------------------------
export interface SavedReportMeta {
    id: string;
    report_type: string;
    year: number;
    month: number;
    version: number;
    created_at: string;
}
