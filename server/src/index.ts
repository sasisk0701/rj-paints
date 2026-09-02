import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthRequest } from './middleware/auth';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'rj_paints_super_secret_jwt_key_2026';

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api', limiter);

async function ensureStockInSupplierNameColumn() {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'StockInRecord'
       AND COLUMN_NAME = 'supplierName'`
  );

  const count = Number(rows?.[0]?.count ?? 0);
  if (count === 0) {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE `StockInRecord` ADD COLUMN `supplierName` VARCHAR(191) NOT NULL DEFAULT \'\' AFTER `supplierId`'
    );
  }
}

// ─── Health ────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'RJ Paints & Styleo Interiors API' });
});

// ─── Auth ──────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const user = await prisma.adminUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'Login',
      module: 'Auth',
      reference: user.email,
    },
  });

  return res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  });
});

app.post('/api/auth/logout', authenticateJWT, async (req: AuthRequest, res) => {
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userName: req.user.name,
      action: 'Logout',
      module: 'Auth',
      reference: req.user.email,
    },
  });
  res.json({ message: 'Logged out successfully' });
});

// Verify token & return current user
app.get('/api/auth/me', authenticateJWT, async (req: AuthRequest, res) => {
  const user = await prisma.adminUser.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ─── Users ─────────────────────────────────────────────────────────────────
app.get('/api/admin/users', authenticateJWT, async (_req, res) => {
  const users = await prisma.adminUser.findMany({
    where: { deletedAt: null },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
});

app.post('/api/admin/users', authenticateJWT, async (req: AuthRequest, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password)
    return res.status(400).json({ error: 'email, name and password are required' });

  const exists = await prisma.adminUser.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({
    data: { email, name, password: hashed, role: 'ADMIN' },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userName: req.user.name,
      action: 'User Created',
      module: 'Administration',
      reference: email,
    },
  });

  res.status(201).json(user);
});

app.delete('/api/admin/users/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (id === req.user.id)
    return res.status(400).json({ error: 'Cannot delete your own account' });

  await prisma.adminUser.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userName: req.user.name,
      action: 'User Deleted',
      module: 'Administration',
      reference: id,
    },
  });

  res.json({ message: 'User removed' });
});

// ─── Settings ──────────────────────────────────────────────────────────────
app.get('/api/admin/settings', authenticateJWT, async (_req, res) => {
  const rows = await prisma.settings.findMany();
  // Convert array of {key,value} into a plain object
  const result = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json(result);
});

app.put('/api/admin/settings', authenticateJWT, async (req: AuthRequest, res) => {
  const updates: Record<string, string> = req.body;

  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );

  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userName: req.user.name,
      action: 'Settings Updated',
      module: 'Administration',
      reference: Object.keys(updates).join(', '),
    },
  });

  res.json({ message: 'Settings saved' });
});

// ─── Categories ──────────────────────────────────────────────────────────
app.get('/api/categories', authenticateJWT, async (req, res) => {
  const { business } = req.query as Record<string, string>;
  const where: any = { deletedAt: null };
  if (business) where.business = business.toUpperCase();
  const cats = await prisma.category.findMany({
    where,
    include: { _count: { select: { products: { where: { deletedAt: null } } } } },
    orderBy: { name: 'asc' },
  });
  res.json(cats);
});

app.post('/api/categories', authenticateJWT, async (req: AuthRequest, res) => {
  const { name, business, description, color } = req.body;
  if (!name || !business) return res.status(400).json({ error: 'name and business are required' });
  const cat = await prisma.category.create({
    data: { name, business: business.toUpperCase(), description, color: color || '#6B7280' },
  });
  await prisma.activityLog.create({
    data: { userId: req.user.id, userName: req.user.name, action: 'Category Created', module: 'Catalog', reference: name },
  });
  res.status(201).json(cat);
});

app.put('/api/categories/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const { name, description, color } = req.body;
  const cat = await prisma.category.update({
    where: { id: req.params.id },
    data: { name, description, color },
  });
  await prisma.activityLog.create({
    data: { userId: req.user.id, userName: req.user.name, action: 'Category Updated', module: 'Catalog', reference: name },
  });
  res.json(cat);
});

app.delete('/api/categories/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const count = await prisma.product.count({ where: { categoryId: req.params.id, deletedAt: null } });
  if (count > 0) return res.status(400).json({ error: `Cannot delete: ${count} products linked to this category` });
  await prisma.category.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  await prisma.activityLog.create({
    data: { userId: req.user.id, userName: req.user.name, action: 'Category Deleted', module: 'Catalog', reference: req.params.id },
  });
  res.json({ message: 'Category deleted' });
});

// ─── Products ─────────────────────────────────────────────────────────────
app.get('/api/products', authenticateJWT, async (req, res) => {
  const { business, category, status, search } = req.query as Record<string, string>;
  const where: any = { deletedAt: null };
  if (business) where.business = business.toUpperCase();
  if (category) where.categoryId = category;
  if (status)   where.status = status;
  if (search)   where.OR = [
    { name:        { contains: search } },
    { sku:         { contains: search } },
    { brand:       { contains: search } },
    { categoryName:{ contains: search } },
  ];
  const products = await prisma.product.findMany({
    where,
    include: { category: { select: { id: true, name: true, color: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(products);
});

app.get('/api/products/:id', authenticateJWT, async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  if (!product || product.deletedAt) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.post('/api/products', authenticateJWT, async (req: AuthRequest, res) => {
  const { name, categoryId, categoryName, brand, sku, barcode, description,
          purchasePrice, sellingPrice, gstRate, stock, minStock, unit, business, image } = req.body;
  if (!name || !sku || !barcode || !business)
    return res.status(400).json({ error: 'name, sku, barcode and business are required' });
  const exists = await prisma.product.findFirst({ where: { OR: [{ sku }, { barcode }] } });
  if (exists) return res.status(409).json({ error: 'SKU or Barcode already exists' });
  const status = stock <= 0 ? 'Out of Stock' : stock <= minStock ? 'Low Stock' : 'In Stock';
  const product = await prisma.product.create({
    data: { name, categoryId, categoryName: categoryName || '', brand, sku, barcode,
            description, purchasePrice: +purchasePrice, sellingPrice: +sellingPrice,
            gstRate: +(gstRate || 18), stock: +(stock || 0), minStock: +(minStock || 5),
            unit: unit || 'Piece', business: business.toUpperCase(), status, image },
  });
  await prisma.activityLog.create({
    data: { userId: req.user.id, userName: req.user.name, action: 'Product Created', module: 'Catalog', reference: sku, business: business.toLowerCase() },
  });
  res.status(201).json(product);
});

app.put('/api/products/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const { stock, minStock, ...rest } = req.body;
  const s = +(stock ?? 0), m = +(minStock ?? 5);
  const status = s <= 0 ? 'Out of Stock' : s <= m ? 'Low Stock' : 'In Stock';
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { ...rest, stock: s, minStock: m, status,
            purchasePrice: rest.purchasePrice ? +rest.purchasePrice : undefined,
            sellingPrice:  rest.sellingPrice  ? +rest.sellingPrice  : undefined,
            gstRate:       rest.gstRate       ? +rest.gstRate       : undefined },
  });
  await prisma.activityLog.create({
    data: { userId: req.user.id, userName: req.user.name, action: 'Product Updated', module: 'Catalog', reference: product.sku },
  });
  res.json(product);
});

app.delete('/api/products/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  });
  await prisma.activityLog.create({
    data: { userId: req.user.id, userName: req.user.name, action: 'Product Deleted', module: 'Catalog', reference: product.sku },
  });
  res.json({ message: 'Product deleted' });
});

// ─── Suppliers ───────────────────────────────────────────────────────────
app.get('/api/suppliers', authenticateJWT, async (req, res) => {
  const { business, search } = req.query as Record<string, string>;
  const where: any = { deletedAt: null };
  if (business) where.business = business.toUpperCase();
  if (search) where.OR = [
    { name:  { contains: search } },
    { phone: { contains: search } },
    { city:  { contains: search } },
    { gstNumber: { contains: search } },
  ];
  const suppliers = await prisma.supplier.findMany({
    where,
    orderBy: { name: 'asc' },
  });
  res.json(suppliers);
});

app.get('/api/suppliers/:id', authenticateJWT, async (req, res) => {
  const supplier = await prisma.supplier.findUnique({ where: { id: req.params.id } });
  if (!supplier || supplier.deletedAt) return res.status(404).json({ error: 'Supplier not found' });
  res.json(supplier);
});

app.post('/api/suppliers', authenticateJWT, async (req: AuthRequest, res) => {
  const { name, gstNumber, phone, email, address, city, business, outstandingBalance, notes } = req.body;
  if (!name || !gstNumber || !phone || !city)
    return res.status(400).json({ error: 'name, gstNumber, phone and city are required' });
  const exists = await prisma.supplier.findFirst({ where: { gstNumber } });
  if (exists) return res.status(409).json({ error: 'GST number already registered' });
  const supplier = await prisma.supplier.create({
    data: {
      name, gstNumber, phone, email, address, city,
      business: (business || 'PAINTS').toUpperCase() as any,
      outstandingBalance: +(outstandingBalance || 0),
      notes,
    },
  });
  await prisma.activityLog.create({
    data: { userId: req.user.id, userName: req.user.name, action: 'Supplier Created', module: 'Contacts', reference: name, business: (business || 'paints').toLowerCase() },
  });
  res.status(201).json(supplier);
});

app.put('/api/suppliers/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const { name, gstNumber, phone, email, address, city, business, outstandingBalance, notes } = req.body;
  const supplier = await prisma.supplier.update({
    where: { id: req.params.id },
    data: {
      name, gstNumber, phone, email, address, city,
      business: business ? business.toUpperCase() as any : undefined,
      outstandingBalance: outstandingBalance !== undefined ? +outstandingBalance : undefined,
      notes,
    },
  });
  await prisma.activityLog.create({
    data: { userId: req.user.id, userName: req.user.name, action: 'Supplier Updated', module: 'Contacts', reference: name },
  });
  res.json(supplier);
});

app.delete('/api/suppliers/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const supplier = await prisma.supplier.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  });
  await prisma.activityLog.create({
    data: { userId: req.user.id, userName: req.user.name, action: 'Supplier Deleted', module: 'Contacts', reference: supplier.name },
  });
  res.json({ message: 'Supplier deleted' });
});

// ─── Customers ───────────────────────────────────────────────────────────
app.get('/api/customers', authenticateJWT, async (req, res) => {
  const { business, search } = req.query as Record<string, string>;
  const where: any = { deletedAt: null };
  if (business) where.business = business.toUpperCase();
  if (search) where.OR = [
    { name:  { contains: search } },
    { phone: { contains: search } },
    { city:  { contains: search } },
    { email: { contains: search } },
  ];
  const customers = await prisma.customer.findMany({
    where,
    orderBy: { name: 'asc' },
  });
  res.json(customers);
});

app.get('/api/customers/:id', authenticateJWT, async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!customer || customer.deletedAt) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

app.post('/api/customers', authenticateJWT, async (req: AuthRequest, res) => {
  const { name, phone, email, address, city, business, creditLimit, outstandingBalance, notes } = req.body;
  if (!name || !phone || !city)
    return res.status(400).json({ error: 'name, phone and city are required' });
  const customer = await prisma.customer.create({
    data: {
      name, phone, email, address, city,
      business: (business || 'PAINTS').toUpperCase() as any,
      creditLimit: +(creditLimit || 0),
      outstandingBalance: +(outstandingBalance || 0),
      notes,
    },
  });
  await prisma.activityLog.create({
    data: { userId: req.user.id, userName: req.user.name, action: 'Customer Created', module: 'Contacts', reference: name, business: (business || 'paints').toLowerCase() },
  });
  res.status(201).json(customer);
});

app.put('/api/customers/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const { name, phone, email, address, city, business, creditLimit, outstandingBalance, notes } = req.body;
  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: {
      name, phone, email, address, city,
      business: business ? business.toUpperCase() as any : undefined,
      creditLimit: creditLimit !== undefined ? +creditLimit : undefined,
      outstandingBalance: outstandingBalance !== undefined ? +outstandingBalance : undefined,
      notes,
    },
  });
  await prisma.activityLog.create({
    data: { userId: req.user.id, userName: req.user.name, action: 'Customer Updated', module: 'Contacts', reference: name },
  });
  res.json(customer);
});

app.delete('/api/customers/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  });
  await prisma.activityLog.create({
    data: { userId: req.user.id, userName: req.user.name, action: 'Customer Deleted', module: 'Contacts', reference: customer.name },
  });
  res.json({ message: 'Customer deleted' });
});

// ─── Inventory Helpers ───────────────────────────────────────────────────
type InventoryBusiness = 'PAINTS' | 'INTERIORS' | 'BOTH';

const resolveBusinessScope = (business?: string): InventoryBusiness[] | undefined => {
  if (!business) return undefined;
  const normalized = business.toUpperCase();
  if (normalized === 'PAINTS') return ['PAINTS', 'BOTH'];
  if (normalized === 'INTERIORS') return ['INTERIORS', 'BOTH'];
  if (normalized === 'BOTH') return ['PAINTS', 'INTERIORS', 'BOTH'];
  return ['PAINTS', 'INTERIORS', 'BOTH'];
};

const monthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
};

const dayRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const formatShortDate = (value: Date | string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatCurrency = (value: number) =>
  `₹${Math.round(value).toLocaleString('en-IN')}`;

const toneForStock = (stock: number, minStock: number) => {
  if (stock <= 0) return 'danger';
  if (stock <= minStock) return 'warn';
  return 'success';
};

// ─── Inventory: Overview ────────────────────────────────────────────────
app.get('/api/inventory/overview', authenticateJWT, async (req, res) => {
  const { business } = req.query as Record<string, string>;
  const scope = resolveBusinessScope(business);
  const where: any = { deletedAt: null };
  if (scope) where.business = { in: scope };

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  const { start: monthStart, end: monthEnd } = monthRange();
  const { start: dayStart, end: dayEnd } = dayRange();

  const [stockInRecords, stockOutRecords, adjustmentLogs] = await Promise.all([
    prisma.stockInRecord.findMany({
      where: {
        createdAt: { gte: monthStart, lt: monthEnd },
        items: scope ? { some: { product: { business: { in: scope } } } } : undefined,
      },
      include: { items: { include: { product: true } } },
    }),
    prisma.stockOutRecord.findMany({
      where: {
        createdAt: { gte: monthStart, lt: monthEnd },
        items: scope ? { some: { product: { business: { in: scope } } } } : undefined,
      },
      include: { items: { include: { product: true } } },
    }),
    prisma.activityLog.findMany({
      where: {
        module: 'Inventory',
        action: 'Stock Maintenance Logged',
        createdAt: { gte: monthStart, lt: monthEnd },
        business: business ? business.toLowerCase() : undefined,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const monthInByProduct = new Map<string, number>();
  const monthOutByProduct = new Map<string, number>();
  const monthAdjByProduct = new Map<string, number>();

  stockInRecords.forEach((record) => {
    record.items.forEach((item) => {
      monthInByProduct.set(item.productId, (monthInByProduct.get(item.productId) ?? 0) + item.quantity);
    });
  });

  stockOutRecords.forEach((record) => {
    record.items.forEach((item) => {
      monthOutByProduct.set(item.productId, (monthOutByProduct.get(item.productId) ?? 0) + item.quantity);
    });
  });

  adjustmentLogs.forEach((log) => {
    try {
      const payload = JSON.parse(log.reference || '{}');
      (payload.items ?? []).forEach((item: any) => {
        const difference = Number(item.difference ?? (Number(item.physicalCount || 0) - Number(item.systemStock || 0)));
        monthAdjByProduct.set(item.productId, (monthAdjByProduct.get(item.productId) ?? 0) + difference);
      });
    } catch {
      // ignore malformed logs
    }
  });

  const rows = products.map((product) => {
    const inbound = monthInByProduct.get(product.id) ?? 0;
    const outbound = monthOutByProduct.get(product.id) ?? 0;
    const adjustment = monthAdjByProduct.get(product.id) ?? 0;
    const opening = Math.max(0, product.stock - inbound + outbound - adjustment);
    return {
      id: product.id,
      name: product.name,
      opening: String(opening),
      available: String(product.stock),
      min: String(product.minStock),
      statusTone: toneForStock(product.stock, product.minStock),
      status: product.stock <= 0 ? 'Out of Stock' : product.stock <= product.minStock ? 'Below Min' : 'Healthy',
    };
  });

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const stockValue = products.reduce((sum, product) => sum + product.stock * product.sellingPrice, 0);
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= product.minStock).length;
  const movementToday =
    (await prisma.stockInRecord.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } })) +
    (await prisma.stockOutRecord.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } })) +
    (await prisma.activityLog.count({ where: { module: 'Inventory', action: 'Stock Maintenance Logged', createdAt: { gte: dayStart, lt: dayEnd } } }));

  res.json({
    kpis: [
      { label: 'Current Stock (units)', value: totalStock.toLocaleString('en-IN'), delta: `${business ? business : 'All'} business`, deltaTone: 'neutral' },
      { label: 'Stock Value', value: formatCurrency(stockValue), delta: `▲ ${lowStock} low stock SKUs`, deltaTone: 'up' },
      { label: 'Low Stock SKUs', value: String(lowStock), delta: 'below minimum level', deltaTone: 'down' },
      { label: 'Stock Movements Today', value: String(movementToday), delta: 'in + out + adjustments', deltaTone: 'neutral' },
    ],
    pagination: `Showing 1–${rows.length} of ${products.length} SKUs`,
    rows,
  });
});

// ─── Inventory: Stock In ────────────────────────────────────────────────
app.get('/api/inventory/stock-in', authenticateJWT, async (req, res) => {
  const { business } = req.query as Record<string, string>;
  const scope = resolveBusinessScope(business);

  const records = await prisma.stockInRecord.findMany({
    where: scope
      ? { items: { some: { product: { business: { in: scope } } } } }
      : undefined,
    include: {
      supplier: true,
      items: { include: { product: true } },
    },
    orderBy: { purchaseDate: 'desc' },
  });

  const rows = records.map((record) => {
    const totalQty = record.items.reduce((sum, item) => sum + item.quantity, 0);
    const productSummary = record.items.length === 1
      ? record.items[0].product.name
      : `${record.items[0].product.name} +${record.items.length - 1} more`;

    return {
      id: record.id,
      ref: record.invoiceNo,
      date: formatShortDate(record.purchaseDate),
      source: record.notes?.toLowerCase().includes('opening') ? 'Opening Stock'
        : record.notes?.toLowerCase().includes('return') ? 'Supplier Return'
        : 'Purchase',
      party: record.supplier?.name || '—',
      product: productSummary,
      qty: String(totalQty),
      amount: formatCurrency(record.grandTotal),
      reference: record.invoiceNo,
    };
  });

  const monthStart = monthRange().start;
  const monthEnd = monthRange().end;
  const monthRecords = records.filter((record) => record.purchaseDate >= monthStart && record.purchaseDate < monthEnd);
  const monthGrandTotal = monthRecords.reduce((sum, record) => sum + record.grandTotal, 0);
  const monthQty = monthRecords.reduce((sum, record) => sum + record.items.reduce((q, item) => q + item.quantity, 0), 0);
  const uniqueSuppliers = new Set(records.map((record) => record.supplierId));

  res.json({
    kpis: [
      { label: 'Stock In (this month)', value: `${monthRecords.length} entries`, delta: formatCurrency(monthGrandTotal) + ' received', deltaTone: 'neutral' },
      { label: 'Items Received', value: String(monthQty), delta: `${uniqueSuppliers.size} suppliers`, deltaTone: 'neutral' },
      { label: 'Average Entry', value: formatCurrency(monthRecords.length ? monthGrandTotal / monthRecords.length : 0), delta: 'per stock in record', deltaTone: 'neutral' },
      { label: 'Total Entries', value: String(records.length), delta: 'all time', deltaTone: 'neutral' },
    ],
    pagination: `Showing 1–${rows.length} of ${records.length} entries`,
    rows,
  });
});

app.post('/api/inventory/stock-in', authenticateJWT, async (req: AuthRequest, res) => {
  const {
    invoiceNo,
    supplierId,
    supplierName,
    purchaseDate,
    paymentMode,
    notes,
    items,
  } = req.body;

  if (!invoiceNo || (!supplierId && !supplierName) || !purchaseDate || !paymentMode || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'invoiceNo, supplier or supplierId, purchaseDate, paymentMode and items are required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let resolvedSupplierId = supplierId || null;
      if (!resolvedSupplierId) {
        const existingSupplier = await tx.supplier.findFirst({ where: { name: supplierName } });
        if (existingSupplier) {
          resolvedSupplierId = existingSupplier.id;
        } else {
          const createdSupplier = await tx.supplier.create({
            data: {
              name: supplierName,
              gstNumber: `TEMP-${Date.now()}`,
              phone: 'N/A',
              email: null,
              address: null,
              city: 'Unknown',
              outstandingBalance: 0,
            },
          });
          resolvedSupplierId = createdSupplier.id;
        }
      }

      const record = await tx.stockInRecord.create({
        data: {
          invoiceNo,
          supplier: { connect: { id: resolvedSupplierId } },
          supplierName,
          purchaseDate: new Date(purchaseDate),
          subtotal: 0,
          totalGst: 0,
          grandTotal: 0,
          paymentMode,
          notes,
        },
      });

      let subtotal = 0;
      let totalGst = 0;
      let grandTotal = 0;

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.deletedAt) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const quantity = Number(item.quantity || 0);
        const purchasePrice = Number(item.purchasePrice ?? product.purchasePrice ?? 0);
        const gstRate = Number(item.gstRate ?? 18);
        const lineSubtotal = quantity * purchasePrice;
        const lineGst = lineSubtotal * gstRate / 100;
        const lineTotal = lineSubtotal + lineGst;

        subtotal += lineSubtotal;
        totalGst += lineGst;
        grandTotal += lineTotal;

        await tx.stockInItem.create({
          data: {
            stockInId: record.id,
            productId: product.id,
            quantity,
            purchasePrice,
            gstRate,
            total: lineTotal,
          },
        });

        const nextStock = product.stock + quantity;
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: nextStock,
            status: nextStock <= 0 ? 'Out of Stock' : nextStock <= product.minStock ? 'Low Stock' : 'In Stock',
          },
        });
      }

      const updated = await tx.stockInRecord.update({
        where: { id: record.id },
        data: { subtotal, totalGst, grandTotal },
        include: {
          supplier: true,
          items: { include: { product: true } },
        },
      });

      return updated;
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        userName: req.user.name,
        action: 'Stock In Created',
        module: 'Inventory',
        reference: result.invoiceNo,
      },
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (String(error?.message || '').includes('Unique constraint')) {
      return res.status(409).json({ error: 'Invoice number already exists' });
    }
    res.status(400).json({ error: error?.message || 'Failed to create stock in record' });
  }
});

// ─── Inventory: Stock Out ───────────────────────────────────────────────
app.get('/api/inventory/stock-out', authenticateJWT, async (req, res) => {
  const { business } = req.query as Record<string, string>;
  const scope = resolveBusinessScope(business);

  const records = await prisma.stockOutRecord.findMany({
    where: scope
      ? { items: { some: { product: { business: { in: scope } } } } }
      : undefined,
    include: { items: { include: { product: true } } },
    orderBy: { saleDate: 'desc' },
  });

  const rows = records.map((record) => {
    const totalQty = record.items.reduce((sum, item) => sum + item.quantity, 0);
    const productSummary = record.items.length === 1
      ? record.items[0].product.name
      : `${record.items[0].product.name} +${record.items.length - 1} more`;

    return {
      id: record.id,
      ref: record.invoiceNo,
      date: formatShortDate(record.saleDate),
      source: record.notes?.toLowerCase().includes('damage') ? 'Damaged Stock'
        : record.notes?.toLowerCase().includes('issue') ? 'Material Issue'
        : 'Sales',
      party: record.customerName || '—',
      product: productSummary,
      qty: String(totalQty),
      amount: formatCurrency(record.grandTotal),
    };
  });

  const monthStart = monthRange().start;
  const monthEnd = monthRange().end;
  const monthRecords = records.filter((record) => record.saleDate >= monthStart && record.saleDate < monthEnd);
  const monthGrandTotal = monthRecords.reduce((sum, record) => sum + record.grandTotal, 0);
  const monthQty = monthRecords.reduce((sum, record) => sum + record.items.reduce((q, item) => q + item.quantity, 0), 0);

  res.json({
    kpis: [
      { label: 'Stock Out (this month)', value: `${monthRecords.length} entries`, delta: formatCurrency(monthGrandTotal) + ' dispatched', deltaTone: 'neutral' },
      { label: 'Items Dispatched', value: String(monthQty), delta: 'total quantity moved', deltaTone: 'neutral' },
      { label: 'Average Entry', value: formatCurrency(monthRecords.length ? monthGrandTotal / monthRecords.length : 0), delta: 'per stock out record', deltaTone: 'neutral' },
      { label: 'Total Entries', value: String(records.length), delta: 'all time', deltaTone: 'neutral' },
    ],
    pagination: `Showing 1–${rows.length} of ${records.length} entries`,
    rows,
  });
});

app.post('/api/inventory/stock-out', authenticateJWT, async (req: AuthRequest, res) => {
  const {
    invoiceNo,
    customerName,
    customerPhone,
    saleDate,
    paymentMode,
    notes,
    items,
  } = req.body;

  if (!invoiceNo || !customerName || !customerPhone || !saleDate || !paymentMode || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'invoiceNo, customerName, customerPhone, saleDate, paymentMode and items are required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const productIds = items.map((item: any) => item.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(products.map((product) => [product.id, product]));

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product || product.deletedAt) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        const quantity = Number(item.quantity || 0);
        if (quantity > product.stock) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
      }

      const record = await tx.stockOutRecord.create({
        data: {
          invoiceNo,
          customerName,
          customerPhone,
          saleDate: new Date(saleDate),
          subtotal: 0,
          discountTotal: 0,
          totalGst: 0,
          grandTotal: 0,
          paymentMode,
          notes,
          items: {
            create: [],
          },
        },
      });

      let subtotal = 0;
      let discountTotal = 0;
      let totalGst = 0;
      let grandTotal = 0;

      for (const item of items) {
        const product = productMap.get(item.productId)!;
        const quantity = Number(item.quantity || 0);
        const sellingPrice = Number(item.sellingPrice || product.sellingPrice || 0);
        const discount = Number(item.discount || 0);
        const gstRate = Number(item.gstRate ?? product.gstRate ?? 18);
        const lineSubtotal = quantity * sellingPrice;
        const lineTaxable = Math.max(0, lineSubtotal - discount);
        const lineGst = lineTaxable * gstRate / 100;
        const lineTotal = lineTaxable + lineGst;

        subtotal += lineSubtotal;
        discountTotal += discount;
        totalGst += lineGst;
        grandTotal += lineTotal;

        await tx.stockOutItem.create({
          data: {
            stockOutId: record.id,
            productId: product.id,
            quantity,
            sellingPrice,
            discount,
            gstRate,
            total: lineTotal,
          },
        });

        const nextStock = Math.max(0, product.stock - quantity);
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: nextStock,
            status: nextStock <= 0 ? 'Out of Stock' : nextStock <= product.minStock ? 'Low Stock' : 'In Stock',
          },
        });
      }

      return tx.stockOutRecord.update({
        where: { id: record.id },
        data: { subtotal, discountTotal, totalGst, grandTotal },
        include: {
          items: { include: { product: true } },
        },
      });
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        userName: req.user.name,
        action: 'Stock Out Created',
        module: 'Inventory',
        reference: result.invoiceNo,
      },
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (String(error?.message || '').includes('Unique constraint')) {
      return res.status(409).json({ error: 'Invoice number already exists' });
    }
    res.status(400).json({ error: error?.message || 'Failed to create stock out record' });
  }
});

// ─── Inventory: Maintenance / Physical Count ────────────────────────────
app.get('/api/inventory/maintenance', authenticateJWT, async (req, res) => {
  const { business } = req.query as Record<string, string>;
  const logs = await prisma.activityLog.findMany({
    where: {
      module: 'Inventory',
      action: 'Stock Maintenance Logged',
      business: business ? business.toLowerCase() : undefined,
    },
    orderBy: { createdAt: 'desc' },
  });

  const parsedRecords = logs
    .map((log) => {
      try {
        return JSON.parse(log.reference || '{}');
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Array<{
      referenceNo: string;
      adjustmentDate: string;
      notes?: string;
      items: Array<{
        productId: string;
        productName?: string;
        systemStock?: number;
        physicalCount?: number;
        difference?: number;
      }>;
    }>;

  const rows = parsedRecords.map((record) => {
    const first = record.items[0];
    const totalDiff = record.items.reduce((sum, item) => sum + Math.abs(Number(item.difference ?? (Number(item.physicalCount || 0) - Number(item.systemStock || 0)))), 0);
    const totalSystem = record.items.reduce((sum, item) => sum + Number(item.systemStock ?? 0), 0);
    const totalCounted = record.items.reduce((sum, item) => sum + Number(item.physicalCount ?? 0), 0);
    return {
      id: record.referenceNo,
      name: first?.productName ?? first?.productId ?? record.referenceNo,
      referenceNo: record.referenceNo,
      system: `System: ${totalSystem}`,
      counted: `Counted: ${totalCounted}`,
      diff: record.items.reduce((sum, item) => sum + Number(item.difference ?? (Number(item.physicalCount || 0) - Number(item.systemStock || 0))), 0) > 0
        ? `+${record.items.reduce((sum, item) => sum + Number(item.difference ?? (Number(item.physicalCount || 0) - Number(item.systemStock || 0))), 0)}`
        : String(record.items.reduce((sum, item) => sum + Number(item.difference ?? (Number(item.physicalCount || 0) - Number(item.systemStock || 0))), 0)),
      statusTone: record.items.reduce((sum, item) => sum + Number(item.difference ?? (Number(item.physicalCount || 0) - Number(item.systemStock || 0))), 0) > 0 ? 'success' : record.items.reduce((sum, item) => sum + Number(item.difference ?? (Number(item.physicalCount || 0) - Number(item.systemStock || 0))), 0) < 0 ? 'danger' : 'neutral',
      status: record.items.reduce((sum, item) => sum + Number(item.difference ?? (Number(item.physicalCount || 0) - Number(item.systemStock || 0))), 0) > 0 ? 'Surplus' : record.items.reduce((sum, item) => sum + Number(item.difference ?? (Number(item.physicalCount || 0) - Number(item.systemStock || 0))), 0) < 0 ? 'Shortage' : 'Balanced',
      notes: record.notes ?? '',
      itemName: first?.productName ?? '—',
      date: formatShortDate(record.adjustmentDate),
    };
  });

  const totalRecords = parsedRecords.length;
  const shortageCount = parsedRecords.reduce((sum, record) => sum + record.items.filter((item) => Number(item.difference ?? (Number(item.physicalCount || 0) - Number(item.systemStock || 0))) < 0).length, 0);
  const surplusCount = parsedRecords.reduce((sum, record) => sum + record.items.filter((item) => Number(item.difference ?? (Number(item.physicalCount || 0) - Number(item.systemStock || 0))) > 0).length, 0);
  const totalDifference = parsedRecords.reduce((sum, record) => sum + record.items.reduce((r, item) => r + Math.abs(Number(item.difference ?? (Number(item.physicalCount || 0) - Number(item.systemStock || 0)))), 0), 0);

  res.json({
    kpis: [
      { label: 'Pending Verifications', value: String(totalRecords), delta: 'logged cycles', deltaTone: 'down' },
      { label: 'Stock Differences Found', value: String(shortageCount + surplusCount), delta: 'counted items', deltaTone: 'neutral' },
      { label: 'Absolute Variance', value: String(totalDifference), delta: 'units across records', deltaTone: 'neutral' },
      { label: 'Corrections Applied', value: String(surplusCount + shortageCount), delta: 'auto-adjusted', deltaTone: 'neutral' },
    ],
    pagination: `Showing 1–${rows.length} of ${parsedRecords.length} cycles`,
    rows,
  });
});

app.post('/api/inventory/maintenance', authenticateJWT, async (req: AuthRequest, res) => {
  const { referenceNo, adjustmentDate, notes, business, items } = req.body;

  if (!referenceNo || !adjustmentDate || !business || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'referenceNo, adjustmentDate, business and items are required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const productIds = items.map((item: any) => item.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(products.map((product) => [product.id, product]));
      const payloadItems: Array<{
        productId: string;
        productName: string;
        systemStock: number;
        physicalCount: number;
        difference: number;
        notes?: string;
      }> = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product || product.deletedAt) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        const systemStock = Number(item.systemStock ?? product.stock);
        const physicalCount = Number(item.physicalCount ?? 0);
        const difference = physicalCount - systemStock;

        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: physicalCount,
            status: toneForStock(physicalCount, product.minStock) === 'danger'
              ? 'Out of Stock'
              : physicalCount <= product.minStock
                ? 'Low Stock'
              : 'In Stock',
          },
        });

        payloadItems.push({
          productId: product.id,
          productName: product.name,
          systemStock,
          physicalCount,
          difference,
          notes: item.notes ?? undefined,
        });
      }

      return tx.activityLog.create({
        data: {
          userId: req.user.id,
          userName: req.user.name,
          action: 'Stock Maintenance Logged',
          module: 'Inventory',
          business: business.toLowerCase(),
          reference: JSON.stringify({
            referenceNo,
            adjustmentDate,
            notes,
            business: business.toLowerCase(),
            items: payloadItems,
          }),
        },
      });
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to save stock maintenance record' });
  }
});

// ─── Purchases ──────────────────────────────────────────────────────────────
app.get('/api/purchases', authenticateJWT, async (req, res) => {
  const { business, search, status } = req.query as Record<string, string>;
  const where: any = { deletedAt: null };
  if (business) where.business = business.toUpperCase();
  if (status)   where.status   = status;
  if (search)   where.OR = [
    { poNumber:     { contains: search } },
    { supplierName: { contains: search } },
  ];
  const purchases = await prisma.purchase.findMany({
    where,
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const result = purchases.map((p) => ({
    ...p,
    items: p.items.map((i) => ({
      id: i.id,
      productId:     i.productId,
      productName:   i.productName,
      quantity:      i.quantity,
      purchasePrice: i.purchasePrice,
      gstRate:       i.gstRate,
      amount:        i.amount,
    })),
  }));
  res.json(result);
});

app.post('/api/purchases', authenticateJWT, async (req: AuthRequest, res) => {
  const { poNumber, supplierId, supplierName, purchaseDate, paymentMode, status, notes, business, items } = req.body;
  if (!poNumber || !supplierName || !purchaseDate || !paymentMode || !Array.isArray(items) || !items.length)
    return res.status(400).json({ error: 'poNumber, supplierName, purchaseDate, paymentMode and items are required' });
  try {
    let subtotal = 0, gstAmount = 0, totalAmount = 0;
    const itemsData = items.map((item: any) => {
      const qty   = Number(item.quantity);
      const price = Number(item.purchasePrice);
      const gst   = Number(item.gstRate ?? 18);
      const lineSubtotal = qty * price;
      const lineGst      = lineSubtotal * gst / 100;
      subtotal    += lineSubtotal;
      gstAmount   += lineGst;
      totalAmount += lineSubtotal + lineGst;
      return { productId: item.productId, productName: item.productName ?? '', quantity: qty, purchasePrice: price, gstRate: gst, amount: lineSubtotal + lineGst };
    });
    const purchase = await prisma.purchase.create({
      data: {
        poNumber, supplierName,
        supplierId: supplierId || null,
        purchaseDate: new Date(purchaseDate),
        paymentMode,
        status: status || 'Pending',
        subtotal, gstAmount, totalAmount,
        notes: notes || null,
        business: (business || 'PAINTS').toUpperCase() as any,
        items: { create: itemsData },
      },
      include: { items: true },
    });
    await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Purchase Created', module: 'Trade', reference: poNumber, business: (business || 'paints').toLowerCase() } });
    res.status(201).json(purchase);
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ error: 'PO number already exists' });
    res.status(400).json({ error: err?.message || 'Failed to create purchase' });
  }
});

app.put('/api/purchases/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const { supplierId, supplierName, purchaseDate, paymentMode, status, notes, items } = req.body;
  try {
    let subtotal = 0, gstAmount = 0, totalAmount = 0;
    const itemsData = items?.map((item: any) => {
      const qty   = Number(item.quantity);
      const price = Number(item.purchasePrice);
      const gst   = Number(item.gstRate ?? 18);
      const lineSubtotal = qty * price;
      const lineGst      = lineSubtotal * gst / 100;
      subtotal    += lineSubtotal;
      gstAmount   += lineGst;
      totalAmount += lineSubtotal + lineGst;
      return { productId: item.productId, productName: item.productName ?? '', quantity: qty, purchasePrice: price, gstRate: gst, amount: lineSubtotal + lineGst };
    });
    const purchase = await prisma.purchase.update({
      where: { id: req.params.id },
      data: {
        supplierId: supplierId || null,
        supplierName, paymentMode, status,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        notes: notes || null,
        ...(itemsData ? { subtotal, gstAmount, totalAmount, items: { deleteMany: {}, create: itemsData } } : {}),
      },
      include: { items: true },
    });
    await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Purchase Updated', module: 'Trade', reference: purchase.poNumber } });
    res.json(purchase);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update purchase' });
  }
});

app.delete('/api/purchases/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const purchase = await prisma.purchase.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Purchase Deleted', module: 'Trade', reference: purchase.poNumber } });
  res.json({ message: 'Purchase deleted' });
});

// ─── Sales ────────────────────────────────────────────────────────────────────
app.get('/api/sales', authenticateJWT, async (req, res) => {
  const { business, search, status } = req.query as Record<string, string>;
  const where: any = { deletedAt: null };
  if (business) where.business = business.toUpperCase();
  if (status)   where.status   = status;
  if (search)   where.OR = [
    { invoiceNumber: { contains: search } },
    { customerName:  { contains: search } },
    { customerPhone: { contains: search } },
  ];
  const sales = await prisma.sale.findMany({
    where,
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const result = sales.map((s) => ({
    ...s,
    items: s.items.map((i) => ({
      id: i.id,
      productId:    i.productId,
      productName:  i.productName,
      quantity:     i.quantity,
      sellingPrice: i.sellingPrice,
      discount:     i.discount,
      gstRate:      i.gstRate,
      amount:       i.amount,
    })),
  }));
  res.json(result);
});

app.post('/api/sales', authenticateJWT, async (req: AuthRequest, res) => {
  const { invoiceNumber, customerId, customerName, customerPhone, saleDate, paymentMode, status, notes, business, items } = req.body;
  if (!invoiceNumber || !customerName || !customerPhone || !saleDate || !paymentMode || !Array.isArray(items) || !items.length)
    return res.status(400).json({ error: 'invoiceNumber, customerName, customerPhone, saleDate, paymentMode and items are required' });
  try {
    let subtotal = 0, discountAmount = 0, gstAmount = 0, totalAmount = 0;
    const itemsData = items.map((item: any) => {
      const qty   = Number(item.quantity);
      const price = Number(item.sellingPrice);
      const disc  = Number(item.discount ?? 0);
      const gst   = Number(item.gstRate ?? 18);
      const lineSubtotal = qty * price;
      const lineTaxable  = Math.max(0, lineSubtotal - disc);
      const lineGst      = lineTaxable * gst / 100;
      subtotal       += lineSubtotal;
      discountAmount += disc;
      gstAmount      += lineGst;
      totalAmount    += lineTaxable + lineGst;
      return { productId: item.productId, productName: item.productName ?? '', quantity: qty, sellingPrice: price, discount: disc, gstRate: gst, amount: lineTaxable + lineGst };
    });
    const sale = await prisma.sale.create({
      data: {
        invoiceNumber, customerName, customerPhone,
        customerId: customerId || null,
        saleDate: new Date(saleDate),
        paymentMode,
        status: status || 'Paid',
        subtotal, discountAmount, gstAmount, totalAmount,
        notes: notes || null,
        business: (business || 'PAINTS').toUpperCase() as any,
        items: { create: itemsData },
      },
      include: { items: true },
    });
    await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Sale Created', module: 'Trade', reference: invoiceNumber, business: (business || 'paints').toLowerCase() } });
    res.status(201).json(sale);
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ error: 'Invoice number already exists' });
    res.status(400).json({ error: err?.message || 'Failed to create sale' });
  }
});

app.put('/api/sales/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const { customerId, customerName, customerPhone, saleDate, paymentMode, status, notes, items } = req.body;
  try {
    let subtotal = 0, discountAmount = 0, gstAmount = 0, totalAmount = 0;
    const itemsData = items?.map((item: any) => {
      const qty   = Number(item.quantity);
      const price = Number(item.sellingPrice);
      const disc  = Number(item.discount ?? 0);
      const gst   = Number(item.gstRate ?? 18);
      const lineSubtotal = qty * price;
      const lineTaxable  = Math.max(0, lineSubtotal - disc);
      const lineGst      = lineTaxable * gst / 100;
      subtotal       += lineSubtotal;
      discountAmount += disc;
      gstAmount      += lineGst;
      totalAmount    += lineTaxable + lineGst;
      return { productId: item.productId, productName: item.productName ?? '', quantity: qty, sellingPrice: price, discount: disc, gstRate: gst, amount: lineTaxable + lineGst };
    });
    const sale = await prisma.sale.update({
      where: { id: req.params.id },
      data: {
        customerId: customerId || null,
        customerName, customerPhone, paymentMode, status,
        saleDate: saleDate ? new Date(saleDate) : undefined,
        notes: notes || null,
        ...(itemsData ? { subtotal, discountAmount, gstAmount, totalAmount, items: { deleteMany: {}, create: itemsData } } : {}),
      },
      include: { items: true },
    });
    await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Sale Updated', module: 'Trade', reference: sale.invoiceNumber } });
    res.json(sale);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update sale' });
  }
});

app.delete('/api/sales/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const sale = await prisma.sale.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Sale Deleted', module: 'Trade', reference: sale.invoiceNumber } });
  res.json({ message: 'Sale deleted' });
});

// ─── Quotations ───────────────────────────────────────────────────────────────
app.get('/api/quotations', authenticateJWT, async (req, res) => {
  const { business, search, status } = req.query as Record<string, string>;
  const where: any = { deletedAt: null };
  if (business) where.business = business.toUpperCase();
  if (status)   where.status   = status;
  if (search)   where.OR = [
    { quoteNumber:   { contains: search } },
    { customerName:  { contains: search } },
    { customerPhone: { contains: search } },
  ];
  const quotations = await prisma.quotation.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(quotations);
});

app.post('/api/quotations', authenticateJWT, async (req: AuthRequest, res) => {
  const { quoteNumber, customerName, customerPhone, customerEmail, validUntil, status, notes, terms, business, items } = req.body;
  if (!quoteNumber || !customerName || !customerPhone || !validUntil || !Array.isArray(items) || !items.length)
    return res.status(400).json({ error: 'quoteNumber, customerName, customerPhone, validUntil and items are required' });
  try {
    let subtotal = 0, discountAmount = 0, gstAmount = 0, totalAmount = 0;
    const itemsData = items.map((item: any) => {
      const qty   = Number(item.quantity);
      const price = Number(item.unitPrice);
      const disc  = Number(item.discount ?? 0);
      const gst   = Number(item.gstRate ?? 18);
      const lineSubtotal = qty * price;
      const lineTaxable  = Math.max(0, lineSubtotal - disc);
      const lineGst      = lineTaxable * gst / 100;
      subtotal       += lineSubtotal;
      discountAmount += disc;
      gstAmount      += lineGst;
      totalAmount    += lineTaxable + lineGst;
      return { productId: item.productId || null, description: item.description, quantity: qty, unitPrice: price, discount: disc, gstRate: gst, amount: lineTaxable + lineGst };
    });
    const quotation = await prisma.quotation.create({
      data: {
        quoteNumber, customerName, customerPhone,
        customerEmail: customerEmail || null,
        validUntil: new Date(validUntil),
        status: status || 'Draft',
        subtotal, discountAmount, gstAmount, totalAmount,
        notes: notes || null,
        terms: terms || null,
        business: (business || 'PAINTS').toUpperCase() as any,
        items: { create: itemsData },
      },
      include: { items: true },
    });
    await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Quotation Created', module: 'Trade', reference: quoteNumber, business: (business || 'paints').toLowerCase() } });
    res.status(201).json(quotation);
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ error: 'Quote number already exists' });
    res.status(400).json({ error: err?.message || 'Failed to create quotation' });
  }
});

app.put('/api/quotations/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const { customerName, customerPhone, customerEmail, validUntil, status, notes, terms, items } = req.body;
  try {
    let subtotal = 0, discountAmount = 0, gstAmount = 0, totalAmount = 0;
    const itemsData = items?.map((item: any) => {
      const qty   = Number(item.quantity);
      const price = Number(item.unitPrice);
      const disc  = Number(item.discount ?? 0);
      const gst   = Number(item.gstRate ?? 18);
      const lineSubtotal = qty * price;
      const lineTaxable  = Math.max(0, lineSubtotal - disc);
      const lineGst      = lineTaxable * gst / 100;
      subtotal       += lineSubtotal;
      discountAmount += disc;
      gstAmount      += lineGst;
      totalAmount    += lineTaxable + lineGst;
      return { productId: item.productId || null, description: item.description, quantity: qty, unitPrice: price, discount: disc, gstRate: gst, amount: lineTaxable + lineGst };
    });
    const quotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: {
        customerName, customerPhone,
        customerEmail: customerEmail || null,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        status, notes: notes || null, terms: terms || null,
        ...(itemsData ? { subtotal, discountAmount, gstAmount, totalAmount, items: { deleteMany: {}, create: itemsData } } : {}),
      },
      include: { items: true },
    });
    await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Quotation Updated', module: 'Trade', reference: quotation.quoteNumber } });
    res.json(quotation);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update quotation' });
  }
});

app.delete('/api/quotations/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const quotation = await prisma.quotation.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Quotation Deleted', module: 'Trade', reference: quotation.quoteNumber } });
  res.json({ message: 'Quotation deleted' });
});

// Convert Quotation → Sale
app.post('/api/quotations/:id/convert-to-sale', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!quotation || quotation.deletedAt)
      return res.status(404).json({ error: 'Quotation not found' });
    if (quotation.status === 'Converted')
      return res.status(400).json({ error: 'Quotation already converted to sale' });

    const invoiceNumber = `SO-${Date.now()}`;
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerName:  quotation.customerName,
          customerPhone: quotation.customerPhone,
          saleDate:      new Date(),
          paymentMode:   'Credit',
          status:        'Pending',
          subtotal:      quotation.subtotal,
          discountAmount: quotation.discountAmount,
          gstAmount:     quotation.gstAmount,
          totalAmount:   quotation.totalAmount,
          notes:         `Converted from quotation ${quotation.quoteNumber}`,
          business:      quotation.business,
          items: {
            create: quotation.items.map((i) => ({
              productId:    i.productId ?? '',
              productName:  i.description,
              quantity:     i.quantity,
              sellingPrice: i.unitPrice,
              discount:     i.discount,
              gstRate:      i.gstRate,
              amount:       i.amount,
            })),
          },
        },
        include: { items: true },
      });
      await tx.quotation.update({ where: { id: quotation.id }, data: { status: 'Converted' } });
      return newSale;
    });

    await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Quotation Converted to Sale', module: 'Trade', reference: `${quotation.quoteNumber} → ${invoiceNumber}` } });
    res.status(201).json(sale);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to convert quotation' });
  }
});

// ─── Expenses ────────────────────────────────────────────────────────────────
app.get('/api/expenses', authenticateJWT, async (req, res) => {
  const { business, category, search, from, to } = req.query as Record<string, string>;
  const where: any = {};
  if (business) where.business = business.toUpperCase();
  if (category) where.category = category;
  if (search) where.OR = [
    { title:    { contains: search } },
    { category: { contains: search } },
    { remarks:  { contains: search } },
  ];
  if (from || to) {
    where.expenseDate = {};
    if (from) where.expenseDate.gte = new Date(from);
    if (to)   where.expenseDate.lte = new Date(to);
  }
  const expenses = await prisma.expense.findMany({ where, orderBy: { expenseDate: 'desc' } });
  const { start: monthStart, end: monthEnd } = monthRange();
  const monthExpenses = expenses.filter(e => e.expenseDate >= monthStart && e.expenseDate < monthEnd);
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const categoryTotals = monthExpenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] ?? 0) + e.amount; return acc; }, {} as Record<string, number>);
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  res.json({
    kpis: [
      { label: 'Expenses (this month)', value: formatCurrency(monthTotal), delta: `${monthExpenses.length} entries`, deltaTone: 'neutral' },
      { label: 'Top Category', value: topCategory?.[0] ?? '—', delta: topCategory ? formatCurrency(topCategory[1]) : '—', deltaTone: 'neutral' },
      { label: 'Total Entries', value: String(expenses.length), delta: 'all time', deltaTone: 'neutral' },
      { label: 'Avg per Entry', value: formatCurrency(expenses.length ? expenses.reduce((s, e) => s + e.amount, 0) / expenses.length : 0), delta: 'all time average', deltaTone: 'neutral' },
    ],
    rows: expenses.map(e => ({
      id: e.id,
      date: formatShortDate(e.expenseDate),
      category: e.category,
      title: e.title,
      paymentMode: e.paymentMode,
      amount: formatCurrency(e.amount),
      amountRaw: e.amount,
      remarks: e.remarks ?? '',
    })),
    pagination: `Showing 1–${expenses.length} of ${expenses.length} entries`,
  });
});

app.post('/api/expenses', authenticateJWT, async (req: AuthRequest, res) => {
  const { category, title, amount, paymentMode, expenseDate, remarks, business } = req.body;
  if (!category || !title || !amount || !paymentMode || !expenseDate)
    return res.status(400).json({ error: 'category, title, amount, paymentMode and expenseDate are required' });
  const expense = await prisma.expense.create({
    data: { category, title, amount: +amount, paymentMode, expenseDate: new Date(expenseDate), remarks: remarks || null, business: (business || 'PAINTS').toUpperCase() as any },
  });
  await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Expense Created', module: 'Finance', reference: title, business: (business || 'paints').toLowerCase() } });
  res.status(201).json(expense);
});

app.put('/api/expenses/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const { category, title, amount, paymentMode, expenseDate, remarks } = req.body;
  const expense = await prisma.expense.update({
    where: { id: req.params.id },
    data: { category, title, amount: amount !== undefined ? +amount : undefined, paymentMode, expenseDate: expenseDate ? new Date(expenseDate) : undefined, remarks: remarks ?? null },
  });
  await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Expense Updated', module: 'Finance', reference: title } });
  res.json(expense);
});

app.delete('/api/expenses/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const expense = await prisma.expense.delete({ where: { id: req.params.id } });
  await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Expense Deleted', module: 'Finance', reference: expense.title } });
  res.json({ message: 'Expense deleted' });
});

// ─── Reports ──────────────────────────────────────────────────────────────────
app.get('/api/reports/:type', authenticateJWT, async (req, res) => {
  const { type } = req.params;
  const { business, from, to } = req.query as Record<string, string>;
  const dateFilter = (field: string) => {
    const f: any = {};
    if (from) f.gte = new Date(from);
    if (to)   f.lte = new Date(to);
    return Object.keys(f).length ? { [field]: f } : {};
  };

  try {
    switch (type) {
      case 'stock': {
        const where: any = { deletedAt: null };
        if (business) where.business = { in: resolveBusinessScope(business) };
        const products = await prisma.product.findMany({ where, orderBy: { name: 'asc' } });
        return res.json({
          title: 'Current Stock Report',
          columns: ['Product', 'SKU', 'Brand', 'Stock', 'Min Stock', 'Status', 'Value'],
          rows: products.map(p => [p.name, p.sku, p.brand, String(p.stock), String(p.minStock), p.status, formatCurrency(p.stock * p.sellingPrice)]),
          summary: { 'Total SKUs': products.length, 'Total Stock Value': formatCurrency(products.reduce((s, p) => s + p.stock * p.sellingPrice, 0)), 'Low Stock Items': products.filter(p => p.stock > 0 && p.stock <= p.minStock).length },
        });
      }
      case 'stock-in': {
        const records = await prisma.stockInRecord.findMany({
          where: { ...dateFilter('purchaseDate') },
          include: { items: { include: { product: true } } },
          orderBy: { purchaseDate: 'desc' },
        });
        return res.json({
          title: 'Stock In Report',
          columns: ['Date', 'Invoice No', 'Supplier', 'Items', 'Total Amount'],
          rows: records.map(r => [formatShortDate(r.purchaseDate), r.invoiceNo, r.supplierName, String(r.items.length), formatCurrency(r.grandTotal)]),
          summary: { 'Total Entries': records.length, 'Total Amount': formatCurrency(records.reduce((s, r) => s + r.grandTotal, 0)) },
        });
      }
      case 'stock-out': {
        const records = await prisma.stockOutRecord.findMany({
          where: { ...dateFilter('saleDate') },
          include: { items: true },
          orderBy: { saleDate: 'desc' },
        });
        return res.json({
          title: 'Stock Out Report',
          columns: ['Date', 'Invoice No', 'Customer', 'Items', 'Total Amount'],
          rows: records.map(r => [formatShortDate(r.saleDate), r.invoiceNo, r.customerName, String(r.items.length), formatCurrency(r.grandTotal)]),
          summary: { 'Total Entries': records.length, 'Total Amount': formatCurrency(records.reduce((s, r) => s + r.grandTotal, 0)) },
        });
      }
      case 'low-stock': {
        const where: any = { deletedAt: null, stock: { gt: 0 } };
        if (business) where.business = { in: resolveBusinessScope(business) };
        const products = await prisma.product.findMany({ where: { ...where, stock: { lte: prisma.product.fields.minStock as any } }, orderBy: { stock: 'asc' } });
        // Prisma can't compare two columns directly in findMany; use raw
        const lowStockProducts = await prisma.$queryRawUnsafe<any[]>(
          `SELECT id, name, sku, brand, stock, minStock, status, sellingPrice FROM Product WHERE deletedAt IS NULL AND stock > 0 AND stock <= minStock${business ? ` AND business IN (${resolveBusinessScope(business)!.map(b => `'${b}'`).join(',')})` : ''} ORDER BY stock ASC`
        );
        return res.json({
          title: 'Low Stock Report',
          columns: ['Product', 'SKU', 'Brand', 'Current Stock', 'Min Stock', 'Status'],
          rows: lowStockProducts.map((p: any) => [p.name, p.sku, p.brand, String(p.stock), String(p.minStock), 'Low Stock']),
          summary: { 'Low Stock Items': lowStockProducts.length },
        });
      }
      case 'purchases': {
        const where: any = { deletedAt: null, ...dateFilter('purchaseDate') };
        if (business) where.business = business.toUpperCase();
        const purchases = await prisma.purchase.findMany({ where, orderBy: { purchaseDate: 'desc' } });
        return res.json({
          title: 'Purchase Report',
          columns: ['Date', 'PO Number', 'Supplier', 'Payment Mode', 'Status', 'Total Amount'],
          rows: purchases.map(p => [formatShortDate(p.purchaseDate), p.poNumber, p.supplierName, p.paymentMode, p.status, formatCurrency(p.totalAmount)]),
          summary: { 'Total Purchases': purchases.length, 'Total Amount': formatCurrency(purchases.reduce((s, p) => s + p.totalAmount, 0)) },
        });
      }
      case 'supplier-purchases': {
        const where: any = { deletedAt: null, ...dateFilter('purchaseDate') };
        if (business) where.business = business.toUpperCase();
        const purchases = await prisma.purchase.findMany({ where });
        const bySupplier = purchases.reduce((acc, p) => { acc[p.supplierName] = (acc[p.supplierName] ?? 0) + p.totalAmount; return acc; }, {} as Record<string, number>);
        const rows = Object.entries(bySupplier).sort((a, b) => b[1] - a[1]);
        return res.json({
          title: 'Supplier-wise Purchase Report',
          columns: ['Supplier', 'Total Amount'],
          rows: rows.map(([name, amt]) => [name, formatCurrency(amt)]),
          summary: { 'Total Suppliers': rows.length, 'Total Amount': formatCurrency(rows.reduce((s, [, a]) => s + a, 0)) },
        });
      }
      case 'sales': {
        const where: any = { deletedAt: null, ...dateFilter('saleDate') };
        if (business) where.business = business.toUpperCase();
        const sales = await prisma.sale.findMany({ where, orderBy: { saleDate: 'desc' } });
        return res.json({
          title: 'Sales Report',
          columns: ['Date', 'Invoice No', 'Customer', 'Payment Mode', 'Status', 'Total Amount'],
          rows: sales.map(s => [formatShortDate(s.saleDate), s.invoiceNumber, s.customerName, s.paymentMode, s.status, formatCurrency(s.totalAmount)]),
          summary: { 'Total Sales': sales.length, 'Total Amount': formatCurrency(sales.reduce((s, r) => s + r.totalAmount, 0)), 'Total Discount': formatCurrency(sales.reduce((s, r) => s + r.discountAmount, 0)) },
        });
      }
      case 'customer-sales': {
        const where: any = { deletedAt: null, ...dateFilter('saleDate') };
        if (business) where.business = business.toUpperCase();
        const sales = await prisma.sale.findMany({ where });
        const byCustomer = sales.reduce((acc, s) => { acc[s.customerName] = (acc[s.customerName] ?? 0) + s.totalAmount; return acc; }, {} as Record<string, number>);
        const rows = Object.entries(byCustomer).sort((a, b) => b[1] - a[1]);
        return res.json({
          title: 'Customer-wise Sales Report',
          columns: ['Customer', 'Total Amount'],
          rows: rows.map(([name, amt]) => [name, formatCurrency(amt)]),
          summary: { 'Total Customers': rows.length, 'Total Amount': formatCurrency(rows.reduce((s, [, a]) => s + a, 0)) },
        });
      }
      case 'expenses': {
        const where: any = { ...dateFilter('expenseDate') };
        const expenses = await prisma.expense.findMany({ where, orderBy: { expenseDate: 'desc' } });
        return res.json({
          title: 'Expense Report',
          columns: ['Date', 'Category', 'Title', 'Payment Mode', 'Amount'],
          rows: expenses.map(e => [formatShortDate(e.expenseDate), e.category, e.title, e.paymentMode, formatCurrency(e.amount)]),
          summary: { 'Total Entries': expenses.length, 'Total Amount': formatCurrency(expenses.reduce((s, e) => s + e.amount, 0)) },
        });
      }
      case 'customer-outstanding': {
        const where: any = { deletedAt: null, outstandingBalance: { gt: 0 } };
        if (business) where.business = business.toUpperCase();
        const customers = await prisma.customer.findMany({ where, orderBy: { outstandingBalance: 'desc' } });
        return res.json({
          title: 'Customer Outstanding Report',
          columns: ['Customer', 'Phone', 'City', 'Credit Limit', 'Outstanding Balance'],
          rows: customers.map(c => [c.name, c.phone, c.city, formatCurrency(c.creditLimit), formatCurrency(c.outstandingBalance)]),
          summary: { 'Total Customers': customers.length, 'Total Outstanding': formatCurrency(customers.reduce((s, c) => s + c.outstandingBalance, 0)) },
        });
      }
      default:
        return res.status(404).json({ error: `Unknown report type: ${type}` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate report' });
  }
});

// ─── Dashboard ───────────────────────────────────────────────────────────────
app.get('/api/dashboard', authenticateJWT, async (req, res) => {
  const { business } = req.query as Record<string, string>;
  const biz = (business || 'PAINTS').toUpperCase();
  const scope = resolveBusinessScope(biz);
  const productWhere: any = { deletedAt: null };
  if (scope) productWhere.business = { in: scope };

  const { start: ms, end: me } = monthRange();
  const { start: ds, end: de } = dayRange();

  const [products, monthlySales, monthlyPurchases, lowStockRaw, recentSales, recentPurchases, recentExpenses, bankAccounts, cashTxns] = await Promise.all([
    prisma.product.findMany({ where: productWhere, select: { stock: true, sellingPrice: true, minStock: true, name: true, status: true } }),
    prisma.sale.findMany({ where: { deletedAt: null, business: biz as any, saleDate: { gte: ms, lt: me } }, select: { totalAmount: true, saleDate: true } }),
    prisma.purchase.findMany({ where: { deletedAt: null, business: biz as any, purchaseDate: { gte: ms, lt: me } }, select: { totalAmount: true } }),
    prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, stock, minStock, sellingPrice FROM Product WHERE deletedAt IS NULL AND stock > 0 AND stock <= minStock AND business IN (${scope!.map(b => `'${b}'`).join(',')}) ORDER BY stock ASC LIMIT 8`
    ),
    prisma.sale.findMany({ where: { deletedAt: null, business: biz as any }, orderBy: { createdAt: 'desc' }, take: 5, select: { invoiceNumber: true, customerName: true, totalAmount: true, status: true, saleDate: true } }),
    prisma.purchase.findMany({ where: { deletedAt: null, business: biz as any }, orderBy: { createdAt: 'desc' }, take: 3, select: { poNumber: true, supplierName: true, totalAmount: true, status: true, purchaseDate: true } }),
    prisma.expense.findMany({ where: { expenseDate: { gte: ms, lt: me } }, orderBy: { expenseDate: 'desc' }, take: 3, select: { title: true, amount: true, category: true, expenseDate: true } }),
    prisma.bankAccount.findMany({ where: { deletedAt: null, business: biz as any }, select: { currentBalance: true } }),
    prisma.cashTransaction.findMany({ where: { business: biz as any }, select: { amount: true, direction: true } }),
  ]);

  const stockValue = products.reduce((s, p) => s + p.stock * p.sellingPrice, 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const monthSalesTotal = monthlySales.reduce((s, r) => s + r.totalAmount, 0);
  const monthPurchaseTotal = monthlyPurchases.reduce((s, r) => s + r.totalAmount, 0);
  const bankBalance = bankAccounts.reduce((s, a) => s + a.currentBalance, 0);
  const cashIn  = cashTxns.filter(t => t.direction === 'Credit').reduce((s, t) => s + t.amount, 0);
  const cashOut = cashTxns.filter(t => t.direction === 'Debit').reduce((s, t) => s + t.amount, 0);
  const cashBalance = cashIn - cashOut;

  // Weekly stock-in vs stock-out for chart (last 8 weeks)
  const weeklyData: [number, number][] = [];
  for (let w = 7; w >= 0; w--) {
    const wStart = new Date(); wStart.setDate(wStart.getDate() - w * 7 - 6); wStart.setHours(0,0,0,0);
    const wEnd   = new Date(); wEnd.setDate(wEnd.getDate() - w * 7 + 1);   wEnd.setHours(0,0,0,0);
    const [inQty, outQty] = await Promise.all([
      prisma.stockInItem.aggregate({ _sum: { quantity: true }, where: { stockInRecord: { purchaseDate: { gte: wStart, lt: wEnd } } } }),
      prisma.stockOutItem.aggregate({ _sum: { quantity: true }, where: { stockOutRecord: { saleDate: { gte: wStart, lt: wEnd } } } }),
    ]);
    const inVal  = Math.min(160, Math.round(((inQty._sum.quantity  ?? 0) / 10) * 10));
    const outVal = Math.min(160, Math.round(((outQty._sum.quantity ?? 0) / 10) * 10));
    weeklyData.push([inVal || 0, outVal || 0]);
  }

  const recentTxns = [
    ...recentSales.map(s => ({ ref: s.invoiceNumber, type: 'Sale', party: s.customerName, amount: formatCurrency(s.totalAmount), status: s.status, statusTone: s.status === 'Paid' ? 'success' : s.status === 'Pending' ? 'warn' : 'danger' })),
    ...recentPurchases.map(p => ({ ref: p.poNumber, type: 'Purchase', party: p.supplierName, amount: formatCurrency(p.totalAmount), status: p.status, statusTone: p.status === 'Received' ? 'success' : p.status === 'Pending' ? 'warn' : 'danger' })),
    ...recentExpenses.map(e => ({ ref: 'EXP', type: 'Expense', party: e.category, amount: formatCurrency(e.amount), status: 'Paid', statusTone: 'neutral' })),
  ].slice(0, 6);

  res.json({
    kpis: [
      { label: 'Total Products', value: products.length.toLocaleString('en-IN'), delta: `${biz.charAt(0) + biz.slice(1).toLowerCase()} business`, deltaTone: 'neutral' },
      { label: 'Stock Value', value: formatCurrency(stockValue), delta: `${lowStockCount} low stock SKUs`, deltaTone: lowStockCount > 0 ? 'down' : 'up' },
      { label: 'Sales (this month)', value: formatCurrency(monthSalesTotal), delta: `${monthlySales.length} invoices`, deltaTone: 'up' },
      { label: 'Purchases (this month)', value: formatCurrency(monthPurchaseTotal), delta: `${monthlyPurchases.length} orders`, deltaTone: 'neutral' },
      { label: 'Bank + Cash Balance', value: formatCurrency(bankBalance + cashBalance), delta: `Bank: ${formatCurrency(bankBalance)} · Cash: ${formatCurrency(cashBalance)}`, deltaTone: 'neutral' },
    ],
    chartBars: weeklyData,
    lowStock: lowStockRaw.map((p: any) => ({ id: p.id, name: p.name, stock: Number(p.stock), min: Number(p.minStock) })),
    transactions: recentTxns,
  });
});

