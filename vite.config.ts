import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Higher Ground Discovery (concept prototype)',
        short_name: 'Higher Ground',
        display: 'fullscreen',
        background_color: '#0c1220',
        theme_color: '#0c1220',
        icons: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,webp,svg}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  build: { target: 'es2022', sourcemap: false },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
