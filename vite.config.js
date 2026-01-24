import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0', // Allow access from any IP
    port: 3007
  },
  preview: {
    host: '0.0.0.0',
    port: 3007
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
});