// ─── Bank Accounts & Transactions ───────────────────────────────────────────
app.get('/api/bank/accounts', authenticateJWT, async (req, res) => {
  const { business } = req.query as Record<string, string>;
  const where: any = { deletedAt: null };
  if (business) where.business = business.toUpperCase();
  const accounts = await prisma.bankAccount.findMany({ where, orderBy: { createdAt: 'asc' } });
  res.json(accounts);
});

app.post('/api/bank/accounts', authenticateJWT, async (req: AuthRequest, res) => {
  const { accountName, bankName, accountNumber, ifscCode, currentBalance, type, business } = req.body;
  if (!accountName || !bankName || !accountNumber || !ifscCode)
    return res.status(400).json({ error: 'accountName, bankName, accountNumber and ifscCode are required' });
  try {
    const account = await prisma.bankAccount.create({
      data: { accountName, bankName, accountNumber, ifscCode, currentBalance: +(currentBalance || 0), type: type || 'Current', business: (business || 'PAINTS').toUpperCase() as any },
    });
    await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Bank Account Created', module: 'Finance', reference: accountName } });
    res.status(201).json(account);
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ error: 'Account number already exists' });
    res.status(400).json({ error: err?.message });
  }
});

app.put('/api/bank/accounts/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const { accountName, bankName, accountNumber, ifscCode, currentBalance, type } = req.body;
  const account = await prisma.bankAccount.update({
    where: { id: req.params.id },
    data: { accountName, bankName, accountNumber, ifscCode, currentBalance: currentBalance !== undefined ? +currentBalance : undefined, type },
  });
  await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Bank Account Updated', module: 'Finance', reference: accountName } });
  res.json(account);
});

