import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Vite 8 起底层换为 rolldown，manualChunks 只接受函数形式，不再支持对象映射
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (/node_modules[\/](react|react-dom|scheduler)[\/]/.test(id)) return 'vendor-react'
          if (/node_modules[\/]lucide-react[\/]/.test(id)) return 'vendor-lucide'
        }
      }
    }
  }
})
