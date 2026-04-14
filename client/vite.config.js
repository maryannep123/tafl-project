import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => ({
  // When deployed to GitHub Pages under /<repo>/, assets must be rooted at that path.
  base: process.env.GITHUB_PAGES === 'true' ? '/tafl-project/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      },
    },
  },
}))
