import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/', // IMPORTANT
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    commonjsOptions: {
      // antd v3 / rc-* packages ship mixed ESM files that still contain require(...)
      // this makes Vite transform those calls for browser bundles.
      transformMixedEsModules: true,
    },
  },
  server: {
    proxy: {
      //  API PROXY (already correct)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const location = proxyRes.headers['location'];
            if (location && typeof location === 'string' && location.includes('localhost:8000')) {
              proxyRes.headers['location'] = location.replace('http://localhost:8000', '');
            }
          });
        },
      },

      //  PDF ISSUE FIX
      '/sds_sheets': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})