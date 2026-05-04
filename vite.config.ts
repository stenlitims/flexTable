import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig(({ command }) => {
  if (command === 'serve') {
    // Dev mode: serve dev/index.html with HMR
    return {
      root: resolve(__dirname, 'dev'),
      plugins: [tailwindcss(), vue()],
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src'),
        },
      },
      server: {
        port: 3000,
      },
    }
  }

  // Build mode: library
  return {
    plugins: [tailwindcss(), vue()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'FlexTableVue',
        fileName: 'flex-table-vue',
      },
      rollupOptions: {
        // Лише Vue зовнішній; sortablejs збираємо в бандл (коректний ESM). vuedraggable не використовуємо —
        // його UMD очікує default export з Vue, що ламає Vite + vue.runtime.esm-bundler.
        external: ['vue'],
        output: {
          exports: 'named',
          globals: {
            vue: 'Vue',
          },
        },
      },
    },
  }
})
