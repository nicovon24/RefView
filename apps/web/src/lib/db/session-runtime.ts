import { openTestDatabase } from './connection';
import type { PrismaClient } from '../../generated/prisma/client';

type Environment = Readonly<Record<string, string | undefined>>;
let sessionTestDatabase: PrismaClient | null = null;

function parsedUrl(value: string | undefined, label: string): URL {
  if (!value) throw new Error(`${label} is required`);
  try { return new URL(value); }
  catch { throw new Error(`${label} is invalid`); }
}

function isLoopback(hostname: string): boolean {
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '[::1]';
}

export function validateSessionTestRuntime(environment: Environment): { origin: string } {
  if (environment.NODE_ENV === 'production') throw new Error('session test mode is unavailable in production');
  if (environment.REFVIEW_SESSION_TEST_MODE !== '1') throw new Error('explicit test mode is required');
  const test = parsedUrl(environment.TEST_DATABASE_URL, 'test database');
  const app = parsedUrl(environment.DATABASE_URL, 'application database');
  if (!['postgresql:', 'postgres:'].includes(test.protocol) || !isLoopback(test.hostname)) {
    throw new Error('test database must be loopback PostgreSQL');
  }
  const testName = decodeURIComponent(test.pathname.slice(1));
  const appName = decodeURIComponent(app.pathname.slice(1));
  if (!testName.endsWith('_test') || testName === appName) {
    throw new Error('isolated test database is required');
  }
  const origin = parsedUrl(environment.REFVIEW_ORIGIN, 'origin');
  if (!['http:', 'https:'].includes(origin.protocol) || !isLoopback(origin.hostname)) {
    throw new Error('origin must be loopback HTTP');
  }
  if (!origin.port || origin.username || origin.password || origin.pathname !== '/' ||
    origin.search || origin.hash || origin.origin !== environment.REFVIEW_ORIGIN) {
    throw new Error('origin must be an exact loopback origin with an explicit port');
  }
  return { origin: origin.origin };
}

export function openSessionTestDatabase() {
  validateSessionTestRuntime(process.env);
  sessionTestDatabase ??= openTestDatabase();
  return sessionTestDatabase;
}
