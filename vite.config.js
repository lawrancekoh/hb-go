import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { version } from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    Module: {},
    '__APP_VERSION__': JSON.stringify(version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 30000000,
      },
      includeAssets: ['favicon.png', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'HB Go',
        short_name: 'HB Go',
        description: 'The Intelligent, Offline-First Companion for HomeBank',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
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
