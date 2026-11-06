import type { NextConfig } from 'next';

const config: NextConfig = {
  distDir: process.env.REFVIEW_SESSION_TEST_MODE === '1' ? '.next-session-test' : '.next',
  experimental: { serverActions: { bodySizeLimit: '256kb' } },
};

export default config;
