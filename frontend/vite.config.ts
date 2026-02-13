import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    allowedHosts: ['mm.paysyslabs.com'],
    proxy: {
      '/nats-proxy': {
        target: 'http://10.10.80.37:4000', //Check
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nats-proxy/, ''),
        secure: false,
      }
    }
  },
})

