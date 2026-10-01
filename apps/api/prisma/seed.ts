import {
  PrismaClient,
  Role,
  UnitType,
  ApprovalStatus,
  TenantPlan,
  CustomerType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding DistroPro database...');

  const passwordHash = await bcrypt.hash('Password@123', 12);

  // ============================================================
  // 1. CREATE TENANT
  // ============================================================

  const tenant = await prisma.tenant.upsert({
    where: {
      slug: 'distro-demo',
    },
    update: {},
    create: {
      name: 'Distro Demo Agency',
      slug: 'distro-demo',
      contactEmail: 'owner@distro.com',
      contactPhone: '+919999900000',
      address: '12, Market Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      plan: TenantPlan.PROFESSIONAL,
      isActive: true,
    },
  });

  console.log(`✅ Tenant created: ${tenant.name}`);

  // ============================================================
  // 2. CREATE OWNER
  // ============================================================

  const owner = await prisma.user.upsert({
    where: {
      email: 'owner@distro.com',
    },
    update: {
      role: Role.OWNER,
      isActive: true,
      emailVerified: true,
      approvalStatus: ApprovalStatus.APPROVED,
    },
    create: {
      email: 'owner@distro.com',
      name: 'Platform Owner',
      passwordHash,
      role: Role.OWNER,
      phone: '+919999900000',
      isActive: true,
      emailVerified: true,
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  // Connect owner to tenant
  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: owner.id,
      },
    },
    update: {
      role: Role.OWNER,
      isActive: true,
    },
    create: {
      tenantId: tenant.id,
      userId: owner.id,
      role: Role.OWNER,
      isActive: true,
    },
  });

  console.log('✅ Owner created');

  // ============================================================
  // 3. CREATE STAFF
  // ============================================================

  const staff = await prisma.user.upsert({
    where: {
      email: 'staff@distro.com',
    },
    update: {
      role: Role.STAFF,
      isActive: true,
      emailVerified: true,
      approvalStatus: ApprovalStatus.APPROVED,
    },
    create: {
      email: 'staff@distro.com',
      name: 'Warehouse Staff',
      passwordHash,
      role: Role.STAFF,
      phone: '+919999900001',
      isActive: true,
      emailVerified: true,
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: staff.id,
      },
    },
    update: {
      role: Role.STAFF,
      isActive: true,
    },
    create: {
      tenantId: tenant.id,
      userId: staff.id,
      role: Role.STAFF,
      isActive: true,
    },
  });

  console.log('✅ Staff created');

  // ============================================================
  // 4. CREATE CUSTOMER USER
  // ============================================================

  const customerUser = await prisma.user.upsert({
    where: {
      email: 'customer@distro.com',
    },
    update: {
      role: Role.CUSTOMER,
      isActive: true,
      emailVerified: true,
      approvalStatus: ApprovalStatus.APPROVED,
    },
    create: {
      email: 'customer@distro.com',
      name: 'Raj Provisions',
      passwordHash,
      role: Role.CUSTOMER,
      phone: '+919999900002',
      businessName: 'Raj General Store',
      address: '12, Market Road, Pune 411001',
      isActive: true,
      emailVerified: true,
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  // Connect customer to tenant
  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: customerUser.id,
      },
    },
    update: {
      role: Role.CUSTOMER,
      isActive: true,
    },
    create: {
      tenantId: tenant.id,
      userId: customerUser.id,
      role: Role.CUSTOMER,
      isActive: true,
    },
  });

  // Create tenant-scoped Customer record
  const customer = await prisma.customer.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: customerUser.id,
      },
    },
    update: {
      customerType: CustomerType.RETAILER,
      isActive: true,
    },
    create: {
      tenantId: tenant.id,
      userId: customerUser.id,
      customerType: CustomerType.RETAILER,
      creditLimit: 1000000,
      paymentTerms: 30,
      isActive: true,
    },
  });

  console.log('✅ Customer created');

  // ============================================================
  // 5. CREATE AGENCY
  // ============================================================

  const agency = await prisma.agency.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'Hindustan Unilever',
      },
    },
    update: {},
    create: {
      name: 'Hindustan Unilever',
      description: 'FMCG products distributor',
      contactName: 'Priya Sharma',
      contactEmail: 'priya@hul.com',
      contactPhone: '+912022000000',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Agency created');

  // ============================================================
  // 6. CREATE CATEGORY
  // ============================================================

  const category = await prisma.category.upsert({
    where: {
      tenantId_slug: {
        tenantId: tenant.id,
        slug: 'personal-care',
      },
    },
    update: {},
    create: {
      name: 'Personal Care',
      slug: 'personal-care',
      description: 'Soaps, shampoos, skincare',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Category created');

  // ============================================================
  // 7. CREATE PRODUCT
  // ============================================================

  const product = await prisma.product.upsert({
    where: {
      tenantId_sku: {
        tenantId: tenant.id,
        sku: 'HUL-LUX-001',
      },
    },
    update: {},
    create: {
      sku: 'HUL-LUX-001',
      name: 'Lux Soap Bar (Pack of 4)',
      description: 'Premium bathing soap, rose fragrance',
      imageUrls: [],
      unitType: UnitType.PACKET,
      unitsPerCase: 4,
      pricePerUnit: 8000,
      taxPercent: 18,
      hsnCode: '340111',
      brand: 'Lux',
      tags: ['soap', 'personal-care', 'lux'],
      isActive: true,
      isFeatured: true,
      minOrderQty: 1,
      agencyId: agency.id,
      categoryId: category.id,
      tenantId: tenant.id,
    },
  });

  console.log('✅ Product created');

  // ============================================================
  // 8. CREATE INVENTORY
  // ============================================================

  await prisma.inventory.upsert({
    where: {
      productId: product.id,
    },
    update: {
      totalStock: 500,
      lowStockThreshold: 50,
    },
    create: {
      productId: product.id,
      totalStock: 500,
      reservedStock: 0,
      lowStockThreshold: 50,
    },
  });

  console.log('✅ Inventory created');

  // ============================================================
  // 9. CREATE APP SETTINGS
  // ============================================================

  await prisma.appSetting.upsert({
    where: {
      tenantId: tenant.id,
    },
    update: {},
    create: {
      tenantId: tenant.id,
      companyName: 'Distro Demo Agency',
    },
  });

  console.log('✅ App settings created');

  // ============================================================
  // 10. CREATE STAFF INVITATIONS
  // ============================================================

  await prisma.invitation.deleteMany({
    where: {
      tenantId: tenant.id,
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.invitation.create({
    data: {
      code: 'STAFF_ABC123_TEST001',
      role: Role.STAFF,
      email: 'newstaff@example.com',
      expiresAt: nextWeek,
      createdBy: owner.id,
      tenantId: tenant.id,
      isUsed: false,
    },
  });

  await prisma.invitation.create({
    data: {
      code: 'STAFF_DEF456_TEST002',
      role: Role.STAFF,
      expiresAt: tomorrow,
      createdBy: owner.id,
      tenantId: tenant.id,
      isUsed: false,
    },
  });

  console.log('✅ Staff invitations created');

  // ============================================================
  // DONE
  // ============================================================

  console.log('\n' + '='.repeat(60));
  console.log('✅ DISTROPRO SEED COMPLETE');
  console.log('='.repeat(60));

  console.log('\n👑 OWNER');
  console.log('   Email:    owner@distro.com');
  console.log('   Password: Password@123');

  console.log('\n👷 STAFF');
  console.log('   Email:    staff@distro.com');
  console.log('   Password: Password@123');

  console.log('\n🏪 CUSTOMER');
  console.log('   Email:    customer@distro.com');
  console.log('   Password: Password@123');

  console.log('\n🏢 TENANT');
  console.log(`   Name: ${tenant.name}`);
  console.log(`   Slug: ${tenant.slug}`);

  console.log('\n📦 PRODUCT');
  console.log(`   SKU: ${product.sku}`);
  console.log(`   Name: ${product.name}`);

  console.log('\n🚀 Database is ready for testing.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
