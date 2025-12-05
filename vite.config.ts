import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'popup.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    global: 'globalThis',
  },
  server: {
    allowedHosts: ['.ngrok-free.app', '.ngrok.io'],
    proxy: {
      '/planner': {
        // Use environment variable for Docker compatibility
        // In Docker: VITE_PLANNER_BACKEND_URL=http://planner-backend:8081
        // Local dev: defaults to localhost:8081
        target: process.env.VITE_PLANNER_BACKEND_URL || 'http://localhost:8081',
        changeOrigin: true,
        cookieDomainRewrite: '',  // Rewrite cookie domain to match frontend
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Forward the original host to backend so it can construct correct URLs
            const host = req.headers.host;
            if (host) {
              proxyReq.setHeader('X-Forwarded-Host', host);
              proxyReq.setHeader('X-Forwarded-Proto', host.includes('ngrok') ? 'https' : 'http');
            }
          });
        },
      },
      '/config': {
        target: process.env.VITE_PLANNER_BACKEND_URL || 'http://localhost:8081',
        changeOrigin: true,
      },
      // Proxy /auth to PlexiFinance backend, but bypass for OAuth callbacks that need SPA handling
      '/auth': {
        // Use environment variable for Docker compatibility
        // In Docker: VITE_FINANCE_BACKEND_URL=http://plexifinance-backend:7777
        // Local dev: defaults to localhost:7777
        target: process.env.VITE_FINANCE_BACKEND_URL || 'http://localhost:7777',
        changeOrigin: true,
        bypass: (req) => {
          // Don't proxy Trello callback - let SPA handle it
          if (req.url?.startsWith('/auth/trello/callback')) {
            return '/index.html';
          }
        },
      },
    },
  },
})