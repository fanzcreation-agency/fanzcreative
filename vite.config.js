import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const cloudinaryMedia = JSON.parse(readFileSync(new URL('./src/cloudinary-media.json', import.meta.url)));

function replaceMediaUrls(source) {
  return Object.entries(cloudinaryMedia).reduce(
    (result, [localUrl, media]) => result.replaceAll(localUrl, media.url),
    source,
  );
}

function cloudinaryMediaPlugin() {
  return {
    name: 'cloudinary-media-urls',
    enforce: 'pre',
    transform(source, id) {
      if (!/[\\/]src[\\/].*\.[jt]sx?$/.test(id) || /[\\/]src[\\/]media\.js$/.test(id)) return;
      return replaceMediaUrls(source);
    },
    transformIndexHtml(source) {
      return replaceMediaUrls(source).replace(
        '__HERO_POSTER__',
        cloudinaryMedia['/assets/videos/promo-reel.mp4'].poster,
      );
    },
  };
}

export default defineConfig({
  plugins: [cloudinaryMediaPlugin(), react()],
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
