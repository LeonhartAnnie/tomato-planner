import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['tomato.svg'],
    manifest: {
      name: 'Tomato Planner',
      short_name: 'Tomato',
      description: '番茄鐘排程工具',
      lang: 'zh-TW',
      theme_color: '#c24132',
      background_color: '#fff8f2',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: 'tomato.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        }
      ]
    }
  }), cloudflare()]
})