app.delete('/api/bank/accounts/:id', authenticateJWT, async (req: AuthRequest, res) => {
  await prisma.bankAccount.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Bank Account Deleted', module: 'Finance', reference: req.params.id } });
  res.json({ message: 'Account deleted' });
});

app.get('/api/bank/transactions', authenticateJWT, async (req, res) => {
  const { business, accountId, from, to } = req.query as Record<string, string>;
  const accountWhere: any = { deletedAt: null };
  if (business) accountWhere.business = business.toUpperCase();
  const accounts = await prisma.bankAccount.findMany({ where: accountWhere, select: { id: true } });
  const accountIds = accountId ? [accountId] : accounts.map((a) => a.id);
  const where: any = { bankAccountId: { in: accountIds } };
  if (from || to) { where.date = {}; if (from) where.date.gte = new Date(from); if (to) where.date.lte = new Date(to); }
  const txns = await prisma.bankTransaction.findMany({
    where,
    include: { bankAccount: { select: { accountName: true, bankName: true } } },
    orderBy: { date: 'desc' },
  });
  const { start: ms, end: me } = monthRange();
  const monthTxns = txns.filter(t => t.date >= ms && t.date < me);
  const monthIn  = monthTxns.filter(t => t.direction === 'Credit').reduce((s, t) => s + t.amount, 0);
  const monthOut = monthTxns.filter(t => t.direction === 'Debit').reduce((s, t) => s + t.amount, 0);
  const allAccounts = await prisma.bankAccount.findMany({ where: accountWhere });
  const totalBalance = allAccounts.reduce((s, a) => s + a.currentBalance, 0);
  res.json({
    kpis: [
      { label: 'Bank Balance', value: formatCurrency(totalBalance), delta: `${allAccounts.length} account(s)`, deltaTone: 'neutral' },
      { label: 'This Month Deposits', value: formatCurrency(monthIn), delta: `${monthTxns.filter(t => t.direction === 'Credit').length} entries`, deltaTone: 'up' },
      { label: 'This Month Withdrawals', value: formatCurrency(monthOut), delta: `${monthTxns.filter(t => t.direction === 'Debit').length} entries`, deltaTone: 'neutral' },
      { label: 'Total Transactions', value: String(txns.length), delta: 'all time', deltaTone: 'neutral' },
    ],
    rows: txns.map(t => ({
      id: t.id,
      date: formatShortDate(t.date),
      type: t.type,
      description: t.description,
      account: `${t.bankAccount.bankName}`,
      accountId: t.bankAccountId,
      amount: formatCurrency(t.amount),
      amountRaw: t.amount,
      direction: t.direction,
      reference: t.reference ?? '',
    })),
    pagination: `Showing 1–${txns.length} of ${txns.length} entries`,
  });
});

