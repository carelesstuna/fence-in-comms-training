import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { asrModelsPlugin, messreihePlugin } from './scripts/vite-dev-plugins.ts'
import { licenseCollector, licensePlugin } from './scripts/license-plugin.ts'

const root = fileURLToPath(new URL('.', import.meta.url))

// Cross-Origin-Isolation: Erst damit rechnet die Spracherkennung (onnxruntime-web) mit mehreren Threads.
const isolation = { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' }

export default defineConfig({
  plugins: [react(), tailwindcss(), messreihePlugin(), asrModelsPlugin(), licensePlugin(root)],
  server: { headers: isolation },
  preview: { headers: isolation },
  worker: { format: 'es', plugins: () => [licenseCollector()] },
  // Gleich beim Start vorbereiten – sonst lädt Vite die Seite beim ersten Sprechen bzw. Abspielen einmal neu
  optimizeDeps: { include: ['@huggingface/transformers', 'onnxruntime-web/webgpu'] },
  // Die Tauri-CLI zeigt ihre eigenen Meldungen
  clearScreen: false,
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    // Einige Tests bauen den ganzen Inhaltsindex neu; im vollen Lauf unter Last reichen 5 s nicht immer
    testTimeout: 20000,
  },
})
