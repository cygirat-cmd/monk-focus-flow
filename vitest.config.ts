import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig(configEnv =>
  mergeConfig(viteConfig(configEnv), {
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts'
    }
  })
);
