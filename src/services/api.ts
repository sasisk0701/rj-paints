import axios from 'axios';
import { Product, Supplier, StockInRecord, StockOutRecord, LabourPayment, ExpenseRecord, BankAccount, BankTransaction } from '../types';
import { INITIAL_PRODUCTS } from '../data/paintsData';
import { INITIAL_SUPPLIERS, INITIAL_STOCK_IN, INITIAL_STOCK_OUT, INITIAL_LABOUR, INITIAL_EXPENSES, INITIAL_BANK_ACCOUNTS, INITIAL_TRANSACTIONS } from '../data/mockAdminData';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to requests if available
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('rj_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// LocalStorage Persistence Helpers for Standalone Vercel SPA mode
const getStoredData = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
    return fallback;
  }
};

const setStoredData = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error setting ${key} to localStorage`, err);
  }
};

// Initialize LocalStorage with default seeds if empty
export const initializeDatabase = () => {
  if (!localStorage.getItem('rj_db_products')) {
    setStoredData('rj_db_products', INITIAL_PRODUCTS);
  }
  if (!localStorage.getItem('rj_db_suppliers')) {
    setStoredData('rj_db_suppliers', INITIAL_SUPPLIERS);
  }
  if (!localStorage.getItem('rj_db_stock_in')) {
    setStoredData('rj_db_stock_in', INITIAL_STOCK_IN);
  }
  if (!localStorage.getItem('rj_db_stock_out')) {
    setStoredData('rj_db_stock_out', INITIAL_STOCK_OUT);
  }
  if (!localStorage.getItem('rj_db_labour')) {
    setStoredData('rj_db_labour', INITIAL_LABOUR);
  }
  if (!localStorage.getItem('rj_db_expenses')) {
    setStoredData('rj_db_expenses', INITIAL_EXPENSES);
  }
  if (!localStorage.getItem('rj_db_banks')) {
    setStoredData('rj_db_banks', INITIAL_BANK_ACCOUNTS);
  }
  if (!localStorage.getItem('rj_db_transactions')) {
    setStoredData('rj_db_transactions', INITIAL_TRANSACTIONS);
  }
};

initializeDatabase();

export const productService = {
  getProducts: async (): Promise<Product[]> => {
    return getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS);
  },
  addProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const products = getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS);
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newProduct, ...products];
    setStoredData('rj_db_products', updated);
    return newProduct;
  },
  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product> => {
    const products = getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS);
    let updatedItem: Product | null = null;
    const updated = products.map((p) => {
      if (p.id === id) {
        updatedItem = { ...p, ...updates, updatedAt: new Date().toISOString().split('T')[0] };
        return updatedItem;
      }
      return p;
    });
    setStoredData('rj_db_products', updated);
    return updatedItem || products[0];
  },
  deleteProduct: async (id: string): Promise<boolean> => {
    const products = getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS);
    const filtered = products.filter((p) => p.id !== id);
    setStoredData('rj_db_products', filtered);
    return true;
  }
};

export const supplierService = {
  getSuppliers: async (): Promise<Supplier[]> => {
    return getStoredData<Supplier[]>('rj_db_suppliers', INITIAL_SUPPLIERS);
  },
  addSupplier: async (supplier: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> => {
    const suppliers = getStoredData<Supplier[]>('rj_db_suppliers', INITIAL_SUPPLIERS);
    const newSup: Supplier = {
      ...supplier,
      id: `sup-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newSup, ...suppliers];
    setStoredData('rj_db_suppliers', updated);
    return newSup;
  },
  deleteSupplier: async (id: string): Promise<boolean> => {
    const suppliers = getStoredData<Supplier[]>('rj_db_suppliers', INITIAL_SUPPLIERS);
    const filtered = suppliers.filter((s) => s.id !== id);
    setStoredData('rj_db_suppliers', filtered);
    return true;
  }
};

