import { Supplier, StockInRecord, StockOutRecord, LabourPayment, ExpenseRecord, BankAccount, BankTransaction } from '../types';

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Asian Paints Regional Depot - Madurai',
    gstNumber: '33AAACA0001A1Z0',
    phone: '0452-2456789',
    email: 'maduraidepot@asianpaints.com',
    address: 'Plot 45, SIDCO Industrial Estate, Kappalur',
    city: 'Madurai',
    outstandingBalance: 45000,
    createdAt: '2026-01-10'
  },
  {
    id: 'sup-2',
    name: 'Berger Paints Depot - Tirunelveli',
    gstNumber: '33AAACB0002B1Z1',
    phone: '0462-2345678',
    email: 'tvldepot@bergerpaints.com',
    address: 'Vannarpettai Main Road',
    city: 'Tirunelveli',
    outstandingBalance: 12500,
    createdAt: '2026-01-20'
  },
  {
    id: 'sup-3',
    name: 'Birla White Regional Distributor',
    gstNumber: '33AAACC0003C1Z2',
    phone: '0461-2398765',
    email: 'orders@birlawhite-distributors.com',
    address: 'Harbor Bypass Road',
    city: 'Tuticorin',
    outstandingBalance: 0,
    createdAt: '2026-02-05'
  },
  {
    id: 'sup-4',
    name: 'Sri Lakshmi Hardware Wholesalers',
    gstNumber: '33AAACD0004D1Z3',
    phone: '9842154321',
    email: 'lakshmihardwares@gmail.com',
    address: 'West Car Street',
    city: 'Kovilpatti',
    outstandingBalance: 8200,
    createdAt: '2026-02-15'
  }
];

export const INITIAL_STOCK_IN: StockInRecord[] = [
  {
    id: 'stk-in-101',
    invoiceNo: 'AP-PUR-2026-089',
    supplierId: 'sup-1',
    supplierName: 'Asian Paints Regional Depot - Madurai',
    purchaseDate: '2026-08-01',
    items: [
      { productId: 'prod-1', productName: 'Asian Paints Royale Luxury Emulsion (Silk)', quantity: 20, purchasePrice: 4200, gstRate: 18, total: 99120 },
      { productId: 'prod-2', productName: 'Asian Paints Apex Ultima Exterior Emulsion', quantity: 15, purchasePrice: 4800, gstRate: 18, total: 84960 }
    ],
    subtotal: 156000,
    totalGst: 28080,
    grandTotal: 184080,
    paymentMode: 'Bank Transfer',
    notes: 'Bulk stock arrival for Kovilpatti showroom',
    createdAt: '2026-08-01'
  },
  {
    id: 'stk-in-102',
    invoiceNo: 'BW-PUR-2026-042',
    supplierId: 'sup-3',
    supplierName: 'Birla White Regional Distributor',
    purchaseDate: '2026-08-03',
    items: [
      { productId: 'prod-3', productName: 'Birla White WallCare Putty', quantity: 50, purchasePrice: 780, gstRate: 18, total: 46020 }
    ],
    subtotal: 39000,
    totalGst: 7020,
    grandTotal: 46020,
    paymentMode: 'UPI',
    notes: 'Wall Putty stock replenishment',
    createdAt: '2026-08-03'
  }
];

export const INITIAL_STOCK_OUT: StockOutRecord[] = [
  {
    id: 'inv-2026-501',
    invoiceNo: 'RJ-INV-501',
    customerName: 'K. Balakrishnan (Civil Contractor)',
    customerPhone: '9443187654',
    saleDate: '2026-08-04',
    items: [
      { productId: 'prod-1', productName: 'Asian Paints Royale Luxury Emulsion (Silk)', quantity: 4, sellingPrice: 5100, discount: 200, gstRate: 18, total: 23128 },
      { productId: 'prod-3', productName: 'Birla White WallCare Putty', quantity: 10, sellingPrice: 920, discount: 20, gstRate: 18, total: 10620 }
    ],
    subtotal: 29600,
    discountTotal: 1000,
    totalGst: 5148,
    grandTotal: 33748,
    paymentMode: 'UPI',
    notes: 'Supply for Ettayapuram Road Villa Project',
    createdAt: '2026-08-04'
  },
  {
    id: 'inv-2026-502',
    invoiceNo: 'RJ-INV-502',
    customerName: 'M. Senthil Nathan',
    customerPhone: '9894211223',
    saleDate: '2026-08-05',
    items: [
      { productId: 'prod-2', productName: 'Asian Paints Apex Ultima Exterior Emulsion', quantity: 2, sellingPrice: 5850, discount: 100, gstRate: 18, total: 13570 },
      { productId: 'prod-6', productName: 'Asian Paints TruCare Interior Wall Primer', quantity: 3, sellingPrice: 2050, discount: 50, gstRate: 18, total: 7080 }
    ],
    subtotal: 17850,
    discountTotal: 350,
    totalGst: 3150,
    grandTotal: 20650,
    paymentMode: 'Cash',
    notes: 'Residential repainting project',
    createdAt: '2026-08-05'
  }
];

