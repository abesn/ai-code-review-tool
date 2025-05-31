import path from "path"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Base path for GitHub Pages deployment
  // Change this to match your GitHub repository name
  base: '/ai-code-review-tool/',

  // Keep React and Tailwind plugins
  plugins: [react(), tailwindcss()],

  // Path aliases for cleaner imports
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Vite server options for local development
  server: {
    port: 3000,
    host: true,
    open: true,
  },
  
  // Build configuration optimized for web deployment
  build: {
    // Output directory for the build
    outDir: 'dist',
    // Generate sourcemaps for better debugging
    sourcemap: true,
    // Target modern browsers
    target: 'es2021',
    // Minify the output for production
    minify: 'esbuild',
    // Empty the output directory before building
    emptyOutDir: true,
    // Optimize chunk size for better performance
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          ui: ['./src/components/ui']
        }
      }
    }
  },
  
  // Optimize dependencies for faster loading
  optimizeDeps: {
    // Include dependencies that need optimization
    include: ['react', 'react-dom', 'lucide-react', 'clsx', 'tailwind-merge'],
  },
});
