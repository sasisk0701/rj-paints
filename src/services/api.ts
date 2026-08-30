import axios from 'axios';
import { Product, Supplier, StockInRecord, StockOutRecord, LabourPayment, ExpenseRecord, BankAccount, BankTransaction } from '../types';
import { INITIAL_PRODUCTS } from '../data/paintsData';
import { INITIAL_SUPPLIERS, INITIAL_STOCK_IN, INITIAL_STOCK_OUT, INITIAL_LABOUR, INITIAL_EXPENSES, INITIAL_BANK_ACCOUNTS, INITIAL_TRANSACTIONS } from '../data/mockAdminData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('rj_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── LocalStorage helpers (used by modules not yet migrated to API) ────────
const getStoredData = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setStoredData = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* noop */ }
};

export const initializeDatabase = () => {
  if (!localStorage.getItem('rj_db_products'))    setStoredData('rj_db_products', INITIAL_PRODUCTS);
  if (!localStorage.getItem('rj_db_suppliers'))   setStoredData('rj_db_suppliers', INITIAL_SUPPLIERS);
  if (!localStorage.getItem('rj_db_stock_in'))    setStoredData('rj_db_stock_in', INITIAL_STOCK_IN);
  if (!localStorage.getItem('rj_db_stock_out'))   setStoredData('rj_db_stock_out', INITIAL_STOCK_OUT);
  if (!localStorage.getItem('rj_db_labour'))      setStoredData('rj_db_labour', INITIAL_LABOUR);
  if (!localStorage.getItem('rj_db_expenses'))    setStoredData('rj_db_expenses', INITIAL_EXPENSES);
  if (!localStorage.getItem('rj_db_banks'))       setStoredData('rj_db_banks', INITIAL_BANK_ACCOUNTS);
  if (!localStorage.getItem('rj_db_transactions'))setStoredData('rj_db_transactions', INITIAL_TRANSACTIONS);
};

initializeDatabase();

// ─── Auth Service ──────────────────────────────────────────────────────────
export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await axiosClient.post('/api/auth/login', { email, password });
    return data as { token: string; user: { id: string; email: string; name: string; role: string } };
  },
  logout: async () => {
    await axiosClient.post('/api/auth/logout').catch(() => {});
  },
  me: async () => {
    const { data } = await axiosClient.get('/api/auth/me');
    return data as { id: string; email: string; name: string; role: string; createdAt: string };
  },
};

// ─── Admin: Users ──────────────────────────────────────────────────────────
export const adminUserService = {
  getUsers: async () => {
    const { data } = await axiosClient.get('/api/admin/users');
    return data as { id: string; email: string; name: string; role: string; createdAt: string }[];
  },
  createUser: async (payload: { email: string; name: string; password: string }) => {
    const { data } = await axiosClient.post('/api/admin/users', payload);
    return data;
  },
  deleteUser: async (id: string) => {
    await axiosClient.delete(`/api/admin/users/${id}`);
  },
};

// ─── Admin: Settings ───────────────────────────────────────────────────────
export const settingsService = {
  getSettings: async (): Promise<Record<string, string>> => {
    const { data } = await axiosClient.get('/api/admin/settings');
    return data;
  },
  saveSettings: async (updates: Record<string, string>) => {
    await axiosClient.put('/api/admin/settings', updates);
  },
};

// ─── Categories ──────────────────────────────────────────────────────────────
export interface ApiCategory {
  id: string; name: string; business: string; description: string | null;
  color: string; createdAt: string; _count?: { products: number };
}
export const categoryService = {
  getAll: async (business?: string): Promise<ApiCategory[]> => {
    const { data } = await axiosClient.get('/api/categories', { params: business ? { business } : {} });
    return data;
  },
  create: async (payload: { name: string; business: string; description?: string; color?: string }) => {
    const { data } = await axiosClient.post('/api/categories', payload);
    return data as ApiCategory;
  },
  update: async (id: string, payload: { name?: string; description?: string; color?: string }) => {
    const { data } = await axiosClient.put(`/api/categories/${id}`, payload);
    return data as ApiCategory;
  },
  remove: async (id: string) => { await axiosClient.delete(`/api/categories/${id}`); },
};