app.post('/api/bank/transactions', authenticateJWT, async (req: AuthRequest, res) => {
  const { bankAccountId, date, type, description, amount, direction, reference } = req.body;
  if (!bankAccountId || !date || !type || !description || !amount || !direction)
    return res.status(400).json({ error: 'bankAccountId, date, type, description, amount and direction are required' });
  const txn = await prisma.$transaction(async (tx) => {
    const t = await tx.bankTransaction.create({
      data: { bankAccountId, date: new Date(date), type, description, amount: +amount, direction, reference: reference || null },
    });
    await tx.bankAccount.update({
      where: { id: bankAccountId },
      data: { currentBalance: { increment: direction === 'Credit' ? +amount : -amount } },
    });
    return t;
  });
  await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Bank Transaction Added', module: 'Finance', reference: description } });
  res.status(201).json(txn);
});

app.delete('/api/bank/transactions/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const txn = await prisma.bankTransaction.findUnique({ where: { id: req.params.id } });
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });
  await prisma.$transaction(async (tx) => {
    await tx.bankTransaction.delete({ where: { id: req.params.id } });
    await tx.bankAccount.update({
      where: { id: txn.bankAccountId },
      data: { currentBalance: { increment: txn.direction === 'Credit' ? -txn.amount : txn.amount } },
    });
  });
  await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Bank Transaction Deleted', module: 'Finance', reference: txn.description } });
  res.json({ message: 'Transaction deleted' });
});

