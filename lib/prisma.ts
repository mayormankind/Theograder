import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Bound the connection pool per serverless function so the aggregate across all
// concurrently running Vercel functions never exceeds the database/pooler limit
// (e.g. Neon/Supabase default of 15), which otherwise raises
// `(EMAXCONNSESSION) max clients reached`.
function buildConnectionUrl(): string {
  const base = process.env.DATABASE_URL ?? '';
  if (!base) return base;

  const url = new URL(base);
  const params = url.searchParams;

  // Keep the pool tiny per function; Prisma queues queries internally.
  if (!params.has('connection_limit')) {
    params.set('connection_limit', process.env.PRISMA_CONNECTION_LIMIT ?? '1');
  }
  if (!params.has('pool_timeout')) {
    params.set('pool_timeout', '20');
  }
  if (!params.has('connection_timeout')) {
    params.set('connection_timeout', '15');
  }

  return url.toString();
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: buildConnectionUrl(),
      },
    },
  });

// Cache in globalThis in ALL environments so warm lambda re-invocations
// reuse the same client instead of opening a new connection pool each time.
globalForPrisma.prisma = prisma;
