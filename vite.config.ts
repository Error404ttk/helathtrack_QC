import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3005,
        host: '0.0.0.0',
        allowedHosts: ['healthtrack.sarapeehospital.go.th', 'localhost', '127.0.0.1'],
        proxy: {
          '/api': {
            target: process.env.NODE_ENV === 'production' 
              ? 'https://healthtrack.sarapeehospital.go.th/api'
              : 'http://localhost:3004',
            changeOrigin: true,
            secure: process.env.NODE_ENV === 'production',
            rewrite: (path) => path.replace(/^\/api/, '/api')
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
