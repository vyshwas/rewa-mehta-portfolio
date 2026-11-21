import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// VITE_BASE is set by the deploy workflow: "/" for a user site (<name>.github.io), "/<repo>/" otherwise.
export default defineConfig({ base: process.env.VITE_BASE || '/', plugins: [react()], server: { port: 5186, strictPort: true } });
