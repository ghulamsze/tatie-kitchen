import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      {
        name: 'spa-404-fallback-generator',
        closeBundle() {
          const distDir = path.resolve(__dirname, 'dist');
          const indexHtml = path.resolve(distDir, 'index.html');
          const notFoundHtml = path.resolve(distDir, '404.html');
          if (fs.existsSync(indexHtml)) {
            fs.copyFileSync(indexHtml, notFoundHtml);
          }
        },
      },
      {
        name: 'spa-device-fallback',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url && (req.url.startsWith('/device') || req.url === '/device')) {
              const queryIndex = req.url.indexOf('?');
              const query = queryIndex !== -1 ? req.url.slice(queryIndex) : '';
              req.url = '/index.html' + query;
            }
            next();
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url && (req.url.startsWith('/device') || req.url === '/device')) {
              const queryIndex = req.url.indexOf('?');
              const query = queryIndex !== -1 ? req.url.slice(queryIndex) : '';
              req.url = '/index.html' + query;
            }
            next();
          });
        },
      },
    ],
    // Mengizinkan prefix aman: NEXT_PUBLIC_, SUPABASE publik, dan VITE_ (tanpa secret key)
    envPrefix: ['VITE_', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_'],
    define: {
      'process.env.SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL || ''),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL || ''),
      'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
