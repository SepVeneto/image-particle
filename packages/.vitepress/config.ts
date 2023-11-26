import { defineConfig } from 'vitepress'
import path from 'node:path'

export default defineConfig({
  lang: 'Zh-Cn',
  vite: {
    resolve: {
      alias: {
        '@':  path.resolve(__dirname, 'src'),
      }
    }
  }
})
