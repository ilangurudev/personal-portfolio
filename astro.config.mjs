// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';

import tailwindcss from '@tailwindcss/vite';

// Only use Netlify adapter in production/preview (not dev)
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('build') || process.argv.includes('preview');

// https://astro.build/config
export default defineConfig({
  adapter: isProduction ? netlify() : undefined,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});
