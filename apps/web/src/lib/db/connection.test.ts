import 'dotenv/config';
import { afterAll, describe, expect, it } from 'vitest';
import { openTestDatabase } from './connection';

const database = openTestDatabase();

afterAll(async () => {
  await database.$disconnect();
});

describe('real PostgreSQL connection through generated Prisma client', () => {
  it('refuses the application database as a test target', () => {
    const prior = process.env.TEST_DATABASE_URL;
    try {
      process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;
      expect(() => openTestDatabase()).toThrow(/isolated test database/);
    } finally {
      process.env.TEST_DATABASE_URL = prior;
    }
  });

  it('returns database identity and server version', async () => {
    const rows = await database.$queryRaw<Array<{ connected: number; database: string; version: string }>>`
      SELECT 1 AS connected, current_database() AS database, version() AS version
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.connected).toBe(1);
    expect(rows[0]?.database).toMatch(/_test$/);
    expect(rows[0]?.version).toContain('PostgreSQL');
  });
});
