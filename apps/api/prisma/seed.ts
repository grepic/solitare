import { PrismaClient, UserRole, OAuthProvider } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await argon2.hash('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@solitaire.com' },
    update: {},
    create: {
      email: 'admin@solitaire.com',
      passwordHash: adminPassword,
      nickname: 'Admin',
      oauthProvider: OAuthProvider.EMAIL,
      role: UserRole.ADMIN,
      profile: {
        create: {
          country: 'US',
          ageVerified: true,
          xp: 0,
          level: 1,
        },
      },
      wallet: {
        create: {
          balanceCents: 0,
          lockedCents: 0,
        },
      },
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create test users
  const testPassword = await argon2.hash('test123');
  const testUsers = [];

  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: { email: `player${i}@test.com` },
      update: {},
      create: {
        email: `player${i}@test.com`,
        passwordHash: testPassword,
        nickname: `Player${i}`,
        oauthProvider: OAuthProvider.EMAIL,
        profile: {
          create: {
            country: 'US',
            ageVerified: true,
            xp: i * 100,
            level: i,
            totalMatches: i * 10,
            wins: i * 6,
            losses: i * 4,
          },
        },
        wallet: {
          create: {
            balanceCents: 10000, // $100
            lockedCents: 0,
          },
        },
      },
    });

    testUsers.push(user);
    console.log(`✅ Created test user: ${user.email}`);
  }

  // Create config flags
  await prisma.configFlag.upsert({
    where: { key: 'maintenance_mode' },
    update: {},
    create: {
      key: 'maintenance_mode',
      valueJson: { enabled: false },
      description: 'Enable/disable maintenance mode',
    },
  });

  await prisma.configFlag.upsert({
    where: { key: 'new_registrations' },
    update: {},
    create: {
      key: 'new_registrations',
      valueJson: { enabled: true },
      description: 'Enable/disable new user registrations',
    },
  });

  console.log('✅ Created config flags');

  // Add restricted regions (example)
  await prisma.restrictedRegion.upsert({
    where: { countryCode_stateCode: { countryCode: 'US', stateCode: 'WA' } },
    update: {},
    create: {
      countryCode: 'US',
      stateCode: 'WA',
      reason: 'State regulations',
      isActive: false, // Disabled for testing
    },
  });

  console.log('✅ Created restricted regions');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
