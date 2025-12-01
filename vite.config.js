import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    Module: {}
  },
  build: {
    chunkSizeWarningLimit: 4000, // Suppress large chunk warnings (due to OCR models/libs)
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ['path', 'fs', 'crypto', 'stream', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/*.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000, // 5MB to accommodate PaddleOCR
      },
      manifest: {
        name: 'HB Go',
        short_name: 'HB Go',
        description: 'Scan. Tag. Export.',
        theme_color: '#2563EB',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/hb-go/',
        scope: '/hb-go/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  // REPLACE 'hb-go' WITH YOUR ACTUAL GITHUB REPO NAME
  base: '/hb-go/',
})
