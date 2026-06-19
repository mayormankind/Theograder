import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Cache in globalThis in ALL environments so warm lambda re-invocations
// reuse the same client instead of opening a new connection pool each time.
globalForPrisma.prisma = prisma;
