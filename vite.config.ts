import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm] }) },
    react({ include: /\.(mdx|tsx?)$/ }),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    // three.js alone is ~700 kB minified; it is split into its own lazily loaded chunk.
    chunkSizeWarningLimit: 1100,
  },
  test: {
    include: ['src/tests/**/*.test.ts'],
  },
})
