// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@streamguard.com';
  const plainPassword = 'password123';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists. Checking role...');
    if (existingAdmin.role !== 'ADMIN') {
        await prisma.user.update({
            where: { email: adminEmail },
            data: { role: 'ADMIN' },
        });
        console.log('Updated existing user role to ADMIN.');
    } else {
        console.log('Admin user is already set up properly.');
    }
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      username: 'StreamGuardAdmin',
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
      bio: 'Official StreamGuard Administrator',
    },
  });

  console.log(`Admin user created!`);
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${plainPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
