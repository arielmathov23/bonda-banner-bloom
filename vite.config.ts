import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy Flux API requests to avoid CORS issues
      '/api/flux': {
        target: 'https://api.bfl.ai/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/flux/, ''),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-key',
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Flux API proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying Flux API request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Flux API response:', proxyRes.statusCode, req.url);
          });
        },
      },
      // Add proxy for external images to bypass CORS  
      '/api/proxy-image': {
        target: 'https://delivery-us1.bfl.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy-image/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Add proper headers to bypass CORS
            proxyReq.setHeader('Access-Control-Allow-Origin', '*');
            proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          });
        },
      },
      // Universal image proxy - proxy to external image URLs
      '/api/image-proxy': {
        target: 'https://delivery-us1.bfl.ai', // Default target, will be overridden
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Extract the actual URL from the query parameter
            try {
              const url = new URL(req.url!, 'http://localhost:8080');
              const targetUrl = url.searchParams.get('url');
              
              if (targetUrl) {
                console.log('🖼️ Proxying image request to:', targetUrl);
                
                // Parse the target URL to get host and path
                const target = new URL(targetUrl);
                
                // Update the proxy request to go to the actual target
                proxyReq.host = target.host;
                proxyReq.path = target.pathname + target.search;
                proxyReq.setHeader('Host', target.host);
                proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (compatible; ImageProxy/1.0)');
                proxyReq.setHeader('Accept', 'image/png,image/jpeg,image/*,*/*');
                proxyReq.setHeader('Accept-Encoding', 'identity');
                
                // Remove the original query params from the proxy request
                proxyReq.removeHeader('Referer');
                proxyReq.removeHeader('Origin');
              }
            } catch (error) {
              console.error('🖼️ Proxy configuration error:', error);
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('🖼️ Proxy response:', proxyRes.statusCode, proxyRes.headers['content-type']);
          });
          
          proxy.on('error', (err, _req, _res) => {
            console.error('🖼️ Proxy error:', err);
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Force all flux modules into main bundle to prevent code splitting issues
          if (id.includes('flux-product') || id.includes('flux-background') || id.includes('flux.ts') || id.includes('enhanced-banner-service')) {
            return 'index';
          }
          // Keep node_modules in vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    // Increase chunk size warning limit for large modules
    chunkSizeWarningLimit: 2000,
    // Disable dynamic imports for critical modules
    dynamicImportVarsOptions: {
      exclude: [/flux/]
    },
  },
}));
