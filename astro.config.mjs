import { defineConfig, passthroughImageService } from 'astro/config';
import vercel from '@astrojs/vercel';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';

// Default to Vercel adapter (used in production on Vercel), allow node fallback if specified
const isNodeTarget = process.env.BUILD_TARGET === 'node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  security: {
    checkOrigin: false,
  },
  image: {
    service: passthroughImageService(),
  },
  adapter: isNodeTarget
    ? node({ mode: 'standalone' })
    : vercel(),
  integrations: [
    tailwind(),
  ],
});
