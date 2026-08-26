import type { ByToggle } from "@/types/types";

export interface ReportGroup {
  title: string;
  items: string[];
}

export const reportGroups: ReportGroup[] = [
  { title: "Stock Reports", items: ["Current Stock Report", "Stock In Report", "Stock Out Report", "Low Stock Report"] },
  { title: "Purchase Reports", items: ["Purchase Report", "Supplier-wise Purchase", "Product-wise Purchase"] },
  { title: "Sales Reports", items: ["Sales Report", "Customer-wise Sales", "Product-wise Sales"] },
  { title: "Financial Reports", items: ["Bank Report", "Cash Report", "Expense Report", "Customer Outstanding"] },
];

interface PortalUser {
  initials: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Disabled";
}

interface UsersVariant {
  subtitle: string;
  users: PortalUser[];
}

export const usersData: ByToggle<UsersVariant> = {
  paints: {
    subtitle: "Users with Paints module access",
    users: [
      { initials: "SK", name: "Selvi Kannan", email: "selvi@ajenterprises.in", role: "Stock Manager", status: "Active" },
      { initials: "AK", name: "Aravind K.", email: "aravind@ajenterprises.in", role: "Accounts User", status: "Active" },
    ],
  },
  interiors: {
    subtitle: "Users with Interiors module access",
    users: [
      { initials: "MR", name: "Muthu Raja", email: "muthu@ajenterprises.in", role: "Super Admin", status: "Active" },
      { initials: "PV", name: "Priya V.", email: "priya@ajenterprises.in", role: "Sales User", status: "Disabled" },
    ],
  },
};

export interface CompanySettings {
  name: string;
  gst: string;
  address: string;
  phone: string;
}

export const settingsData: ByToggle<CompanySettings> = {
  paints: {
    name: "AJ Enterprises — Paints Division",
    gst: "33ABCDE1234F1Z5",
    address: "14, Anna Nagar Main Road, Madurai",
    phone: "+91 98421 00000",
  },
  interiors: {
    name: "AJ Enterprises — Interiors Division",
    gst: "33ABCDE1234F1Z6",
    address: "22, Bypass Road, Madurai",
    phone: "+91 98421 00011",
  },
};

export const settingsNav: string[] = [
  "Company Details",
  "Paints Company",
  "Interiors Company",
  "Tax / GST",
  "Invoice Settings",
  "Currency & Units",
  "Notifications",
  "Backup / Data",
];

interface ActivityLogEntry {
  time: string;
  user: string;
  action: string;
  module: string;
  reference: string;
}

export const activityLogData: ByToggle<ActivityLogEntry[]> = {
  paints: [
    { time: "24 Aug 2026, 10:42 AM", user: "Selvi Kannan", action: "Stock In Created", module: "Inventory", reference: "SI-0982" },
    { time: "23 Aug 2026, 02:30 PM", user: "Selvi Kannan", action: "Product Updated", module: "Catalog", reference: "PNT-EW-04L" },
  ],
  interiors: [
    { time: "24 Aug 2026, 09:15 AM", user: "Muthu Raja", action: "Sales Created", module: "Trade", reference: "SO-2450" },
    { time: "22 Aug 2026, 11:05 AM", user: "Muthu Raja", action: "Stock In Created", module: "Inventory", reference: "SI-0979" },
  ],
};
