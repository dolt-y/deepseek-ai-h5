import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  const isAnalyze = mode === 'analyze'

  return {
    plugins: [
      vue(),
      isAnalyze &&
        visualizer({
          open: true, // 仅分析模式打开报告
          filename: 'stats/report.html',
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      host: '0.0.0.0',
      // host:'10.3.20.101',
      port: 5173,
    },
    build: {
      cssCodeSplit: true,
      sourcemap: !isProd,
      chunkSizeWarningLimit: 1500,
      minify: 'terser',
      terserOptions: isProd
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : undefined,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('element-plus')) return 'element-plus'
              if (id.includes('markdown-it')) return 'markdown-it'
              if (id.includes('recordrtc')) return 'recordrtc'
              return 'vendor'
            }
          },
        },
      },
    },
  }
})