// ─── Cash Transactions ────────────────────────────────────────────────────────
app.get('/api/cash/transactions', authenticateJWT, async (req, res) => {
  const { business, from, to } = req.query as Record<string, string>;
  const where: any = {};
  if (business) where.business = business.toUpperCase();
  if (from || to) { where.date = {}; if (from) where.date.gte = new Date(from); if (to) where.date.lte = new Date(to); }
  const txns = await prisma.cashTransaction.findMany({ where, orderBy: { date: 'desc' } });
  const { start: ms, end: me } = monthRange();
  const monthTxns = txns.filter(t => t.date >= ms && t.date < me);
  const monthIn  = monthTxns.filter(t => t.direction === 'Credit').reduce((s, t) => s + t.amount, 0);
  const monthOut = monthTxns.filter(t => t.direction === 'Debit').reduce((s, t) => s + t.amount, 0);
  const allTxns = await prisma.cashTransaction.findMany({ where: business ? { business: business.toUpperCase() as any } : {} });
  const totalIn  = allTxns.filter(t => t.direction === 'Credit').reduce((s, t) => s + t.amount, 0);
  const totalOut = allTxns.filter(t => t.direction === 'Debit').reduce((s, t) => s + t.amount, 0);
  const balance  = totalIn - totalOut;
  res.json({
    kpis: [
      { label: 'Cash Balance', value: formatCurrency(balance), delta: 'running balance', deltaTone: 'neutral' },
      { label: 'Cash In (this month)', value: formatCurrency(monthIn), delta: `${monthTxns.filter(t => t.direction === 'Credit').length} entries`, deltaTone: 'up' },
      { label: 'Cash Out (this month)', value: formatCurrency(monthOut), delta: `${monthTxns.filter(t => t.direction === 'Debit').length} entries`, deltaTone: 'neutral' },
      { label: 'Total Entries', value: String(txns.length), delta: 'all time', deltaTone: 'neutral' },
    ],
    rows: txns.map(t => ({
      id: t.id,
      date: formatShortDate(t.date),
      type: t.type,
      description: t.description,
      amount: formatCurrency(t.amount),
      amountRaw: t.amount,
      direction: t.direction,
      reference: t.reference ?? '',
    })),
    pagination: `Showing 1–${txns.length} of ${txns.length} entries`,
  });
});

