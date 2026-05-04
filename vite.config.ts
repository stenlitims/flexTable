import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ command }) => {
  if (command === 'serve') {
    // Dev mode: serve dev/index.html with HMR
    return {
      root: resolve(__dirname, 'dev'),
      plugins: [vue()],
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
    plugins: [vue()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'FlexTableVue',
        fileName: 'flex-table-vue',
      },
      rollupOptions: {
        // Не інлайнити vuedraggable: його UMD-обгортка зливає імпорт Vue у `import sn from "vue"`,
        // що ламається з vue.runtime.esm-bundler (немає default export).
        external: ['vue', 'vuedraggable'],
        output: {
          exports: 'named',
          globals: {
            vue: 'Vue',
            vuedraggable: 'VueDraggable',
          },
        },
      },
    },
  }
})
