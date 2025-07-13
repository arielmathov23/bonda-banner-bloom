// CORS Helper for Development
// This provides an alternative approach if the Vite proxy doesn't work

/**
 * Development CORS proxy helper
 * Uses a public CORS proxy service for development only
 * NOT suitable for production use
 */
export function createCORSProxyURL(originalURL: string): string {
  if (import.meta.env.PROD) {
    // In production, use the original URL
    return originalURL;
  }
  
  // For development, you can use a CORS proxy service
  // Note: This is only for development purposes
  const corsProxyServices = [
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/raw?url=',
    'https://thingproxy.freeboard.io/fetch/',
  ];
  
  // Use the first available proxy service
  // In a real application, you should use your own backend proxy
  return corsProxyServices[0] + encodeURIComponent(originalURL);
}

/**
 * Alternative: Use a development-only CORS proxy
 * This modifies the fetch request to use a CORS proxy in development
 */
export function createCORSProxyFetch() {
  const originalFetch = window.fetch;
  
  return function proxiedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (import.meta.env.DEV && typeof input === 'string' && input.includes('api.bfl.ai')) {
      // In development, use CORS proxy
      const proxiedURL = createCORSProxyURL(input);
      console.log('🔄 Using CORS proxy for development:', proxiedURL);
      return originalFetch(proxiedURL, init);
    }
    
    // Normal fetch for everything else
    return originalFetch(input, init);
  };
}

/**
 * Simple development CORS workaround
 * Instructions for users who want to quickly test without proxy setup
 */
export function getDevCORSInstructions(): string {
  return `
🚨 CORS Error Fix for Development:

Option 1: Use the Vite proxy (recommended)
- The proxy configuration is already set up
- Restart your dev server: npm run dev

Option 2: Disable CORS in Chrome (temporary)
- Close all Chrome windows
- Run: open -n -a /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security --disable-features=VizDisplayCompositor
- Only use this for testing, not for regular browsing

Option 3: Use a browser extension
- Install "CORS Unblock" extension
- Enable it only for development

⚠️ Remember: These are development-only solutions!
For production, you need a proper backend proxy.
  `;
}

/**
 * CORS Helper utilities for handling external image URLs
 * Provides proxy solutions for CORS-blocked resources
 */

/**
 * Convert an external image URL to a proxy URL to bypass CORS restrictions
 */
export function getProxyImageUrl(originalUrl: string): string {
  // Check if it's a Flux delivery URL that needs proxying
  if (originalUrl.includes('delivery-eu1.bfl.ai') || 
      originalUrl.includes('delivery-us1.bfl.ai') || 
      originalUrl.includes('bfl.ai')) {
    
    // Use our image proxy endpoint for both dev and production
    return `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
  }
  
  // For other URLs, return as-is
  return originalUrl;
}

/**
 * Load an image with CORS proxy fallback
 */
export function loadImageWithProxy(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // First try with the proxy URL
    const proxyUrl = getProxyImageUrl(imageUrl);
    
    img.onload = () => resolve(img);
    img.onerror = () => {
      // If proxy fails and it's different from original, try original
      if (proxyUrl !== imageUrl) {
        console.log('Proxy failed, trying original URL:', imageUrl);
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => reject(new Error('Failed to load image with both proxy and direct methods'));
        fallbackImg.src = imageUrl;
      } else {
        reject(new Error('Failed to load image'));
      }
    };
    
    // Set crossOrigin for proxy URLs
    if (proxyUrl.startsWith('/api/image-proxy')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.src = proxyUrl;
  });
}

/**
 * Create a canvas with image data from a CORS-blocked URL
 */
export async function createCanvasFromUrl(imageUrl: string): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
  const img = await loadImageWithProxy(imageUrl);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }
  
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  return { canvas, ctx };
} 