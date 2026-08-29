import { fileURLToPath, URL } from 'node:url'

import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // The browser only ever talks to its own origin: the dev server proxies
  // `/api` to the backend. That keeps cookies same-site and removes the need
  // for permissive CORS in development.
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    server: {
      // Matches the backend's default ALLOWED_ORIGINS entry.
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          // SSE (`POST /chatbot/chat/stream`) must not be buffered by the proxy.
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes) => {
              if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
                proxyRes.headers['cache-control'] = 'no-cache, no-transform'
              }
            })
          },
        },
      },
    },

    preview: {
      port: 3000,
      strictPort: true,
    },

    build: {
      target: 'es2023',
      // Source maps are useful in CI/staging but leak original source in prod.
      sourcemap: mode !== 'production',
      reportCompressedSize: false,
    },

    test: {
      environment: 'jsdom',
      // Node's `fetch`/`Request` (used under jsdom) reject origin-relative
      // URLs, so tests run against an absolute base.
      env: {
        VITE_API_BASE_URL: 'http://localhost:3000/api/v1',
        VITE_ENABLE_DEVTOOLS: 'false',
      },
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      restoreMocks: true,
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  }
})
