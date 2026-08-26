import type { ByToggle, KpiItem } from "@/types/types";

interface BankAccount {
  name: string;
  acc: string;
  ifsc: string;
  balance: string;
}

interface BankTxnRow {
  date: string;
  type: string;
  description: string;
  account: string;
  amount: string;
  dir: "Credit" | "Debit";
}

interface BankVariant {
  kpis: KpiItem[];
  accounts: BankAccount[];
  rows: BankTxnRow[];
}

export const bankData: ByToggle<BankVariant> = {
  paints: {
    kpis: [
      { label: "Bank Balance", value: "₹12.9L", delta: "2 accounts", deltaTone: "neutral" },
      { label: "This Month Deposits", value: "₹5.1L", delta: "▲ 4.8%", deltaTone: "up" },
      { label: "This Month Withdrawals", value: "₹3.6L", delta: "", deltaTone: "neutral" },
      { label: "Pending Transfers", value: "0", delta: "none", deltaTone: "neutral" },
    ],
    accounts: [
      { name: "Indian Bank – Current", acc: "IB0492817", ifsc: "IDIB000A492", balance: "₹11,20,400" },
      { name: "HDFC Bank – Current", acc: "HD1128730", ifsc: "HDFC0001128", balance: "₹1,69,600" },
    ],
    rows: [
      { date: "24 Aug 2026", type: "Deposit", description: "Sri Lakshmi Hardware payment", account: "Indian Bank", amount: "₹18,400", dir: "Credit" },
      { date: "23 Aug 2026", type: "Withdrawal", description: "Asian Paints Depot payment", account: "HDFC Bank", amount: "₹92,000", dir: "Debit" },
    ],
  },
  interiors: {
    kpis: [
      { label: "Bank Balance", value: "₹6.5L", delta: "1 account", deltaTone: "neutral" },
      { label: "This Month Deposits", value: "₹3.0L", delta: "▲ 8.3%", deltaTone: "up" },
      { label: "This Month Withdrawals", value: "₹2.0L", delta: "", deltaTone: "neutral" },
      { label: "Pending Transfers", value: "1", delta: "bank-to-bank", deltaTone: "neutral" },
    ],
    accounts: [
      { name: "SBI – Savings (Interiors)", acc: "SB7729104", ifsc: "SBIN0007729", balance: "₹6,50,300" },
    ],
    rows: [
      { date: "22 Aug 2026", type: "Deposit", description: "Home Decor Studio payment", account: "SBI", amount: "₹7,850", dir: "Credit" },
      { date: "18 Aug 2026", type: "Withdrawal", description: "CenturyPly Traders payment", account: "SBI", amount: "₹1,08,400", dir: "Debit" },
    ],
  },
};

interface CashRow {
  date: string;
  type: string;
  description: string;
  amount: string;
  dir: "Credit" | "Debit";
}

interface CashVariant {
  kpis: KpiItem[];
  rows: CashRow[];
}

export const cashData: ByToggle<CashVariant> = {
  paints: {
    kpis: [
      { label: "Opening Cash Balance", value: "₹26,000", delta: "1 Aug 2026", deltaTone: "neutral" },
      { label: "Cash In", value: "₹1,12,400", delta: "this month", deltaTone: "neutral" },
      { label: "Cash Out", value: "₹94,900", delta: "this month", deltaTone: "neutral" },
      { label: "Current Cash Balance", value: "₹43,500", delta: "as of today", deltaTone: "neutral" },
    ],
    rows: [
      { date: "24 Aug 2026", type: "Cash In", description: "Counter sale – walk-in", amount: "₹4,200", dir: "Credit" },
      { date: "24 Aug 2026", type: "Cash Out", description: "Transport expense", amount: "₹1,100", dir: "Debit" },
    ],
  },
  interiors: {
    kpis: [
      { label: "Opening Cash Balance", value: "₹16,000", delta: "1 Aug 2026", deltaTone: "neutral" },
      { label: "Cash In", value: "₹74,000", delta: "this month", deltaTone: "neutral" },
      { label: "Cash Out", value: "₹58,000", delta: "this month", deltaTone: "neutral" },
      { label: "Current Cash Balance", value: "₹32,000", delta: "as of today", deltaTone: "neutral" },
    ],
    rows: [
      { date: "23 Aug 2026", type: "Cash In", description: "Supplier cash refund", amount: "₹2,600", dir: "Credit" },
      { date: "22 Aug 2026", type: "Cash Out", description: "Office maintenance", amount: "₹3,400", dir: "Debit" },
    ],
  },
};

interface PaymentRow {
  ref: string;
  date: string;
  type: "Receipt" | "Payment";
  party: string;
  mode: string;
  amount: string;
}

interface PaymentsVariant {
  pagination: string;
  rows: PaymentRow[];
}

export const paymentsData: ByToggle<PaymentsVariant> = {
  paints: {
    pagination: "Showing 1–2 of 312 entries",
    rows: [
      { ref: "RCT-889", date: "24 Aug 2026", type: "Receipt", party: "Sri Lakshmi Hardware", mode: "Bank", amount: "₹18,400" },
      { ref: "PAY-621", date: "23 Aug 2026", type: "Payment", party: "Asian Paints Depot", mode: "Bank", amount: "₹92,000" },
    ],
  },
  interiors: {
    pagination: "Showing 1–2 of 200 entries",
    rows: [
      { ref: "RCT-887", date: "22 Aug 2026", type: "Receipt", party: "Vinayaga Interiors (Advance)", mode: "Cash", amount: "₹10,000" },
      { ref: "PAY-619", date: "20 Aug 2026", type: "Payment", party: "Interio Craft Supplies", mode: "Bank", amount: "₹68,900" },
    ],
  },
};

interface ExpenseRow {
  date: string;
  category: string;
  description: string;
  mode: string;
  amount: string;
}

interface ExpensesVariant {
  kpis: KpiItem[];
  rows: ExpenseRow[];
}

export const expensesData: ByToggle<ExpensesVariant> = {
  paints: {
    kpis: [
      { label: "Expenses (this month)", value: "₹82,600", delta: "▲ 3.4% MoM", deltaTone: "up" },
      { label: "Top Category", value: "Transport", delta: "₹22,200", deltaTone: "neutral" },
      { label: "Pending Approvals", value: "2", delta: "awaiting review", deltaTone: "down" },
      { label: "Share of Total Expenses", value: "58%", delta: "of combined", deltaTone: "neutral" },
    ],
    rows: [
      { date: "24 Aug 2026", category: "Transport", description: "Delivery to Trichy branch", mode: "Cash", amount: "₹3,200" },
      { date: "18 Aug 2026", category: "Rent", description: "Godown rent – August", mode: "Bank", amount: "₹40,000" },
    ],
  },
  interiors: {
    kpis: [
      { label: "Expenses (this month)", value: "₹60,000", delta: "▲ 5.2% MoM", deltaTone: "up" },
      { label: "Top Category", value: "Salary", delta: "₹25,000", deltaTone: "neutral" },
      { label: "Pending Approvals", value: "1", delta: "awaiting review", deltaTone: "down" },
      { label: "Share of Total Expenses", value: "42%", delta: "of combined", deltaTone: "neutral" },
    ],
    rows: [
      { date: "22 Aug 2026", category: "Electricity", description: "Warehouse – August bill", mode: "Bank", amount: "₹14,800" },
      { date: "20 Aug 2026", category: "Salary", description: "Warehouse staff – advance", mode: "Bank", amount: "₹25,000" },
    ],
  },
};