// ─── Products (API) ───────────────────────────────────────────────────────────
export interface ApiProduct {
  id: string; name: string; categoryId: string | null; categoryName: string;
  brand: string; sku: string; barcode: string; description: string | null;
  purchasePrice: number; sellingPrice: number; gstRate: number;
  stock: number; minStock: number; unit: string; image: string | null;
  business: string; status: string; createdAt: string; updatedAt: string;
  category?: { id: string; name: string; color: string } | null;
}
export const apiProductService = {
  getAll: async (filters?: { business?: string; category?: string; status?: string; search?: string }): Promise<ApiProduct[]> => {
    const { data } = await axiosClient.get('/api/products', { params: filters || {} });
    return data;
  },
  create: async (payload: Partial<ApiProduct>): Promise<ApiProduct> => {
    const { data } = await axiosClient.post('/api/products', payload);
    return data;
  },
  update: async (id: string, payload: Partial<ApiProduct>): Promise<ApiProduct> => {
    const { data } = await axiosClient.put(`/api/products/${id}`, payload);
    return data;
  },
  remove: async (id: string) => { await axiosClient.delete(`/api/products/${id}`); },
};

// ─── Admin: Activity Log ───────────────────────────────────────────────────
export const activityLogService = {
  getLogs: async (filters?: { business?: string; module?: string; userId?: string; limit?: number }) => {
    const params: Record<string, string | number> = { limit: filters?.limit ?? 100 };
    if (filters?.business) params.business = filters.business;
    if (filters?.module)   params.module   = filters.module;
    if (filters?.userId)   params.userId   = filters.userId;
    const { data } = await axiosClient.get('/api/admin/activity-log', { params });
    return data as {
      id: string;
      userId: string;
      userName: string;
      action: string;
      module: string;
      reference: string | null;
      business: string;
      createdAt: string;
    }[];
  },
  getLogUsers: async () => {
    const { data } = await axiosClient.get('/api/admin/activity-log/users');
    return data as { userId: string; userName: string }[];
  },
};

// ─── Products (localStorage — to be migrated) ─────────────────────────────
export const productService = {
  getProducts: async (): Promise<Product[]> =>
    getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS),

  addProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const products = getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS);
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setStoredData('rj_db_products', [newProduct, ...products]);
    return newProduct;
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product> => {
    const products = getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS);
    let updated: Product | null = null;
    const list = products.map((p) => {
      if (p.id === id) { updated = { ...p, ...updates, updatedAt: new Date().toISOString().split('T')[0] }; return updated; }
      return p;
    });
    setStoredData('rj_db_products', list);
    return updated || products[0];
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const products = getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS);
    setStoredData('rj_db_products', products.filter((p) => p.id !== id));
    return true;
  },
};

