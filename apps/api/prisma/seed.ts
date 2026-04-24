import { PrismaClient, Role, UnitType, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Development Seed File
 * 
 * ⚠️  IMPORTANT: This seed file includes SAMPLE CREDENTIALS FOR TESTING ONLY
 * 
 * Use this for:
 * ✅ Local development
 * ✅ Testing features
 * ✅ Internal QA
 * ❌ NOT for production (remove all test accounts before going live)
 * 
 * For Production:
 * ✅ Use setup-owner.ts to create the first real owner account
 * ✅ Use self-registration (POST /auth/signup/customer)
 * ✅ Use staff invitations (POST /auth/invitations/generate)
 * 
 * Test Accounts:
 * - owner@distro.com (owner)
 * - staff@distro.com (staff)
 * - customer@distro.com (customer)
 */

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with test data...');

  const passwordHash = await bcrypt.hash('Password@123', 12);

  // Create Test Owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@distro.com' },
    update: {},
    create: {
      email: 'owner@distro.com',
      name: 'Platform Owner',
      passwordHash,
      role: Role.OWNER,
      phone: '+919999900000',
      isActive: true,
      emailVerified: true, // Test user, already verified
      approvalStatus: 'APPROVED' as ApprovalStatus, // Auto-approved for testing
    },
  });

  // Create Test Staff
  const staff = await prisma.user.upsert({
    where: { email: 'staff@distro.com' },
    update: {},
    create: {
      email: 'staff@distro.com',
      name: 'Warehouse Staff',
      passwordHash,
      role: Role.STAFF,
      phone: '+919999900001',
      isActive: true,
      emailVerified: true, // Test user, already verified
      approvalStatus: 'APPROVED' as ApprovalStatus, // Auto-approved for testing
    },
  });

  // Create Test Customer
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
      isActive: true,
      emailVerified: true, // Test user, already verified
      approvalStatus: 'APPROVED' as ApprovalStatus, // Customers auto-approve
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

  // Create Sample Invitations for Testing
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.invitation.deleteMany({}); // Clear existing
  
  const invitation1 = await prisma.invitation.create({
    data: {
      code: 'STAFF_ABC123_TEST001',
      role: Role.STAFF,
      email: 'newstaff@example.com',
      expiresAt: nextWeek,
      createdBy: owner.id,
      isUsed: false,
    },
  });

  const invitation2 = await prisma.invitation.create({
    data: {
      code: 'STAFF_DEF456_TEST002',
      role: Role.STAFF,
      expiresAt: tomorrow, // Expires tomorrow
      createdBy: owner.id,
      isUsed: false,
    },
  });

  console.log('✅ Seed complete!\n');
  console.log('🚨 WARNING: This is test data. Remove before production!');
  
  console.log('\n' + '='.repeat(60));
  console.log('  TEST CREDENTIALS FOR LOCAL DEVELOPMENT');
  console.log('='.repeat(60) + '\n');
  
  console.log('📧 OWNER Account:');
  console.log('   Email:    owner@distro.com');
  console.log('   Password: Password@123');
  console.log('   Access:   Full system, user management, invitations\n');
  
  console.log('📧 STAFF Account:');
  console.log('   Email:    staff@distro.com');
  console.log('   Password: Password@123');
  console.log('   Access:   Orders, inventory, reports\n');
  
  console.log('📧 CUSTOMER Account:');
  console.log('   Email:    customer@distro.com');
  console.log('   Password: Password@123');
  console.log('   Access:   Catalog, orders, profile\n');

  console.log('📨 Sample Invitation Codes (For Staff Signup):');
  console.log(`   1️⃣  ${invitation1.code}`);
  console.log(`       📧 Pre-assigned email: ${invitation1.email}`);
  console.log(`       ⏰ Expires: ${invitation1.expiresAt.toDateString()}\n`);
  console.log(`   2️⃣  ${invitation2.code}`);
  console.log(`       📧 Any email can use this`);
  console.log(`       ⏰ Expires: ${invitation2.expiresAt.toDateString()}\n`);

  console.log('🌐 API Endpoints:');
  console.log('   POST /api/v1/auth/login                    - Login');
  console.log('   POST /api/v1/auth/verify-email             - Verify email');
  console.log('   POST /api/v1/auth/resend-verification-email - Resend verification');
  console.log('   POST /api/v1/auth/signup/customer          - Customer Signup (Public)');
  console.log('   POST /api/v1/auth/signup/staff             - Staff Signup (Invitation Required)');
  console.log('   POST /api/v1/auth/invitations/generate     - Generate Invitation (Owner Only)');
  console.log('   GET  /api/v1/auth/invitations              - List Invitations (Owner Only)');
  console.log('   GET  /api/v1/users                         - List Users (Owner Only)');
  console.log('   POST /api/v1/users/:userId/approve         - Approve User (Owner Only)');
  console.log('   POST /api/v1/users/:userId/reject          - Reject User (Owner Only)\n');
  
  console.log('🚀 Get Swagger Docs at: http://localhost:4000/api/docs\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
