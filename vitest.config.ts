import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

// The generator and the solar engine are pure and run in Node. There is no
// browser environment here on purpose: if a test needs one, the code under
// test is in the wrong file.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
