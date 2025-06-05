import { defineConfig } from 'vite';

export default defineConfig({
  base: '/wildfires_map/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
