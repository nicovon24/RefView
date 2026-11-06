import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

export function openTestDatabase(): PrismaClient {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error('TEST_DATABASE_URL is required for the real PostgreSQL smoke test.');
  }
  const testTarget = new URL(connectionString);
  const appTarget = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
  const databaseName = decodeURIComponent(testTarget.pathname.slice(1));
  const appDatabaseName = appTarget ? decodeURIComponent(appTarget.pathname.slice(1)) : null;
  if (!databaseName.endsWith('_test') || databaseName === appDatabaseName) {
    throw new Error('TEST_DATABASE_URL must target an isolated test database.');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
