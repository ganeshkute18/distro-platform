/**
 * DistroPro — Platform Admin Seed Script
 *
 * Creates the PLATFORM_ADMIN account (you — Ganesh / DistroPro owner).
 * Run ONCE after first deployment to AWS RDS.
 *
 * Usage:
 *   docker exec -it distro-api npx ts-node prisma/setup-platform-admin.ts
 *
 * Or locally (with DATABASE_URL pointing to RDS):
 *   npx ts-node apps/api/prisma/setup-platform-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();

function prompt(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      process.stdout.write(question);
      process.stdin.setRawMode(true);
      let input = '';
      process.stdin.on('data', (char) => {
        const c = char.toString();
        if (c === '\n' || c === '\r') {
          process.stdin.setRawMode(false);
          rl.close();
          console.log('');
          resolve(input);
        } else if (c === '\u0003') {
          process.exit();
        } else if (c === '\u007f') {
          input = input.slice(0, -1);
        } else {
          input += c;
        }
      });
    } else {
      rl.question(question, (answer) => { rl.close(); resolve(answer); });
    }
  });
}

async function main() {
  console.log('\n════════════════════════════════════════════════════');
  console.log('  DistroPro — Platform Admin Setup');
  console.log('════════════════════════════════════════════════════\n');

  // Check if PLATFORM_ADMIN already exists
  const existing = await prisma.user.findFirst({
    where: { role: 'PLATFORM_ADMIN' },
    select: { id: true, email: true, name: true },
  });

  if (existing) {
    console.log(`⚠️  Platform admin already exists:`);
    console.log(`   Name:  ${existing.name}`);
    console.log(`   Email: ${existing.email}`);
    const overwrite = await prompt('\nDo you want to reset their password? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\n✅ No changes made. Exiting.\n');
      return;
    }

    const newPassword = await prompt('New password (min 12 chars): ', true);
    if (newPassword.length < 12) throw new Error('Password must be at least 12 characters');

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash: hash },
    });

    console.log(`\n✅ Password updated for ${existing.email}\n`);
    return;
  }

  // Collect new admin details
  const name     = await prompt('Platform admin name (e.g. Ganesh Kute): ');
  const email    = await prompt('Email address: ');
  const password = await prompt('Password (min 12 chars): ', true);

  if (!name || !email || !password) throw new Error('All fields are required');
  if (password.length < 12) throw new Error('Password must be at least 12 characters');
  if (!email.includes('@')) throw new Error('Invalid email address');

  // Check email not already taken
  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) throw new Error(`Email ${email} is already registered`);

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: 'PLATFORM_ADMIN',
      isActive: true,
      emailVerified: true,
      approvalStatus: 'APPROVED',
    },
  });

  console.log('\n════════════════════════════════════════════════════');
  console.log('  ✅  Platform Admin Created Successfully!');
  console.log('════════════════════════════════════════════════════');
  console.log(`  ID:    ${admin.id}`);
  console.log(`  Name:  ${admin.name}`);
  console.log(`  Email: ${admin.email}`);
  console.log(`  Role:  PLATFORM_ADMIN`);
  console.log('\n  ⚠️  Store these credentials securely — they grant');
  console.log('      full platform access.\n');
  console.log('  Next step: Use POST /auth/login to get your JWT,');
  console.log('  then POST /tenants/onboard to create distributor accounts.\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Setup failed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
