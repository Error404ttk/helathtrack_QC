import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProd = mode === 'production' || process.env.NODE_ENV === 'production';
    const apiTarget = isProd
      ? 'https://healthtrack.sarapeehospital.go.th/api'
      : 'http://localhost:3004';

    return {
      server: {
        port: 3005,
        host: '0.0.0.0',
        allowedHosts: ['healthtrack.sarapeehospital.go.th', 'localhost', '127.0.0.1'],
        proxy: {
          '/api': {
            target: apiTarget,
            changeOrigin: true,
            secure: isProd
          }
        }
      },
      preview: {
        // Ensure API calls proxy correctly when running `vite preview` (defaults to port 4173)
        proxy: {
          '/api': {
            target: 'http://localhost:3004',
            changeOrigin: true,
            secure: false
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
