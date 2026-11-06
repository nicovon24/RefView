import { describe, expect, it } from 'vitest';
import { validateApplicationRuntime } from './application-runtime';

const valid = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://app:secret@127.0.0.1:5432/refview',
  TEST_DATABASE_URL: 'postgresql://test:secret@127.0.0.1:5432/refview_test',
  REFVIEW_APP_ORIGIN: 'http://localhost:3000',
};

describe('application runtime admission', () => {
  it('accepts a separate PostgreSQL target and exact development loopback origin', () => {
    expect(validateApplicationRuntime(valid)).toEqual({
      databaseUrl: valid.DATABASE_URL,
      origin: valid.REFVIEW_APP_ORIGIN,
    });
    expect(validateApplicationRuntime({ ...valid, TEST_DATABASE_URL: undefined })).toEqual({
      databaseUrl: valid.DATABASE_URL,
      origin: valid.REFVIEW_APP_ORIGIN,
    });
  });

  it.each([undefined, '', 'not a url', 'sqlite:///refview', 'postgresql://localhost/',
    'postgresql://localhost/refview_test', 'postgresql://localhost/other_test?schema=public'])
  ('rejects missing, malformed, non-PostgreSQL, empty, and test application databases: %s', (databaseUrl) => {
    expect(() => validateApplicationRuntime({ ...valid, DATABASE_URL: databaseUrl })).toThrow();
  });

  it('rejects the test target after host, port, and database normalization', () => {
    expect(() => validateApplicationRuntime({
      ...valid,
      DATABASE_URL: 'postgres://app:one@LOCALHOST/ref%76iew?schema=app',
      TEST_DATABASE_URL: 'postgresql://test:two@localhost:5432/refview?schema=test',
    })).toThrow(/test database/i);
    expect(() => validateApplicationRuntime({
      ...valid,
      DATABASE_URL: 'postgresql://app@localhost:05432/refview',
      TEST_DATABASE_URL: 'postgresql://test@localhost:5432/refview',
    })).toThrow(/test database/i);
  });

  it.each([
    { DATABASE_URL: 'postgresql://app@different:5432/refview?host=127.0.0.1' },
    { DATABASE_URL: 'postgresql://app@127.0.0.1:5433/refview?port=5432' },
    { TEST_DATABASE_URL: 'postgresql://test@different:5432/refview?host=127.0.0.1' },
    { TEST_DATABASE_URL: 'postgresql://test@127.0.0.1:5433/refview?port=5432' },
  ])('rejects PostgreSQL query parameters that override the target: %o', (override) => {
    expect(() => validateApplicationRuntime({ ...valid, ...override })).toThrow(/target override/i);
  });

  it('rejects malformed optional test target and isolated session test mode', () => {
    expect(() => validateApplicationRuntime({ ...valid, TEST_DATABASE_URL: 'invalid' })).toThrow();
    expect(() => validateApplicationRuntime({ ...valid, DATABASE_URL: 'postgresql://localhost:abc/refview' })).toThrow();
    expect(() => validateApplicationRuntime({ ...valid, REFVIEW_SESSION_TEST_MODE: '1' }))
      .toThrow(/test mode/i);
  });

  it.each([undefined, '', 'not a url', 'http://localhost', 'http://example.com:3000',
    'http://localhost:3000/', 'http://localhost:3000/path', 'http://localhost:3000?x=1',
    'http://localhost:3000#fragment', 'http://user:pass@localhost:3000',
    'http://*.example.com:3000', 'http://localhost:3000,https://example.com'])
  ('rejects invalid development origins: %s', (origin) => {
    expect(() => validateApplicationRuntime({ ...valid, REFVIEW_APP_ORIGIN: origin })).toThrow();
  });

  it('accepts IPv6 loopback HTTP and production HTTPS, but rejects production HTTP', () => {
    expect(validateApplicationRuntime({ ...valid, REFVIEW_APP_ORIGIN: 'http://[::1]:3000' }).origin)
      .toBe('http://[::1]:3000');
    expect(validateApplicationRuntime({ ...valid, NODE_ENV: 'production', REFVIEW_APP_ORIGIN: 'https://example.com' }).origin)
      .toBe('https://example.com');
    expect(() => validateApplicationRuntime({ ...valid, NODE_ENV: 'production' }))
      .toThrow(/HTTPS/i);
    expect(() => validateApplicationRuntime({ ...valid, NODE_ENV: 'production', REFVIEW_APP_ORIGIN: 'https://*.example.com' }))
      .toThrow();
  });
});
