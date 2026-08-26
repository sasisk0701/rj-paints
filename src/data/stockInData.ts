import type { ByToggle, KpiItem } from "@/types/types";

interface StockInRow {
  ref: string;
  date: string;
  source: string;
  party: string;
  product: string;
  qty: string;
  amount: string;
  reference: string;
}

interface StockInVariant {
  kpis: KpiItem[];
  pagination: string;
  rows: StockInRow[];
}

export const stockInData: ByToggle<StockInVariant> = {
  paints: {
    kpis: [
      { label: "Stock In (this month)", value: "182 entries", delta: "₹11.2L received", deltaTone: "neutral" },
      { label: "From Purchases", value: "156", delta: "85.7%", deltaTone: "neutral" },
      { label: "From Returns", value: "14", delta: "supplier returns", deltaTone: "neutral" },
      { label: "Adjustments", value: "12", delta: "opening / correction", deltaTone: "neutral" },
    ],
    pagination: "Showing 1–3 of 182 entries",
    rows: [
      { ref: "SI-0982", date: "24 Aug 2026", source: "Purchase", party: "Berger Distributors", product: "Enamel White 4L", qty: "60", amount: "₹54,200", reference: "INV-4471" },
      { ref: "SI-0981", date: "23 Aug 2026", source: "Purchase", party: "Asian Paints Depot", product: "Exterior Emulsion 10L", qty: "40", amount: "₹71,200", reference: "INV-4468" },
      { ref: "SI-0980", date: "22 Aug 2026", source: "Supplier Return", party: "Nerolac Agencies", product: "Distemper Red Oxide", qty: "8", amount: "₹9,200", reference: "SR-118" },
    ],
  },
  interiors: {
    kpis: [
      { label: "Stock In (this month)", value: "130 entries", delta: "₹7.4L received", deltaTone: "neutral" },
      { label: "From Purchases", value: "112", delta: "86.2%", deltaTone: "neutral" },
      { label: "From Returns", value: "10", delta: "supplier returns", deltaTone: "neutral" },
      { label: "Adjustments", value: "8", delta: "opening / correction", deltaTone: "neutral" },
    ],
    pagination: "Showing 1–3 of 130 entries",
    rows: [
      { ref: "SI-0979", date: "21 Aug 2026", source: "Opening Stock", party: "—", product: "PVC Panel 8mm", qty: "180", amount: "₹1,15,200", reference: "OPEN-2026" },
      { ref: "SI-0977", date: "20 Aug 2026", source: "Purchase", party: "CenturyPly Traders", product: "Laminate Oak Finish", qty: "80", amount: "₹1,08,400", reference: "INV-3391" },
      { ref: "SI-0975", date: "18 Aug 2026", source: "Purchase", party: "Hettich India", product: "Cabinet Hinges (100pk)", qty: "25", amount: "₹47,500", reference: "INV-3388" },
    ],
  },
};
