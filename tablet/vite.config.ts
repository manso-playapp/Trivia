/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: el mismo build sirve para la web y para el APK (Capacitor)
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'node' },
});