app.post('/api/cash/transactions', authenticateJWT, async (req: AuthRequest, res) => {
  const { date, type, description, amount, direction, business, reference } = req.body;
  if (!date || !type || !description || !amount || !direction)
    return res.status(400).json({ error: 'date, type, description, amount and direction are required' });
  const txn = await prisma.cashTransaction.create({
    data: { date: new Date(date), type, description, amount: +amount, direction, business: (business || 'PAINTS').toUpperCase() as any, reference: reference || null },
  });
  await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Cash Transaction Added', module: 'Finance', reference: description } });
  res.status(201).json(txn);
});

app.delete('/api/cash/transactions/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const txn = await prisma.cashTransaction.delete({ where: { id: req.params.id } });
  await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Cash Transaction Deleted', module: 'Finance', reference: txn.description } });
  res.json({ message: 'Transaction deleted' });
});

// ─── Payments & Receipts ──────────────────────────────────────────────────────
app.get('/api/payments', authenticateJWT, async (req, res) => {
  const { business, type, search, from, to } = req.query as Record<string, string>;
  const where: any = {};
  if (business) where.business = business.toUpperCase();
  if (type)     where.type     = type;
  if (search)   where.OR = [{ party: { contains: search } }, { refNumber: { contains: search } }];
  if (from || to) { where.date = {}; if (from) where.date.gte = new Date(from); if (to) where.date.lte = new Date(to); }
  const payments = await prisma.paymentRecord.findMany({ where, orderBy: { date: 'desc' } });
  const { start: ms, end: me } = monthRange();
  const monthPay = payments.filter(p => p.date >= ms && p.date < me);
  const receipts = monthPay.filter(p => p.type === 'Receipt').reduce((s, p) => s + p.amount, 0);
  const payouts  = monthPay.filter(p => p.type === 'Payment').reduce((s, p) => s + p.amount, 0);
  res.json({
    kpis: [
      { label: 'Receipts (this month)', value: formatCurrency(receipts), delta: `${monthPay.filter(p => p.type === 'Receipt').length} entries`, deltaTone: 'up' },
      { label: 'Payments (this month)', value: formatCurrency(payouts), delta: `${monthPay.filter(p => p.type === 'Payment').length} entries`, deltaTone: 'neutral' },
      { label: 'Net (this month)', value: formatCurrency(receipts - payouts), delta: 'receipts minus payments', deltaTone: receipts >= payouts ? 'up' : 'down' },
      { label: 'Total Records', value: String(payments.length), delta: 'all time', deltaTone: 'neutral' },
    ],
    rows: payments.map(p => ({
      id: p.id,
      refNumber: p.refNumber,
      date: formatShortDate(p.date),
      type: p.type,
      party: p.party,
      paymentMode: p.paymentMode,
      amount: formatCurrency(p.amount),
      amountRaw: p.amount,
      notes: p.notes ?? '',
    })),
    pagination: `Showing 1–${payments.length} of ${payments.length} entries`,
  });
});

