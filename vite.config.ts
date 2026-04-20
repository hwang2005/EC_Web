import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/EC_Web/',
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'vendor-react';
            }
            // MUI (largest dependency)
            if (id.includes('@mui/') || id.includes('@emotion/')) {
              return 'vendor-mui';
            }
            // Radix UI primitives
            if (id.includes('@radix-ui/')) {
              return 'vendor-radix';
            }
            // Recharts + D3
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-recharts';
            }
            // Motion / animation library
            if (id.includes('/motion/')) {
              return 'vendor-motion';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // All other vendor code
            return 'vendor-misc';
          }
        },
      },
    },
  },
})
