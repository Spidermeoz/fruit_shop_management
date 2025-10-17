import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 🔥 thay bằng port backend thật của bạn
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