// ─── Suppliers (localStorage — to be migrated) ────────────────────────────
export const supplierService = {
  getSuppliers: async (): Promise<Supplier[]> =>
    getStoredData<Supplier[]>('rj_db_suppliers', INITIAL_SUPPLIERS),

  addSupplier: async (supplier: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> => {
    const list = getStoredData<Supplier[]>('rj_db_suppliers', INITIAL_SUPPLIERS);
    const newSup: Supplier = { ...supplier, id: `sup-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] };
    setStoredData('rj_db_suppliers', [newSup, ...list]);
    return newSup;
  },

  deleteSupplier: async (id: string): Promise<boolean> => {
    const list = getStoredData<Supplier[]>('rj_db_suppliers', INITIAL_SUPPLIERS);
    setStoredData('rj_db_suppliers', list.filter((s) => s.id !== id));
    return true;
  },
};

// ─── Inventory (localStorage — to be migrated) ────────────────────────────
export const inventoryService = {
  getStockIn: async (): Promise<StockInRecord[]> =>
    getStoredData<StockInRecord[]>('rj_db_stock_in', INITIAL_STOCK_IN),

  createStockIn: async (record: Omit<StockInRecord, 'id' | 'createdAt'>): Promise<StockInRecord> => {
    const records = getStoredData<StockInRecord[]>('rj_db_stock_in', INITIAL_STOCK_IN);
    const newRecord: StockInRecord = { ...record, id: `stk-in-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] };
    setStoredData('rj_db_stock_in', [newRecord, ...records]);
    const products = getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS);
    record.items.forEach((item) => {
      const i = products.findIndex((p) => p.id === item.productId);
      if (i !== -1) {
        products[i].stock += item.quantity;
        if (products[i].stock > products[i].minStock) products[i].status = 'In Stock';
      }
    });
    setStoredData('rj_db_products', products);
    return newRecord;
  },

  getStockOut: async (): Promise<StockOutRecord[]> =>
    getStoredData<StockOutRecord[]>('rj_db_stock_out', INITIAL_STOCK_OUT),

  createStockOut: async (record: Omit<StockOutRecord, 'id' | 'createdAt'>): Promise<StockOutRecord> => {
    const records = getStoredData<StockOutRecord[]>('rj_db_stock_out', INITIAL_STOCK_OUT);
    const newRecord: StockOutRecord = { ...record, id: `inv-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] };
    setStoredData('rj_db_stock_out', [newRecord, ...records]);
    const products = getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS);
    record.items.forEach((item) => {
      const i = products.findIndex((p) => p.id === item.productId);
      if (i !== -1) {
        products[i].stock = Math.max(0, products[i].stock - item.quantity);
        products[i].status = products[i].stock === 0 ? 'Out of Stock' : products[i].stock <= products[i].minStock ? 'Low Stock' : 'In Stock';
      }
    });
    setStoredData('rj_db_products', products);
    return newRecord;
  },
};

// ─── Finance (localStorage — to be migrated) ──────────────────────────────
export const financeService = {
  getLabour: async (): Promise<LabourPayment[]> =>
    getStoredData<LabourPayment[]>('rj_db_labour', INITIAL_LABOUR),

  addLabour: async (labour: Omit<LabourPayment, 'id'>): Promise<LabourPayment> => {
    const list = getStoredData<LabourPayment[]>('rj_db_labour', INITIAL_LABOUR);
    const newLab: LabourPayment = { ...labour, id: `lab-${Date.now()}` };
    setStoredData('rj_db_labour', [newLab, ...list]);
    return newLab;
  },

  getExpenses: async (): Promise<ExpenseRecord[]> =>
    getStoredData<ExpenseRecord[]>('rj_db_expenses', INITIAL_EXPENSES),

  addExpense: async (expense: Omit<ExpenseRecord, 'id'>): Promise<ExpenseRecord> => {
    const list = getStoredData<ExpenseRecord[]>('rj_db_expenses', INITIAL_EXPENSES);
    const newExp: ExpenseRecord = { ...expense, id: `exp-${Date.now()}` };
    setStoredData('rj_db_expenses', [newExp, ...list]);
    return newExp;
  },

  getBankAccounts: async (): Promise<BankAccount[]> =>
    getStoredData<BankAccount[]>('rj_db_banks', INITIAL_BANK_ACCOUNTS),

  getTransactions: async (): Promise<BankTransaction[]> =>
    getStoredData<BankTransaction[]>('rj_db_transactions', INITIAL_TRANSACTIONS),
};

// ─── Database Backup ───────────────────────────────────────────────────────
export const databaseBackupService = {
  exportDatabaseJSON: (): string => {
    const data = {
      products:     localStorage.getItem('rj_db_products'),
      suppliers:    localStorage.getItem('rj_db_suppliers'),
      stockIn:      localStorage.getItem('rj_db_stock_in'),
      stockOut:     localStorage.getItem('rj_db_stock_out'),
      labour:       localStorage.getItem('rj_db_labour'),
      expenses:     localStorage.getItem('rj_db_expenses'),
      banks:        localStorage.getItem('rj_db_banks'),
      transactions: localStorage.getItem('rj_db_transactions'),
      exportedAt:   new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },
  restoreDatabaseJSON: (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products)     localStorage.setItem('rj_db_products', parsed.products);
      if (parsed.suppliers)    localStorage.setItem('rj_db_suppliers', parsed.suppliers);
      if (parsed.stockIn)      localStorage.setItem('rj_db_stock_in', parsed.stockIn);
      if (parsed.stockOut)     localStorage.setItem('rj_db_stock_out', parsed.stockOut);
      if (parsed.labour)       localStorage.setItem('rj_db_labour', parsed.labour);
      if (parsed.expenses)     localStorage.setItem('rj_db_expenses', parsed.expenses);
      if (parsed.banks)        localStorage.setItem('rj_db_banks', parsed.banks);
      if (parsed.transactions) localStorage.setItem('rj_db_transactions', parsed.transactions);
      return true;
    } catch {
      return false;
    }
  },
};
