import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/rtms': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rtms/, '')
      },
      '/api/travel': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/travel/, '')
      },
      '/api/health': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/health/, '')
      },
      '/api/safetydata': {
        target: 'https://www.safetydata.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/safetydata/, '')
      },
      '/api/seoul': {
        target: 'http://openapi.seoul.go.kr:8088',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/seoul/, '')
      },
      '/api/youth': {
        target: 'https://www.youthcenter.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/youth/, '')
      },
      '/api/neis': {
        target: 'https://open.neis.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/neis/, '')
      },
      '/api/childcare': {
        target: 'http://api.childcare.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/childcare/, '')
      }
    }
  }
})
