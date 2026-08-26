import type { ByToggle } from "@/types/types";

interface CustomerPerson {
  initials: string;
  name: string;
  city: string;
  outstanding: string;
  credit: string;
}

interface CustomersVariant {
  count: number;
  people: CustomerPerson[];
}

export const customersData: ByToggle<CustomersVariant> = {
  paints: {
    count: 298,
    people: [
      { initials: "SL", name: "Sri Lakshmi Hardware", city: "Madurai", outstanding: "₹0", credit: "₹2,50,000" },
      { initials: "RP", name: "Rathna Paints & Hardware", city: "Dindigul", outstanding: "₹19,300", credit: "₹2,00,000" },
    ],
  },
  interiors: {
    count: 188,
    people: [
      { initials: "HD", name: "Home Decor Studio", city: "Trichy", outstanding: "₹18,600", credit: "₹1,50,000" },
      { initials: "VI", name: "Vinayaga Interiors", city: "Madurai", outstanding: "₹22,900", credit: "₹3,00,000" },
    ],
  },
};

interface SupplierPerson {
  initials: string;
  name: string;
  city: string;
  outstanding: string;
  gst: string;
}

interface SuppliersVariant {
  count: number;
  suppliers: SupplierPerson[];
}

export const suppliersData: ByToggle<SuppliersVariant> = {
  paints: {
    count: 36,
    suppliers: [
      { initials: "AP", name: "Asian Paints Depot", city: "Chennai", outstanding: "₹92,000", gst: "GST 33AAAA0000A1Z5" },
      { initials: "BD", name: "Berger Distributors", city: "Madurai", outstanding: "₹0", gst: "GST 33BBBB0000B1Z5" },
    ],
  },
  interiors: {
    count: 28,
    suppliers: [
      { initials: "CT", name: "CenturyPly Traders", city: "Coimbatore", outstanding: "₹0", gst: "GST 33CCCC0000C1Z5" },
      { initials: "IC", name: "Interio Craft Supplies", city: "Trichy", outstanding: "₹68,900", gst: "GST 33DDDD0000D1Z5" },
    ],
  },
};
