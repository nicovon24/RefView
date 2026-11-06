import { describe, expect, it } from 'vitest';
import { validateSessionTestRuntime } from './session-runtime';

const valid = {
  NODE_ENV: 'development', REFVIEW_SESSION_TEST_MODE: '1',
  REFVIEW_ORIGIN: 'http://127.0.0.1:3001',
  DATABASE_URL: 'postgresql://user:pass@127.0.0.1:55439/refview',
  TEST_DATABASE_URL: 'postgresql://user:pass@127.0.0.1:55439/refview_test',
};

describe('isolated session transport runtime', () => {
  it('accepts only explicit development test configuration', () => {
    expect(validateSessionTestRuntime(valid)).toEqual({ origin: valid.REFVIEW_ORIGIN });
    expect(() => validateSessionTestRuntime({ ...valid, REFVIEW_SESSION_TEST_MODE: undefined }))
      .toThrow(/explicit test mode/);
    expect(() => validateSessionTestRuntime({ ...valid, NODE_ENV: 'production' }))
      .toThrow(/production/);
  });

  it('requires a distinct loopback PostgreSQL test target', () => {
    expect(() => validateSessionTestRuntime({ ...valid, TEST_DATABASE_URL: undefined }))
      .toThrow(/test database/);
    expect(() => validateSessionTestRuntime({ ...valid,
      TEST_DATABASE_URL: valid.DATABASE_URL })).toThrow(/isolated test database/);
    expect(() => validateSessionTestRuntime({ ...valid,
      TEST_DATABASE_URL: 'postgresql://user:pass@remote.example/refview_test' }))
      .toThrow(/loopback/);
    expect(() => validateSessionTestRuntime({ ...valid,
      TEST_DATABASE_URL: 'postgresql://user:pass@127.0.0.1/refview' }))
      .toThrow(/isolated test database/);
  });

  it('requires one exact loopback browser origin', () => {
    expect(() => validateSessionTestRuntime({ ...valid, REFVIEW_ORIGIN: undefined }))
      .toThrow(/origin/);
    expect(() => validateSessionTestRuntime({ ...valid,
      REFVIEW_ORIGIN: 'https://example.com' })).toThrow(/loopback/);
    expect(() => validateSessionTestRuntime({ ...valid,
      REFVIEW_ORIGIN: 'http://127.0.0.1:3001/path' })).toThrow(/origin/);
  });
});
