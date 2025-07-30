// Consolidated Flux Services - Prevents code splitting in production
// This barrel export ensures all flux modules are bundled together

export { generateBannerBackground, isFluxConfigured as isFluxBackgroundConfigured } from './flux-background';
export { generateProductCutout, isFluxConfigured as isFluxProductConfigured } from './flux-product';

// Re-export types
export type { GeneratedBanner } from './openai';

// Consolidated configuration check
export function isFluxFullyConfigured(): boolean {
  const apiKey = import.meta.env.VITE_FLUX_API_KEY;
  return !!apiKey && apiKey !== 'your_flux_api_key_here';
} 