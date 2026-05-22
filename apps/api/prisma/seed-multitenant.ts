/**
 * Multi-Tenant Migration Seed
 * 
 * This script creates a default tenant and migrates existing data
 * to be associated with the default tenant.
 * 
 * Run: npx ts-node prisma/seed-multitenant.ts
 */
import { PrismaClient, Role, CustomerType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting multi-tenant migration seed...\n');

  // 1. Create default tenant from existing agency data
  const existingAgency = await prisma.agency.findFirst({ orderBy: { createdAt: 'asc' } });
  const appSetting = await prisma.appSetting.findFirst();

  const tenantName = appSetting?.companyName || existingAgency?.name || 'Default Tenant';
  const tenantSlug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
        contactEmail: existingAgency?.contactEmail,
        contactPhone: existingAgency?.contactPhone,
        plan: 'PROFESSIONAL',
        isActive: true,
      },
    });
    console.log(`✅ Created default tenant: ${tenant.name} (${tenant.slug})`);
  } else {
    console.log(`ℹ️  Default tenant already exists: ${tenant.name}`);
  }

  // 2. Link all existing users to the default tenant
  const users = await prisma.user.findMany();
  let linkedCount = 0;
  for (const user of users) {
    const existing = await prisma.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    });
    if (!existing) {
      await prisma.tenantUser.create({
        data: { tenantId: tenant.id, userId: user.id, role: user.role },
      });
      linkedCount++;
    }
  }
  console.log(`✅ Linked ${linkedCount} users to default tenant`);

  // 3. Create Customer records for existing CUSTOMER-role users
  const customerUsers = users.filter((u) => u.role === Role.CUSTOMER);
  let customerCount = 0;
  for (const cu of customerUsers) {
    const existing = await prisma.customer.findUnique({
      where: { tenantId_userId: { tenantId: tenant.id, userId: cu.id } },
    });
    if (!existing) {
      await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          userId: cu.id,
          customerType: CustomerType.RETAILER,
          isActive: true,
        },
      });
      customerCount++;
    }
  }
  console.log(`✅ Created ${customerCount} customer records`);

  // 4. Associate existing agencies with tenant
  const agencies = await prisma.agency.findMany({ where: { tenantId: null } });
  if (agencies.length > 0) {
    await prisma.agency.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    });
    console.log(`✅ Associated ${agencies.length} agencies with default tenant`);
  }

  // 5. Associate existing categories with tenant
  const categories = await prisma.category.findMany({ where: { tenantId: null } });
  if (categories.length > 0) {
    await prisma.category.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    });
    console.log(`✅ Associated ${categories.length} categories with default tenant`);
  }

  // 6. Associate existing products with tenant
  const products = await prisma.product.findMany({ where: { tenantId: null } });
  if (products.length > 0) {
    await prisma.product.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    });
    console.log(`✅ Associated ${products.length} products with default tenant`);
  }

  // 7. Associate existing orders with tenant
  const orders = await prisma.order.findMany({ where: { tenantId: null } });
  if (orders.length > 0) {
    await prisma.order.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    });
    console.log(`✅ Associated ${orders.length} orders with default tenant`);
  }

  // 8. Associate existing notifications with tenant
  const notifications = await prisma.notification.findMany({ where: { tenantId: null } });
  if (notifications.length > 0) {
    await prisma.notification.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    });
    console.log(`✅ Associated ${notifications.length} notifications with default tenant`);
  }

  // 9. Associate existing audit logs with tenant
  const auditLogs = await prisma.auditLog.findMany({ where: { tenantId: null } });
  if (auditLogs.length > 0) {
    await prisma.auditLog.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    });
    console.log(`✅ Associated ${auditLogs.length} audit logs with default tenant`);
  }

  // 10. Associate existing app settings with tenant
  const settings = await prisma.appSetting.findMany({ where: { tenantId: null } });
  if (settings.length > 0) {
    await prisma.appSetting.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    });
    console.log(`✅ Associated ${settings.length} app settings with default tenant`);
  }

  // 11. Associate existing invitations with tenant
  const invitations = await prisma.invitation.findMany({ where: { tenantId: null } });
  if (invitations.length > 0) {
    await prisma.invitation.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    });
    console.log(`✅ Associated ${invitations.length} invitations with default tenant`);
  }

  console.log('\n🎉 Multi-tenant migration complete!');
  console.log(`\n📋 Default Tenant Summary:`);
  console.log(`   Name: ${tenant.name}`);
  console.log(`   Slug: ${tenant.slug}`);
  console.log(`   ID:   ${tenant.id}`);
  console.log(`   Plan: ${tenant.plan}`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
