// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://ilanguru.dev',
  adapter: netlify(),
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()]
  }
});
