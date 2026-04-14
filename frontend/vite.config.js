import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load VITE_* from both frontend/ and repo root (many people put .env next to supabase/)
function mergeViteEnv(mode) {
  const pkgRoot = __dirname
  const repoRoot = path.join(__dirname, '..')
  const fromRepo = loadEnv(mode, repoRoot, 'VITE_')
  const fromPkg = loadEnv(mode, pkgRoot, 'VITE_')
  return { ...fromRepo, ...fromPkg }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const merged = mergeViteEnv(mode)
  const define = Object.fromEntries(
    Object.entries(merged).map(([key, value]) => [
      `import.meta.env.${key}`,
      JSON.stringify(value ?? ''),
    ]),
  )

  return {
    plugins: [react(), tailwindcss()],
    define,
  }
})
