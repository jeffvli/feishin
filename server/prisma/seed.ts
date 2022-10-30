import { PrismaClient, Prisma } from '@prisma/client';
import { randomString } from '../utils';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword =
    '$2y$12$icIH42ono1yTBypZ34V/PuDMXIbMD04GtSB6pgYpcwbjjIvujzv2y';

  let error;
  do {
    try {
      await prisma.user.upsert({
        create: {
          deviceId: `admin_${randomString(10)}`,
          enabled: true,
          isAdmin: true,
          password: hashedPassword,
          username: 'admin',
        },
        update: {},
        where: { username: 'admin' },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientInitializationError) {
        error = 'retry';
      }

      error = undefined;
    }
  } while (error === 'retry');
}

main()
  .catch((e) => {
    console.error(e);
    // process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
