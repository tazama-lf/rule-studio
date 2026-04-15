import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())


  let allowedHosts: true | string[]

  if (env.VITE_ALLOWED_HOSTS === 'all') {
    allowedHosts = true
  } else if (env.VITE_ALLOWED_HOSTS) {
    allowedHosts = env.VITE_ALLOWED_HOSTS
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