import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

export function openTestDatabase(): PrismaClient {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error('TEST_DATABASE_URL is required for the real PostgreSQL smoke test.');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