app.post('/api/payments', authenticateJWT, async (req: AuthRequest, res) => {
  const { refNumber, date, type, party, paymentMode, amount, notes, business } = req.body;
  if (!refNumber || !date || !type || !party || !paymentMode || !amount)
    return res.status(400).json({ error: 'refNumber, date, type, party, paymentMode and amount are required' });
  try {
    const payment = await prisma.paymentRecord.create({
      data: { refNumber, date: new Date(date), type, party, paymentMode, amount: +amount, notes: notes || null, business: (business || 'PAINTS').toUpperCase() as any },
    });
    await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: `${type} Recorded`, module: 'Finance', reference: refNumber } });
    res.status(201).json(payment);
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ error: 'Reference number already exists' });
    res.status(400).json({ error: err?.message });
  }
});

app.put('/api/payments/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const { date, type, party, paymentMode, amount, notes } = req.body;
  const payment = await prisma.paymentRecord.update({
    where: { id: req.params.id },
    data: { date: date ? new Date(date) : undefined, type, party, paymentMode, amount: amount !== undefined ? +amount : undefined, notes: notes ?? null },
  });
  await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Payment Updated', module: 'Finance', reference: payment.refNumber } });
  res.json(payment);
});

app.delete('/api/payments/:id', authenticateJWT, async (req: AuthRequest, res) => {
  const payment = await prisma.paymentRecord.delete({ where: { id: req.params.id } });
  await prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, action: 'Payment Deleted', module: 'Finance', reference: payment.refNumber } });
  res.json({ message: 'Payment deleted' });
});

// ─── Activity Log ──────────────────────────────────────────────────────────
app.get('/api/admin/activity-log', authenticateJWT, async (req, res) => {
  const { business, module: mod, userId, limit = '100' } = req.query as Record<string, string>;

  const where: any = {};
  // Auth & Administration logs are global — show on both business tabs
  if (business) {
    where.OR = [
      { business },
      { module: { in: ['Auth', 'Administration'] } },
    ];
  }
  if (mod)    where.module   = mod;
  if (userId) where.userId   = userId;

  const logs = await prisma.activityLog.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit),
  });
  res.json(logs);
});

// Get distinct users who have log entries (for filter dropdown)
app.get('/api/admin/activity-log/users', authenticateJWT, async (_req, res) => {
  const users = await prisma.activityLog.findMany({
    distinct: ['userId'],
    select: { userId: true, userName: true },
  });
  res.json(users);
});

// ─── Start ─────────────────────────────────────────────────────────────────
(async () => {
  try {
    await ensureStockInSupplierNameColumn();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
