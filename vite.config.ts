import path from 'path';
// FIX: Module '"process"' has no exported member 'cwd'. The import was removed and `process.cwd()` is used directly.
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          // FIX: '__dirname' is not available in some module systems.
          // 'process.cwd()' provides a reliable alternative for aliasing the project root.
          '@': path.resolve(process.cwd(), '.'),
        }
      }
    };
});