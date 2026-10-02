import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { apiMiddleware } from './server/dev-api.js';

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['FIREBASE_SERVICE_ACCOUNT_JSON', 'GOOGLE_APPLICATION_CREDENTIALS', 'CLOUDINARY_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
    if (env[key]) process.env[key] = env[key];
  }
  return {
  plugins: [cloudinaryMediaPlugin(), react(), {
    name: 'local-content-api',
    configureServer(server) { server.middlewares.use(apiMiddleware); },
    configurePreviewServer(server) { server.middlewares.use(apiMiddleware); },
  }],
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
  };
});
