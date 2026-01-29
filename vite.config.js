import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Check if SSL certificates exist
const certPath = path.resolve('./certs/cert.pem');
const keyPath = path.resolve('./certs/key.pem');
const hasSSL = fs.existsSync(certPath) && fs.existsSync(keyPath);

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3007,
    https: hasSSL ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    } : false,
    allowedHosts: ['collage.heliad.ru', 'localhost']
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
