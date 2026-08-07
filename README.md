# RJ Paints & Hardwares | Styleo Interiors & Construction Works

Enterprise-grade, dual-business web platform for **RJ Paints & Hardwares** (Asian Paints Authorized Dealer) and **Styleo Interiors & Construction Works** based in Kovilpatti, Tamil Nadu, India.

---

## 🏢 Business Profile

- **Company 1**: RJ Paints & Hardwares (Asian Paints Authorized Dealer)
- **Company 2**: Styleo Interiors & Construction Works
- **Proprietor**: S. Madasamy
- **Location**: Near New Bus Stand, Main Road, Kovilpatti - 628501, Tamil Nadu, India
- **Contact Phone**: 9488475040 | 6381593537 | 9969429723
- **Email**: rjpaintsandhardwares@gmail.com
- **Website**: [www.styleointeriors.com](https://www.styleointeriors.com)

---

## 🚀 Key Features

### 1. Dual Business Switcher Engine
- Dynamic platform that morphs between **Paints & Hardware Store** and **Interior Design & Construction**.
- Navigation, hero banners, product catalog vs interior portfolio, pricing calculators, color scheme accents, and CTAs adapt dynamically without page reloads.

### 2. Paints & Hardware Features
- **Asian Paints Authorized Showcase**: Royale Luxury Emulsion, Apex Ultima, Tractor Emulsion, TruCare Primers.
- **Brand Partners**: Asian Paints, Berger, Nippon, Birla White WallCare Putty, Dr. Fixit Pidilite, Godrej Hardware.
- **Interactive Paint Calculator**: Input room length, width, height, doors, windows & coats to calculate net wall surface area, paint liters needed, pack size breakdown (20L, 10L, 4L, 1L), and estimated cost.
- **Digital Shade Cards Visualizer**: Color swatch palette with real-time living room wall preview.
- **Hardware Catalog**: Locks, hinges, paint rollers & power tool accessories.

### 3. Interior Design & Construction Features
- **Services Grid**: Modular Kitchens (BWP 710 Marine Ply), Gyproc False Ceiling, Wardrobes, Living Room, Master Bedroom, Commercial Office, Turnkey Civil Construction.
- **Interactive Before & After Renovation Slider**: Drag handle comparison tool.
- **Photorealistic Portfolio Gallery**: Filterable project gallery.
- **Turnkey Packages**: Essential, Styleo Premium & Luxury Royal packages.
- **Instant Inquiry Modal**: Forwards quotes directly to proprietor S. Madasamy via WhatsApp (`9488475040`).

### 4. Admin Management Dashboard
- **Protected Routes & JWT Auth**: Single Admin account (`rjpaintsandhardwares@gmail.com` / `Admin@123`).
- **Dashboard Overview**: Metrics for Available Stock Value, Today's & Monthly Sales, Profit & Loss, Bank Balance, Low Stock Alerts, and Recharts analytics.
- **Products Inventory**: Full Ant Design CRUD table with SKU/Barcode generator and minimum stock alert tags.
- **Suppliers Master**: Supplier contacts, GSTIN numbers, address, and outstanding balance trackers.
- **Stock In (Purchase Entry)**: Invoice entry with automatic inventory stock addition.
- **Stock Out (Sales Billing)**: Billing invoice creation with automatic inventory reduction.
- **Labour Payments**: Daily wage painters, carpenters & site contractor payment logs.
- **Showroom Expenses**: Rent, fuel, electricity, transport & salary logs.
- **Bank & Cash Ledger**: Liquid balances for SBI, HDFC & shop cash drawer.
- **Printable Reports**: Stock, Sales, Purchase, and P&L audit reports with PDF export & print view (`window.print()`).
- **Settings & Data Backup**: Full JSON database snapshot download & file restore.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Ant Design (v5), Framer Motion, Lucide Icons, Recharts, React Hook Form, Zod, React Router DOM v6.
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL, JWT, bcrypt, Helmet.
- **Deployment**: Vercel SPA configuration (`vercel.json`), Dockerfile, Docker Compose, Nginx.

---

## 🏃 Local Development Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🔐 Admin Credentials

- **Email**: `rjpaintsandhardwares@gmail.com`
- **Password**: `Admin@123`
- **Portal Link**: Navigate to `/login` or click "Admin Portal" in the header/footer.

---

## ☁️ Deploying Frontend to Vercel

1. Push code to your GitHub repository.
2. Import repository into [Vercel](https://vercel.com).
3. Set Framework Preset to **Vite**.
4. The included `vercel.json` ensures client-side routes redirect smoothly to `index.html`.

---

## 🐳 Containerized Deployment via Docker

```bash
# Start full stack (PostgreSQL + Express API + Nginx Frontend)
cd docker
docker-compose up -d --build
```
