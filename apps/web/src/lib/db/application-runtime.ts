import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

type Environment = Readonly<Record<string, string | undefined>>;

type ApplicationRuntime = Readonly<{ databaseUrl: string; origin: string }>;

type DatabaseTarget = Readonly<{ host: string; port: string; name: string }>;

let applicationDatabase: PrismaClient | null = null;
let applicationDatabaseUrl: string | null = null;

function parseUrl(value: string | undefined, label: string): URL {
  if (!value) throw new Error(`${label} is required`);
  try {
    return new URL(value);
  } catch {
    throw new Error(`${label} is invalid`);
  }
}

function databaseTarget(value: string | undefined, label: string): DatabaseTarget {
  const url = parseUrl(value, label);
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    throw new Error(`${label} must use PostgreSQL`);
  }
  for (const key of url.searchParams.keys()) {
    if (['host', 'hostaddr', 'port', 'database', 'dbname'].includes(key.toLowerCase())) {
      throw new Error(`${label} must not use a database target override`);
    }
  }
  let name: string;
  let host: string;
  try {
    name = decodeURIComponent(url.pathname.slice(1));
    host = decodeURIComponent(url.hostname).toLowerCase().replace(/\.$/, '');
  } catch {
    throw new Error(`${label} has an invalid database target`);
  }
  const port = url.port ? Number(url.port) : 5432;
  if (!host || !name || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${label} must name a PostgreSQL database on a valid host and port`);
  }
  return { host, port: String(port), name };
}

function isLoopback(hostname: string): boolean {
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '[::1]';
}

export function validateApplicationRuntime(environment: Environment): ApplicationRuntime {
  if (environment.REFVIEW_SESSION_TEST_MODE === '1') {
    throw new Error('application runtime is unavailable in isolated session test mode');
  }

  const databaseUrl = environment.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  const applicationTarget = databaseTarget(databaseUrl, 'DATABASE_URL');
  if (applicationTarget.name.endsWith('_test')) {
    throw new Error('DATABASE_URL must not target a test database');
  }
  if (environment.TEST_DATABASE_URL) {
    const testTarget = databaseTarget(environment.TEST_DATABASE_URL, 'TEST_DATABASE_URL');
    if (applicationTarget.host === testTarget.host &&
      applicationTarget.port === testTarget.port &&
      applicationTarget.name === testTarget.name) {
      throw new Error('DATABASE_URL must be separate from the test database');
    }
  }

  const originValue = environment.REFVIEW_APP_ORIGIN;
  if (!originValue) throw new Error('REFVIEW_APP_ORIGIN is required');
  const origin = parseUrl(originValue, 'REFVIEW_APP_ORIGIN');
  if (origin.username || origin.password || origin.hostname.includes('*') ||
    originValue.includes(',') || origin.pathname !== '/' || origin.search || origin.hash ||
    origin.origin !== originValue) {
    throw new Error('REFVIEW_APP_ORIGIN must be one exact serialized origin');
  }
  if (environment.NODE_ENV === 'production') {
    if (origin.protocol !== 'https:') throw new Error('production origin must use HTTPS');
  } else if (origin.protocol !== 'https:' &&
    !(origin.protocol === 'http:' && isLoopback(origin.hostname) && origin.port)) {
    throw new Error('development HTTP origin must use loopback with an explicit port');
  }

  return { databaseUrl, origin: origin.origin };
}

export function openApplicationDatabase(): PrismaClient {
  const { databaseUrl } = validateApplicationRuntime(process.env);
  if (applicationDatabase) {
    if (applicationDatabaseUrl !== databaseUrl) {
      throw new Error('application database target changed after initialization');
    }
    return applicationDatabase;
  }
  applicationDatabase = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  applicationDatabaseUrl = databaseUrl;
  return applicationDatabase;
}
