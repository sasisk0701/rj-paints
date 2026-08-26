import type { ByToggle, KpiItem, Tone } from "@/types/types";

interface PurchaseRow {
  po: string;
  date: string;
  supplier: string;
  items: string;
  amount: string;
  statusTone: Tone;
  status: string;
}

interface PurchasesVariant {
  kpis: KpiItem[];
  pagination: string;
  rows: PurchaseRow[];
}

export const purchasesData: ByToggle<PurchasesVariant> = {
  paints: {
    kpis: [
      { label: "Purchases (this month)", value: "₹11.6L", delta: "▲ 6.4% MoM", deltaTone: "up" },
      { label: "Open Purchase Orders", value: "7", delta: "awaiting delivery", deltaTone: "neutral" },
      { label: "Unpaid to Suppliers", value: "₹3.9L", delta: "across 5 invoices", deltaTone: "down" },
      { label: "Purchase Returns", value: "₹18,200", delta: "2 returns", deltaTone: "neutral" },
    ],
    pagination: "Showing 1–2 of 58 purchases",
    rows: [
      { po: "PO-1129", date: "24 Aug 2026", supplier: "Asian Paints Depot", items: "Enamel White 4L ×60", amount: "₹92,000", statusTone: "warn", status: "Pending" },
      { po: "PO-1127", date: "20 Aug 2026", supplier: "Berger Distributors", items: "Wood Primer 1L ×120", amount: "₹22,600", statusTone: "success", status: "Paid" },
    ],
  },
  interiors: {
    kpis: [
      { label: "Purchases (this month)", value: "₹7.0L", delta: "▲ 10.5% MoM", deltaTone: "up" },
      { label: "Open Purchase Orders", value: "5", delta: "awaiting delivery", deltaTone: "neutral" },
      { label: "Unpaid to Suppliers", value: "₹2.3L", delta: "across 4 invoices", deltaTone: "down" },
      { label: "Purchase Returns", value: "₹23,000", delta: "1 return", deltaTone: "neutral" },
    ],
    pagination: "Showing 1–2 of 38 purchases",
    rows: [
      { po: "PO-1128", date: "22 Aug 2026", supplier: "CenturyPly Traders", items: "Laminate Oak Finish ×80", amount: "₹1,08,400", statusTone: "success", status: "Paid" },
      { po: "PO-1126", date: "18 Aug 2026", supplier: "Interio Craft Supplies", items: "PVC Panel 8mm ×90", amount: "₹68,900", statusTone: "danger", status: "Overdue" },
    ],
  },
};

interface SaleRow {
  invoice: string;
  date: string;
  customer: string;
  items: string;
  amount: string;
  statusTone: Tone;
  status: string;
}

interface SalesVariant {
  kpis: KpiItem[];
  pagination: string;
  rows: SaleRow[];
}

export const salesData: ByToggle<SalesVariant> = {
  paints: {
    kpis: [
      { label: "Sales (this month)", value: "₹15.4L", delta: "▲ 9.2% MoM", deltaTone: "up" },
      { label: "Invoices Raised", value: "196", delta: "this month", deltaTone: "neutral" },
      { label: "Customer Outstanding", value: "₹3.1L", delta: "7 overdue", deltaTone: "down" },
      { label: "Sales Returns", value: "₹11,600", delta: "3 returns", deltaTone: "neutral" },
    ],
    pagination: "Showing 1–2 of 196 invoices",
    rows: [
      { invoice: "SO-2451", date: "24 Aug 2026", customer: "Sri Lakshmi Hardware", items: "Enamel White 4L ×20", amount: "₹18,400", statusTone: "success", status: "Paid" },
      { invoice: "SO-2443", date: "18 Aug 2026", customer: "Rathna Paints & Hardware", items: "Distemper Red Oxide ×15", amount: "₹19,300", statusTone: "danger", status: "Overdue" },
    ],
  },
  interiors: {
    kpis: [
      { label: "Sales (this month)", value: "₹9.5L", delta: "▲ 14.8% MoM", deltaTone: "up" },
      { label: "Invoices Raised", value: "122", delta: "this month", deltaTone: "neutral" },
      { label: "Customer Outstanding", value: "₹1.8L", delta: "5 overdue", deltaTone: "down" },
      { label: "Sales Returns", value: "₹8,000", delta: "2 returns", deltaTone: "neutral" },
    ],
    pagination: "Showing 1–2 of 122 invoices",
    rows: [
      { invoice: "SO-2450", date: "24 Aug 2026", customer: "Home Decor Studio", items: "Laminate Oak Finish ×6", amount: "₹7,850", statusTone: "success", status: "Paid" },
      { invoice: "SO-2447", date: "21 Aug 2026", customer: "Vinayaga Interiors", items: "PVC Panel 8mm ×30", amount: "₹22,900", statusTone: "warn", status: "Partial" },
    ],
  },
};
