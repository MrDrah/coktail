import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the static build works on GitHub Pages or any sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
});
