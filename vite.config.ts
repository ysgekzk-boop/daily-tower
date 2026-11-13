import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('/src/extensible/realms/realm_01_')) {
            return 'realm-01';
          }
          if (id.includes('/src/extensible/realms/realm_02_')) {
            return 'realm-02';
          }
          if (id.includes('/src/extensible/realms/realm_03_')) {
            return 'realm-03';
          }
          if (id.includes('/src/extensible/')) {
            return 'extensible-data';
          }
          return undefined;
        },
      },
    },
  },
});
