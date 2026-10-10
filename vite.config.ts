/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this project from a sub-path. Set BASE_PATH env var
// to '/' when deploying to Vercel/Netlify (see README).
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/6-55-lottery-jackpot-insight/',
  resolve: {
    alias: { '@': '/src' },
  },
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [['tests/unit/**/*.test.tsx', 'jsdom']],
  },
});
