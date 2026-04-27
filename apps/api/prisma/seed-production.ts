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
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) return false;

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return true;
}

async function importImageToCloudinary(remoteUrl: string, publicId: string) {
  const ok = configureCloudinary();
  if (!ok) return remoteUrl;
  const res = await cloudinary.uploader.upload(remoteUrl, {
    folder: 'distro/seed',
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
  });
  return res.secure_url;
}

async function main() {
  console.log('🌱 Production Seed - Creating base data (NO USER ACCOUNTS)...\n');

  // Create Agencies (client-specific)
  const chitale = await prisma.agency.upsert({
    where: { name: 'Chitale Dairy Products Agency' },
    update: { isActive: true },
    create: {
      name: 'Chitale Dairy Products Agency',
      description: 'Dairy items (milk, curd, paneer, butter, ghee)',
      contactName: 'Sales Team',
      contactEmail: 'sales@chitale.example',
      contactPhone: '+919000000001',
      isActive: true,
    },
  });

  const bisleri = await prisma.agency.upsert({
    where: { name: 'Bisleri Packaged Drinking Water Agency' },
    update: { isActive: true },
    create: {
      name: 'Bisleri Packaged Drinking Water Agency',
      description: 'Packaged drinking water bottles and cans',
      contactName: 'Sales Team',
      contactEmail: 'sales@bisleri.example',
      contactPhone: '+919000000002',
      isActive: true,
    },
  });

  const societyTea = await prisma.agency.upsert({
    where: { name: 'Society Tea Power Agency' },
    update: { isActive: true },
    create: {
      name: 'Society Tea Power Agency',
      description: 'Tea products (powder, bags, premix)',
      contactName: 'Sales Team',
      contactEmail: 'sales@societytea.example',
      contactPhone: '+919000000003',
      isActive: true,
    },
  });

  // Create Categories
  const dairyProducts = await prisma.category.upsert({
    where: { slug: 'dairy-products' },
    update: {},
    create: {
      name: 'Dairy Products',
      slug: 'dairy-products',
      description: 'Milk, curd, paneer, butter, ghee and dairy essentials',
    },
  });

  const packagedWater = await prisma.category.upsert({
    where: { slug: 'packaged-water' },
    update: {},
    create: {
      name: 'Packaged Water',
      slug: 'packaged-water',
      description: 'Bottled drinking water and water cans',
    },
  });

  const teaAndBeverages = await prisma.category.upsert({
    where: { slug: 'tea-and-beverages' },
    update: {},
    create: {
      name: 'Tea & Beverages',
      slug: 'tea-and-beverages',
      description: 'Tea, premixes, and beverage essentials',
    },
  });

  // Seed images (import to Cloudinary if configured)
  const imgWaterBottle = await importImageToCloudinary(
    'https://upload.wikimedia.org/wikipedia/commons/a/a0/Water_bottle.png',
    'water-bottle',
  );
  const imgSocietyLogo = await importImageToCloudinary(
    'https://upload.wikimedia.org/wikipedia/commons/2/2e/Society-tea-logo.png',
    'society-tea-logo',
  );
  const imgPaneerDish = await importImageToCloudinary(
    'https://upload.wikimedia.org/wikipedia/commons/7/7e/Kadai_paneer_with_garlic_naan.jpg',
    'paneer-dish',
  );

  // Create Products (realistic starter catalog)
  const products = await Promise.all([
    // Bisleri
    prisma.product.upsert({
      where: { sku: 'BIS-WATER-1L' },
      update: { isActive: true },
      create: {
        sku: 'BIS-WATER-1L',
        name: 'Bisleri Packaged Drinking Water (1L)',
        description: 'Packaged drinking water bottle',
        unitType: UnitType.LITRE,
        unitsPerCase: 12,
        pricePerUnit: 2000, // ₹20
        taxPercent: 0,
        agencyId: bisleri.id,
        categoryId: packagedWater.id,
        isActive: true,
        imageUrls: [imgWaterBottle],
      },
    }),
    prisma.product.upsert({
      where: { sku: 'BIS-WATER-500ML' },
      update: { isActive: true },
      create: {
        sku: 'BIS-WATER-500ML',
        name: 'Bisleri Packaged Drinking Water (500ml)',
        description: 'Packaged drinking water bottle',
        unitType: UnitType.PIECE,
        unitsPerCase: 24,
        pricePerUnit: 1000, // ₹10
        taxPercent: 0,
        agencyId: bisleri.id,
        categoryId: packagedWater.id,
        isActive: true,
        imageUrls: [imgWaterBottle],
      },
    }),
    prisma.product.upsert({
      where: { sku: 'BIS-WATER-20L' },
      update: { isActive: true },
      create: {
        sku: 'BIS-WATER-20L',
        name: 'Bisleri Water Can (20L)',
        description: 'Large water can for office/home dispensers',
        unitType: UnitType.PIECE,
        unitsPerCase: 1,
        pricePerUnit: 8000, // ₹80
        taxPercent: 0,
        agencyId: bisleri.id,
        categoryId: packagedWater.id,
        isActive: true,
        imageUrls: [imgWaterBottle],
      },
    }),

    // Chitale Dairy
    prisma.product.upsert({
      where: { sku: 'CHT-MILK-1L' },
      update: { isActive: true },
      create: {
        sku: 'CHT-MILK-1L',
        name: 'Chitale Milk (1L)',
        description: 'Fresh milk (pack)',
        unitType: UnitType.LITRE,
        unitsPerCase: 1,
        pricePerUnit: 6000, // ₹60
        taxPercent: 0,
        agencyId: chitale.id,
        categoryId: dairyProducts.id,
        isActive: true,
        imageUrls: [imgPaneerDish],
      },
    }),
    prisma.product.upsert({
      where: { sku: 'CHT-CURD-500G' },
      update: { isActive: true },
      create: {
        sku: 'CHT-CURD-500G',
        name: 'Chitale Curd (500g)',
        description: 'Fresh curd/dahi (pack)',
        unitType: UnitType.PACKET,
        unitsPerCase: 1,
        pricePerUnit: 5000, // ₹50
        taxPercent: 0,
        agencyId: chitale.id,
        categoryId: dairyProducts.id,
        isActive: true,
        imageUrls: [imgPaneerDish],
      },
    }),
    prisma.product.upsert({
      where: { sku: 'CHT-PANEER-200G' },
      update: { isActive: true },
      create: {
        sku: 'CHT-PANEER-200G',
        name: 'Chitale Paneer (200g)',
        description: 'Paneer (cottage cheese) pack',
        unitType: UnitType.PACKET,
        unitsPerCase: 1,
        pricePerUnit: 10000, // ₹100
        taxPercent: 0,
        agencyId: chitale.id,
        categoryId: dairyProducts.id,
        isActive: true,
        imageUrls: [imgPaneerDish],
      },
    }),
    prisma.product.upsert({
      where: { sku: 'CHT-BUTTER-100G' },
      update: { isActive: true },
      create: {
        sku: 'CHT-BUTTER-100G',
        name: 'Chitale Butter (100g)',
        description: 'Butter pack',
        unitType: UnitType.PACKET,
        unitsPerCase: 1,
        pricePerUnit: 5500, // ₹55
        taxPercent: 0,
        agencyId: chitale.id,
        categoryId: dairyProducts.id,
        isActive: true,
        imageUrls: [imgPaneerDish],
      },
    }),

    // Society Tea
    prisma.product.upsert({
      where: { sku: 'SOC-TEA-1KG' },
      update: { isActive: true },
      create: {
        sku: 'SOC-TEA-1KG',
        name: 'Society Tea (1kg)',
        description: 'Strong tea leaves (CTC)',
        unitType: UnitType.KG,
        unitsPerCase: 1,
        pricePerUnit: 55000, // ₹550
        taxPercent: 0,
        agencyId: societyTea.id,
        categoryId: teaAndBeverages.id,
        isActive: true,
        imageUrls: [imgSocietyLogo],
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SOC-TEA-250G' },
      update: { isActive: true },
      create: {
        sku: 'SOC-TEA-250G',
        name: 'Society Tea (250g)',
        description: 'Tea leaves pack',
        unitType: UnitType.PACKET,
        unitsPerCase: 1,
        pricePerUnit: 15000, // ₹150
        taxPercent: 0,
        agencyId: societyTea.id,
        categoryId: teaAndBeverages.id,
        isActive: true,
        imageUrls: [imgSocietyLogo],
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SOC-TEA-BAGS-25' },
      update: { isActive: true },
      create: {
        sku: 'SOC-TEA-BAGS-25',
        name: 'Society Tea Bags (25 pcs)',
        description: 'Tea bags pack',
        unitType: UnitType.PACKET,
        unitsPerCase: 1,
        pricePerUnit: 12000, // ₹120
        taxPercent: 0,
        agencyId: societyTea.id,
        categoryId: teaAndBeverages.id,
        isActive: true,
        imageUrls: [imgSocietyLogo],
      },
    }),
  ]);

  // Create Inventory for Products
  for (const product of products) {
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
  console.log(`   ✓ Products: ${products.length}`);
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