export const inventoryService = {
  getStockIn: async (): Promise<StockInRecord[]> => {
    return getStoredData<StockInRecord[]>('rj_db_stock_in', INITIAL_STOCK_IN);
  },
  createStockIn: async (record: Omit<StockInRecord, 'id' | 'createdAt'>): Promise<StockInRecord> => {
    const records = getStoredData<StockInRecord[]>('rj_db_stock_in', INITIAL_STOCK_IN);
    const newRecord: StockInRecord = {
      ...record,
      id: `stk-in-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setStoredData('rj_db_stock_in', [newRecord, ...records]);

    // Auto-update Product Stock
    const products = getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS);
    record.items.forEach((item) => {
      const prodIndex = products.findIndex((p) => p.id === item.productId);
      if (prodIndex !== -1) {
        products[prodIndex].stock += item.quantity;
        if (products[prodIndex].stock > products[prodIndex].minStock) {
          products[prodIndex].status = 'In Stock';
        }
      }
    });
    setStoredData('rj_db_products', products);

    return newRecord;
  },
  getStockOut: async (): Promise<StockOutRecord[]> => {
    return getStoredData<StockOutRecord[]>('rj_db_stock_out', INITIAL_STOCK_OUT);
  },
  createStockOut: async (record: Omit<StockOutRecord, 'id' | 'createdAt'>): Promise<StockOutRecord> => {
    const records = getStoredData<StockOutRecord[]>('rj_db_stock_out', INITIAL_STOCK_OUT);
    const newRecord: StockOutRecord = {
      ...record,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setStoredData('rj_db_stock_out', [newRecord, ...records]);

    // Auto-reduce Product Stock
    const products = getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS);
    record.items.forEach((item) => {
      const prodIndex = products.findIndex((p) => p.id === item.productId);
      if (prodIndex !== -1) {
        products[prodIndex].stock = Math.max(0, products[prodIndex].stock - item.quantity);
        if (products[prodIndex].stock === 0) {
          products[prodIndex].status = 'Out of Stock';
        } else if (products[prodIndex].stock <= products[prodIndex].minStock) {
          products[prodIndex].status = 'Low Stock';
        }
      }
    });
    setStoredData('rj_db_products', products);

    return newRecord;
  }
};

export const financeService = {
  getLabour: async (): Promise<LabourPayment[]> => {
    return getStoredData<LabourPayment[]>('rj_db_labour', INITIAL_LABOUR);
  },
  addLabour: async (labour: Omit<LabourPayment, 'id'>): Promise<LabourPayment> => {
    const list = getStoredData<LabourPayment[]>('rj_db_labour', INITIAL_LABOUR);
    const newLab: LabourPayment = { ...labour, id: `lab-${Date.now()}` };
    setStoredData('rj_db_labour', [newLab, ...list]);
    return newLab;
  },
  getExpenses: async (): Promise<ExpenseRecord[]> => {
    return getStoredData<ExpenseRecord[]>('rj_db_expenses', INITIAL_EXPENSES);
  },
  addExpense: async (expense: Omit<ExpenseRecord, 'id'>): Promise<ExpenseRecord> => {
    const list = getStoredData<ExpenseRecord[]>('rj_db_expenses', INITIAL_EXPENSES);
    const newExp: ExpenseRecord = { ...expense, id: `exp-${Date.now()}` };
    setStoredData('rj_db_expenses', [newExp, ...list]);
    return newExp;
  },
  getBankAccounts: async (): Promise<BankAccount[]> => {
    return getStoredData<BankAccount[]>('rj_db_banks', INITIAL_BANK_ACCOUNTS);
  },
  getTransactions: async (): Promise<BankTransaction[]> => {
    return getStoredData<BankTransaction[]>('rj_db_transactions', INITIAL_TRANSACTIONS);
  }
};

export const databaseBackupService = {
  exportDatabaseJSON: (): string => {
    const data = {
      products: localStorage.getItem('rj_db_products'),
      suppliers: localStorage.getItem('rj_db_suppliers'),
      stockIn: localStorage.getItem('rj_db_stock_in'),
      stockOut: localStorage.getItem('rj_db_stock_out'),
      labour: localStorage.getItem('rj_db_labour'),
      expenses: localStorage.getItem('rj_db_expenses'),
      banks: localStorage.getItem('rj_db_banks'),
      transactions: localStorage.getItem('rj_db_transactions'),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  },
  restoreDatabaseJSON: (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products) localStorage.setItem('rj_db_products', parsed.products);
      if (parsed.suppliers) localStorage.setItem('rj_db_suppliers', parsed.suppliers);
      if (parsed.stockIn) localStorage.setItem('rj_db_stock_in', parsed.stockIn);
      if (parsed.stockOut) localStorage.setItem('rj_db_stock_out', parsed.stockOut);
      if (parsed.labour) localStorage.setItem('rj_db_labour', parsed.labour);
      if (parsed.expenses) localStorage.setItem('rj_db_expenses', parsed.expenses);
      if (parsed.banks) localStorage.setItem('rj_db_banks', parsed.banks);
      if (parsed.transactions) localStorage.setItem('rj_db_transactions', parsed.transactions);
      return true;
    } catch (err) {
      console.error("Invalid database backup file", err);
      return false;
    }
  }
};
