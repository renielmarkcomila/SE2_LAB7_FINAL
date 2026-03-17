import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 🚀 THIS FIXES THE WHITE SCREEN! 
  // It matches your repo name: /se2-lab6-frontend/
  base: '/se2-lab6-frontend/' 
})