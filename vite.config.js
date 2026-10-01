import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // public/ is already the default; explicit for clarity
  publicDir: 'public',
  build: {
    sourcemap: false, // Prevents source code from being visible in devtools in production
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            if (id.includes('ogl')) {
              return 'ogl-vendor';
            }
            if (id.includes('swiper')) {
              return 'swiper-vendor';
            }
            if (id.includes('lenis')) {
              return 'lenis-vendor';
            }
            return 'vendor';
          }
        }
      }
    }
  }
});
