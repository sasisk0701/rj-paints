import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  await prisma.adminUser.upsert({
    where: { email: 'rjpaintsandhardwares@gmail.com' },
    update: { password: hashedPassword },
    create: { email: 'rjpaintsandhardwares@gmail.com', name: 'S. Madasamy', password: hashedPassword, role: 'ADMIN' },
  });

  // Settings
  const settings = [
    { key: 'paints_company_name',    value: 'RJ Paints & Hardwares' },
    { key: 'paints_gst',             value: '33AABCR1234F1Z9' },
    { key: 'paints_address',         value: 'Main Road, Near New Bus Stand, Kovilpatti - 628501, Tamil Nadu' },
    { key: 'paints_phone',           value: '9488475040' },
    { key: 'paints_email',           value: 'rjpaintsandhardwares@gmail.com' },
    { key: 'paints_website',         value: 'www.styleointeriors.com' },
    { key: 'paints_paint_partner',   value: 'Asian Paints Authorized Dealer' },
    { key: 'interiors_company_name', value: 'Styleo Interiors & Construction Works' },
    { key: 'interiors_gst',          value: '33AABCR1234F1Z9' },
    { key: 'interiors_address',      value: 'Main Road, Near New Bus Stand, Kovilpatti - 628501, Tamil Nadu' },
    { key: 'interiors_phone',        value: '9488475040' },
    { key: 'interiors_email',        value: 'rjpaintsandhardwares@gmail.com' },
    { key: 'interiors_website',      value: 'www.styleointeriors.com' },
    { key: 'owner_name',             value: 'S. Madasamy' },
    { key: 'owner_phone2',           value: '6381593537' },
    { key: 'owner_phone3',           value: '9969429723' },
    { key: 'tax_default_gst_rate',   value: '18' },
    { key: 'tax_gst_registered',     value: 'true' },
    { key: 'tax_hsn_code_paints',    value: '3209' },
    { key: 'tax_hsn_code_hardware',  value: '8302' },
    { key: 'tax_hsn_code_interiors', value: '9403' },
    { key: 'invoice_prefix_paints',    value: 'RJ-INV' },
    { key: 'invoice_prefix_interiors', value: 'STY-INV' },
    { key: 'invoice_next_number',      value: '1' },
    { key: 'invoice_footer_note',      value: 'Thank you for your business! Goods once sold will not be taken back.' },
    { key: 'invoice_terms',            value: 'Payment due within 30 days.' },
    { key: 'currency_symbol', value: '₹' },
    { key: 'currency_code',   value: 'INR' },
    { key: 'default_unit',    value: 'Liter' },
    { key: 'date_format',     value: 'DD/MM/YYYY' },
    { key: 'notify_low_stock',       value: 'true' },
    { key: 'notify_low_stock_email', value: 'rjpaintsandhardwares@gmail.com' },
    { key: 'notify_new_sale',        value: 'true' },
    { key: 'notify_whatsapp',        value: '9488475040' },
  ];
  for (const s of settings) {
    await prisma.settings.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  console.log('✅ Seed complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
