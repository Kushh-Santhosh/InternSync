import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { handleApiRequest } from './src/server/api-handler.ts'

function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'internsync-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleApiRequest(req, res)
          if (!handled) {
            next()
          }
        } catch {
          next()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiMiddlewarePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
