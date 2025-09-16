import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node18',
  sourcemap: false,
  clean: true,
  minify: false,
  splitting: false,
  dts: false, // 不生成 .d.ts 文件
})
