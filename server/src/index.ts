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
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
