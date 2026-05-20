import { defineConfig } from 'vitest/config'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), devtools(), tanstackStart(), viteReact()],
  preview: {
    // `vite preview` blocks requests whose Host header isn't in this list
    // (DNS-rebinding protection). The e2e suite reaches the app by its
    // resolved container IP — which changes per compose run — so the
    // allow-list is permissive. Acceptable because the preview server
    // is only ever exposed on the verify-profile docker network and is
    // not used in production (Amplify serves prod traffic).
    allowedHosts: true,
  },
  test: {
    exclude: ['node_modules/**', 'dist/**', '.output/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/routeTree.gen.ts',
      ],
    },
  },
})

export default config
