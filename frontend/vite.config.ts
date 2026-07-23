import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const envFromFile = loadEnv(mode, process.cwd())

  const VITE_ALLOWED_HOSTS = process.env.VITE_ALLOWED_HOSTS ?? envFromFile.VITE_ALLOWED_HOSTS

  let allowedHosts: true | string[]

  if (VITE_ALLOWED_HOSTS === 'all') {
    allowedHosts = true
  } else if (VITE_ALLOWED_HOSTS) {
    allowedHosts = VITE_ALLOWED_HOSTS
      .split(',')
      .map((host) => host.trim())
  } else {
    allowedHosts = []
  }


  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5174,
      allowedHosts,
    },
  }
})