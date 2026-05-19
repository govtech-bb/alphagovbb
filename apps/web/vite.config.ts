import { defineConfig } from 'vitest/config'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), devtools(), tanstackStart(), viteReact()],
  test: {
    exclude: ['node_modules/**', 'dist/**', '.output/**', 'e2e/**'],
  },
})

export default config
