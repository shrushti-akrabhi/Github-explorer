import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The browser talks only to Vite; /api and /auth are forwarded to the Node server (same origin, so cookies just work).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:4000', '/auth': 'http://localhost:4000' } },
});
