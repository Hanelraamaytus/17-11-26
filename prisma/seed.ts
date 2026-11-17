import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const directUrl = process.env.DIRECT_URL;
if (!directUrl) throw new Error('DIRECT_URL is missing in .env');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: directUrl }) });

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@ukk.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@ukk.com', password: await bcrypt.hash('Admin123!', 10), role: 'ADMIN' },
  });

  const services = [
    { code: 'R1-900', name: 'Rumah Tangga 900 VA', power_va: 900, price_per_kwh: 1352 },
    { code: 'R1-1300', name: 'Rumah Tangga 1300 VA', power_va: 1300, price_per_kwh: 1444.7 },
    { code: 'R1-2200', name: 'Rumah Tangga 2200 VA', power_va: 2200, price_per_kwh: 1444.7 },
  ];
  for (const s of services) {
    await prisma.electricityService.upsert({ where: { code: s.code }, update: {}, create: s });
  }
  console.log('Seed selesai');
}

main()
  .catch((e) => { console.error('Seed gagal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());