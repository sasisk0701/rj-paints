import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.adminUser.upsert({
    where: { email: 'rjpaintsandhardwares@gmail.com' },
    update: { password: hashedPassword },
    create: {
      email: 'rjpaintsandhardwares@gmail.com',
      name: 'S. Madasamy (Proprietor)',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('Seeded Admin User:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
