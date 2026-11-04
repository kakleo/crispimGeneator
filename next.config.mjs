import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep the headless-Chromium packages out of the bundle so the /pdf route can launch them
  // Make sure Vercel ships the Chromium binary (.br files are loaded by path, so tracing misses them)
  // and doesn't bloat the function with the full puppeteer package (250 MB function limit)
  outputFileTracingIncludes: {
    '/p/[proposal_id]/pdf': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/export-pdf': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
  outputFileTracingExcludes: {
    '/p/[proposal_id]/pdf': ['./node_modules/puppeteer/**', './node_modules/@puppeteer/**'],
    '/api/export-pdf': ['./node_modules/puppeteer/**', './node_modules/@puppeteer/**'],
  },
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core', 'puppeteer'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default withPayload(nextConfig);
