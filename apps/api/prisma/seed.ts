import { PrismaClient, Role, UnitType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('Password@123', 12);

  // Create Owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@distro.com' },
    update: {},
    create: {
      email: 'owner@distro.com',
      name: 'Platform Owner',
      passwordHash,
      role: Role.OWNER,
      phone: '+919999900000',
    },
  });

  // Create Staff
  const staff = await prisma.user.upsert({
    where: { email: 'staff@distro.com' },
    update: {},
    create: {
      email: 'staff@distro.com',
      name: 'Warehouse Staff',
      passwordHash,
      role: Role.STAFF,
      phone: '+919999900001',
    },
  });

  // Create Customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@distro.com' },
    update: {},
    create: {
      email: 'customer@distro.com',
      name: 'Raj Provisions',
      passwordHash,
      role: Role.CUSTOMER,
      phone: '+919999900002',
      businessName: 'Raj General Store',
      address: '12, Market Road, Pune 411001',
    },
  });

  // Create Agency
  const agency = await prisma.agency.upsert({
    where: { name: 'Hindustan Unilever' },
    update: {},
    create: {
      name: 'Hindustan Unilever',
      description: 'FMCG products distributor',
      contactName: 'Priya Sharma',
      contactEmail: 'priya@hul.com',
      contactPhone: '+912022000000',
    },
  });

  // Create Category
  const category = await prisma.category.upsert({
    where: { slug: 'personal-care' },
    update: {},
    create: {
      name: 'Personal Care',
      slug: 'personal-care',
      description: 'Soaps, shampoos, skincare',
    },
  });

  // Create Product
  const product = await prisma.product.upsert({
    where: { sku: 'HUL-LUX-001' },
    update: {},
    create: {
      sku: 'HUL-LUX-001',
      name: 'Lux Soap Bar (Pack of 4)',
      description: 'Premium bathing soap, rose fragrance',
      unitType: UnitType.PACKET,
      unitsPerCase: 4,
      pricePerUnit: 8000, // ₹80 in paise
      taxPercent: 18,
      agencyId: agency.id,
      categoryId: category.id,
    },
  });

  // Create Inventory
  await prisma.inventory.upsert({
    where: { productId: product.id },
    update: {},
    create: {
      productId: product.id,
      totalStock: 500,
      reservedStock: 0,
      lowStockThreshold: 50,
    },
  });

  console.log('✅ Seed complete!');
  console.log('\n📋 Login credentials:');
  console.log('  Owner:    owner@distro.com    / Password@123');
  console.log('  Staff:    staff@distro.com    / Password@123');
  console.log('  Customer: customer@distro.com / Password@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