export const INITIAL_LABOUR: LabourPayment[] = [
  {
    id: 'lab-1',
    name: 'M. Murugan (Chief Carpenter)',
    phone: '9786543210',
    siteLocation: 'Royal Residence Villa, Kovilpatti',
    description: 'Modular kitchen carcass assembly & soft close fitting',
    amount: 14500,
    paymentMode: 'Bank Transfer',
    paymentDate: '2026-08-02',
    remarks: 'Phase 2 Carpentry Work Completed'
  },
  {
    id: 'lab-2',
    name: 'S. Ramasamy & Painters Team',
    phone: '9486123456',
    siteLocation: 'Kathiresan Kovil Street Interior Site',
    description: 'Wall putty sanding, 2 coats Royale Silk emulsion application',
    amount: 18000,
    paymentMode: 'Cash',
    paymentDate: '2026-08-04',
    remarks: 'Final finish completed cleanly'
  },
  {
    id: 'lab-3',
    name: 'P. Arumugam (Ceiling Technician)',
    phone: '9629182736',
    siteLocation: 'New Bus Stand Commercial Complex',
    description: 'Gyproc false ceiling channel grid setup & board fixing',
    amount: 9500,
    paymentMode: 'UPI',
    paymentDate: '2026-08-05'
  }
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-101',
    category: 'Rent',
    title: 'Showroom & Warehouse Monthly Rent',
    amount: 35000,
    paymentMode: 'Bank Transfer',
    expenseDate: '2026-08-01',
    remarks: 'August 2026 Showroom Rent'
  },
  {
    id: 'exp-102',
    category: 'Electricity',
    title: 'TNEB Electricity Bill Showroom & Lighting',
    amount: 8400,
    paymentMode: 'UPI',
    expenseDate: '2026-08-03',
    remarks: 'Bi-monthly TNEB Bill'
  },
  {
    id: 'exp-103',
    category: 'Fuel',
    title: 'Delivery Pickup Vehicle Diesel & Transport',
    amount: 4200,
    paymentMode: 'Cash',
    expenseDate: '2026-08-04'
  },
  {
    id: 'exp-104',
    category: 'Salary',
    title: 'Staff Advance & Monthly Wages',
    amount: 48000,
    paymentMode: 'Bank Transfer',
    expenseDate: '2026-08-05'
  }
];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-1',
    accountName: 'RJ Paints & Hardwares',
    bankName: 'State Bank of India (SBI)',
    accountNumber: '389201928374',
    ifscCode: 'SBIN0000863',
    currentBalance: 385400,
    type: 'Current'
  },
  {
    id: 'bank-2',
    accountName: 'Styleo Interiors',
    bankName: 'HDFC Bank',
    accountNumber: '50200049281726',
    ifscCode: 'HDFC0001245',
    currentBalance: 520000,
    type: 'Current'
  },
  {
    id: 'bank-cash',
    accountName: 'Shop Cash Drawer',
    bankName: 'Cash In Hand',
    accountNumber: 'N/A',
    ifscCode: 'N/A',
    currentBalance: 42800,
    type: 'Cash In Hand'
  }
];

export const INITIAL_TRANSACTIONS: BankTransaction[] = [
  {
    id: 'tx-1',
    type: 'Income',
    amount: 33748,
    paymentMode: 'UPI',
    accountTo: 'State Bank of India (SBI)',
    referenceNo: 'UPI/6281920192',
    description: 'Sale Invoice RJ-INV-501 Payment',
    date: '2026-08-04'
  },
  {
    id: 'tx-2',
    type: 'Expense',
    amount: 35000,
    paymentMode: 'Bank Transfer',
    accountFrom: 'State Bank of India (SBI)',
    referenceNo: 'IFT/9281726',
    description: 'Showroom Rent August 2026',
    date: '2026-08-01'
  },
  {
    id: 'tx-3',
    type: 'Income',
    amount: 150000,
    paymentMode: 'Bank Transfer',
    accountTo: 'HDFC Bank',
    referenceNo: 'NEFT/8172635',
    description: 'Advance payment for Royal Villa Interior Project',
    date: '2026-08-03'
  }
];

export const MONTHLY_SALES_ANALYTICS = [
  { month: 'Mar', sales: 420000, purchase: 310000, profit: 110000, expense: 45000 },
  { month: 'Apr', sales: 510000, purchase: 380000, profit: 130000, expense: 52000 },
  { month: 'May', sales: 680000, purchase: 490000, profit: 190000, expense: 61000 },
  { month: 'Jun', sales: 620000, purchase: 440000, profit: 180000, expense: 58000 },
  { month: 'Jul', sales: 750000, purchase: 520000, profit: 230000, expense: 64000 },
  { month: 'Aug', sales: 840000, purchase: 590000, profit: 250000, expense: 71000 }
];
