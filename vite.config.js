import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/*.png'],
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
