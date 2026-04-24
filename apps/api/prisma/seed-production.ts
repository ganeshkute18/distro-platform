/**
 * Production Seed File
 * 
 * ✅ This file is safe for production
 * 
 * Contains:
 * ✅ Basic product categories
 * ✅ Sample agencies/vendors
 * ✅ Sample products (no real user data)
 * ❌ No test users or credentials
 * ❌ No default passwords
 * 
 * Usage in production:
 * 1. Create owner account using: npx ts-node prisma/setup-owner.ts
 * 2. Run this seed: npx prisma db seed  (or manually with ts-node)
 * 3. Rest of users created via signup/invitations
 * 
 * This ensures:
 * - Clean database setup
 * - No hardcoded credentials
 * - Full audit trail of user creation
 * - Controlled user onboarding
 */

import { PrismaClient, UnitType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Production Seed - Creating base data (NO USER ACCOUNTS)...\n');

  // Create Agencies/Vendors
  const hul = await prisma.agency.upsert({
    where: { name: 'Hindustan Unilever' },
    update: {},
    create: {
      name: 'Hindustan Unilever',
      description: 'FMCG & Personal Care Products',
      contactName: 'Sales Team',
      contactEmail: 'sales@hul.com',
      contactPhone: '+912022000000',
      isActive: true,
    },
  });

  const emami = await prisma.agency.upsert({
    where: { name: 'Emami Ltd' },
    update: {},
    create: {
      name: 'Emami Ltd',
      description: 'Ayurvedic & Personal Care',
      contactName: 'Distribution',
      contactEmail: 'distribution@emami.com',
      contactPhone: '+911166000000',
      isActive: true,
    },
  });

  const amul = await prisma.agency.upsert({
    where: { name: 'AMUL' },
    update: {},
    create: {
      name: 'AMUL',
      description: 'Dairy & Food Products',
      contactName: 'Wholesale',
      contactEmail: 'wholesale@amul.com',
      contactPhone: '+919079000000',
      isActive: true,
    },
  });

  // Create Categories
  const personalCare = await prisma.category.upsert({
    where: { slug: 'personal-care' },
    update: {},
    create: {
      name: 'Personal Care',
      slug: 'personal-care',
      description: 'Soaps, shampoos, skincare, and personal hygiene products',
    },
  });

  const dairyProducts = await prisma.category.upsert({
    where: { slug: 'dairy-products' },
    update: {},
    create: {
      name: 'Dairy Products',
      slug: 'dairy-products',
      description: 'Milk, butter, yogurt, and dairy-based products',
    },
  });

  const homecare = await prisma.category.upsert({
    where: { slug: 'home-care' },
    update: {},
    create: {
      name: 'Home Care',
      slug: 'home-care',
      description: 'Cleaning products, detergents, and household essentials',
    },
  });

  // Create Products
  const product1 = await prisma.product.upsert({
    where: { sku: 'HUL-LUX-001' },
    update: {},
    create: {
      sku: 'HUL-LUX-001',
      name: 'Lux Soap Bar',
      description: 'Premium bathing soap, rose fragrance',
      unitType: UnitType.PACKET,
      unitsPerCase: 4,
      pricePerUnit: 8000, // ₹80
      taxPercent: 18,
      agencyId: hul.id,
      categoryId: personalCare.id,
      isActive: true,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { sku: 'HUL-DOVE-001' },
    update: {},
    create: {
      sku: 'HUL-DOVE-001',
      name: 'Dove Shampoo 400ml',
      description: 'Moisturizing shampoo for smooth hair',
      unitType: UnitType.LITRE,
      unitsPerCase: 12,
      pricePerUnit: 25000, // ₹250
      taxPercent: 18,
      agencyId: hul.id,
      categoryId: personalCare.id,
      isActive: true,
    },
  });

  const product3 = await prisma.product.upsert({
    where: { sku: 'AMUL-MILK-001' },
    update: {},
    create: {
      sku: 'AMUL-MILK-001',
      name: 'AMUL Fresh Milk (1L)',
      description: 'Pure fresh cow milk',
      unitType: UnitType.LITRE,
      unitsPerCase: 1,
      pricePerUnit: 6500, // ₹65
      taxPercent: 5,
      agencyId: amul.id,
      categoryId: dairyProducts.id,
      isActive: true,
    },
  });

  // Create Inventory for Products
  const inventoryProducts = [product1, product2, product3];
  for (const product of inventoryProducts) {
    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        totalStock: 1000,
        reservedStock: 0,
        lowStockThreshold: 100,
      },
    });
  }

  console.log('✅ Production Seed Complete!\n');
  console.log('📊 Database Summary:');
  console.log(`   ✓ Agencies: 3`);
  console.log(`   ✓ Categories: 3`);
  console.log(`   ✓ Products: 3`);
  console.log(`   ✓ Users: 0 (Create manually)\n`);

  console.log('🚀 Next Steps:');
  console.log(`   1. Create first owner: npx ts-node prisma/setup-owner.ts`);
  console.log(`   2. Owner invites staff via API`);
  console.log(`   3. Customers self-register\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
