// -------------------------------------------------------------
// Matched 1:1 with fulcrum-core/src/domain/report_schemas.py
// -------------------------------------------------------------

export interface ReportPeriod {
    month: number;
    year: number;
    start_date: string;
    end_date: string;
}

export interface AIInsights {
    headline: string;
    summary: string;
    action_item: string;
}

export interface ProfitAndLoss {
    revenue: number;
    expenses: number;
    expense_breakdown: Record<string, number>;
    net_income: number;
    margin_pct: number | null;
}

export interface ReportCounts {
    invoice_count: number;
    paid_count: number;
    unpaid_count: number;
    overdue_count: number;
    transaction_count: number;
}

export interface MonthOverMonth {
    prev_month_label: string;
    prev_revenue: number;
    prev_expenses: number;
    prev_net_income: number;
    revenue_change_pct: number | null;
    expense_change_pct: number | null;
    net_income_change_pct: number | null;
}

export interface TopCustomer {
    customer_id: string;
    total_paid: number;
    invoice_count: number;
    revenue_share_pct: number;
}

export interface RevenueConcentration {
    top_customers: TopCustomer[];
    concentration_risk: boolean;
    top_customer_share_pct: number | null;
}

export interface MonthlyReportResponse {
    month: string;
    period: ReportPeriod;
    currency: string;
    pnl: ProfitAndLoss;
    counts: ReportCounts;
    mom: MonthOverMonth;
    revenue_concentration: RevenueConcentration;
    ai_insights: AIInsights;
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
    report_type?: string;
    year: number;
    month: number;
    version: number;
    created_at: string;
}
