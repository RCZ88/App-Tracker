import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(async () => {
  const plugins = [react(), tailwindcss()];
  return {
    plugins,
    base: './',
    build: {
      sourcemap: true,
    },
  };
})
