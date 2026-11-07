import type { NextConfig } from 'next';

const config: NextConfig = {
  distDir: process.env.REFVIEW_SESSION_TEST_MODE === '1'
    ? '.next-session-test'
    : process.env.REFVIEW_SOCIAL_ACCEPTANCE_MODE === '1' ? '.next-social-acceptance' : '.next',
  experimental: { serverActions: { bodySizeLimit: '256kb' } },
};

export default config;
