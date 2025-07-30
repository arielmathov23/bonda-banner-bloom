// Composite image creation for Flux 1.1 Pro

// Flux 1.1 Pro API Integration
// 
// FLUX.1.1 Pro performs high-quality image generation with exact dimensions.
// This approach generates banners at the exact target size (1440x352) without
// requiring additional framing or resizing steps.
//
// Key improvements:
// 1. Direct generation at target dimensions (1440x352)
// 2. No reframing required - exact size output
// 3. Ultra-precise prompts optimized for banner generation
// 4. Support for reference images when available
// 5. Dimension validation for Flux API requirements (multiples of 32)
//
import { BannerGenerationRequest, GeneratedBanner } from './openai';
import { loadImageWithProxy } from './cors-helper';

/**
 * Ensure dimensions meet Flux API requirements (multiples of 32)
 */
function validateFluxDimensions(width: number, height: number): { width: number; height: number } {
  const roundToMultiple32 = (value: number): number => {
    return Math.round(value / 32) * 32;
  };

  const validWidth = roundToMultiple32(width);
  const validHeight = roundToMultiple32(height);

  console.log(`Flux dimension validation: ${width}x${height} → ${validWidth}x${validHeight}`);
  
  return { width: validWidth, height: validHeight };
}

/**
 * Convert image URL to base64 using CORS helper with special handling for Supabase
 */
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    console.log('Converting image to base64:', imageUrl);
    
    // Special handling for Supabase storage URLs
    if (imageUrl.includes('supabase.co/storage')) {
      console.log('Detected Supabase URL, using fetch method to bypass canvas taint...');
      
      try {
        // Fetch the image as blob first
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Convert blob to base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/png;base64,")
            const base64 = result.split(',')[1];
            console.log('Successfully converted Supabase image to base64 via fetch, length:', base64.length);
            resolve(base64);
          };
          reader.onerror = () => reject(new Error('Failed to convert blob to base64'));
          reader.readAsDataURL(blob);
        });
      } catch (fetchError) {
        console.warn('Supabase fetch method failed, falling back to canvas method:', fetchError);
        // Fall through to canvas method
      }
    }
    
    // Standard canvas method for other URLs or as fallback
    const img = await loadImageWithProxy(imageUrl);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // Get base64 without the data URL prefix
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    console.log('Successfully converted image to base64 via canvas, length:', base64.length);
    return base64;
  } catch (error) {
    console.error('Failed to convert image to base64:', imageUrl, error);
    throw error;
  }
}

/**
 * Create a composite reference image from logo and product photos
 * Enhanced version that properly categorizes different types of images
 */
async function createCompositeReferenceImage(
  referenceImages: string[], 
  hasLogo: boolean, 
  hasProductPhotos: boolean,
  hasReferenceBanners: boolean,
  partnerName: string
): Promise<string> {
  try {
    console.log('Creating enhanced composite reference image from:', referenceImages.length, 'images');
    console.log('Image types - Logo:', hasLogo, 'Products:', hasProductPhotos, 'Reference Banners:', hasReferenceBanners);
    
    // Create a canvas for the composite image (1200x800 for better reference)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    
    canvas.width = 1200;
    canvas.height = 800;
    
    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add border
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Enhanced layout with proper sections
    let currentX = 20;
    let currentY = 60; // Leave space for title
    const maxWidth = 280;
    const maxHeight = 180;
    const padding = 30;
    const sectionSpacing = 40;
    
    // Add title
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`${partnerName} - Reference Images`, 20, 35);
    
    // Track image types and positions
    let logoCount = 0;
    let bannerCount = 0;
    let productCount = 0;
    
    // Calculate expected counts based on flags and array
    const expectedLogos = hasLogo ? 1 : 0;
    const expectedBanners = hasReferenceBanners ? Math.min(2, referenceImages.length - expectedLogos) : 0;
    const expectedProducts = hasProductPhotos ? Math.max(0, referenceImages.length - expectedLogos - expectedBanners) : 0;
    
    console.log(`Expected distribution - Logos: ${expectedLogos}, Banners: ${expectedBanners}, Products: ${expectedProducts}`);
    
    // Process each reference image with enhanced categorization
    for (let i = 0; i < Math.min(referenceImages.length, 6); i++) {
      try {
        const img = await loadImageWithProxy(referenceImages[i]);
        
        // Calculate scaled dimensions
        let drawWidth = img.width;
        let drawHeight = img.height;
        
        if (drawWidth > maxWidth || drawHeight > maxHeight) {
          const scaleX = maxWidth / drawWidth;
          const scaleY = maxHeight / drawHeight;
          const scale = Math.min(scaleX, scaleY);
          
          drawWidth = drawWidth * scale;
          drawHeight = drawHeight * scale;
        }
        
        // Determine image type based on position and expected counts
        let imageType = 'REFERENCE';
        let labelColor = '#6B7280';
        
        if (logoCount < expectedLogos) {
          imageType = 'COMPANY LOGO';
          labelColor = '#DC2626'; // Red for logo
          logoCount++;
        } else if (bannerCount < expectedBanners) {
          imageType = `REFERENCE BANNER ${bannerCount + 1}`;
          labelColor = '#2563EB'; // Blue for reference banners
          bannerCount++;
        } else if (productCount < expectedProducts) {
          imageType = `PRODUCT ${productCount + 1}`;
          labelColor = '#059669'; // Green for products
          productCount++;
        } else {
          // Fallback for any extra images
          imageType = `EXTRA IMAGE ${i + 1}`;
          labelColor = '#9333EA'; // Purple for extra
        }
        
        // Draw background for image
        ctx.fillStyle = '#F9FAFB';
        ctx.fillRect(currentX - 5, currentY - 5, drawWidth + 10, drawHeight + 35);
        
        // Draw border around image
        ctx.strokeStyle = labelColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(currentX - 5, currentY - 5, drawWidth + 10, drawHeight + 35);
        
        // Draw the image
        ctx.drawImage(img, currentX, currentY, drawWidth, drawHeight);
        
        // Add enhanced label with background
        ctx.fillStyle = labelColor;
        ctx.fillRect(currentX - 5, currentY + drawHeight + 5, drawWidth + 10, 25);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        const textWidth = ctx.measureText(imageType).width;
        const textX = currentX + (drawWidth - textWidth) / 2;
        ctx.fillText(imageType, textX, currentY + drawHeight + 20);
        
        // Move to next position
        currentX += drawWidth + padding;
        if (currentX + maxWidth > canvas.width) {
          currentX = 20;
          currentY += maxHeight + sectionSpacing;
        }
        
        console.log(`Added ${imageType} to composite at position ${i + 1}`);
      } catch (imageError) {
        console.warn(`Failed to add reference image ${i + 1}:`, imageError);
      }
    }
    
    // Add instruction text at bottom
    if (currentY < canvas.height - 100) {
      ctx.fillStyle = '#4B5563';
      ctx.font = '14px Arial';
      ctx.fillText('Instructions: Extract logos and products exactly as shown. Use reference banners for style inspiration.', 20, canvas.height - 30);
    }
    
    // Convert composite to base64
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    console.log('Enhanced composite reference image created, base64 length:', base64.length);
    console.log('Base64 first 50 chars:', base64.substring(0, 50) + '...');
    console.log(`Summary - Logos: ${logoCount}, Reference Banners: ${bannerCount}, Products: ${productCount}`);
    console.log('Returning base64 from createCompositeReferenceImage:', base64 ? 'VALID' : 'NULL');
    return base64;
    
  } catch (error) {
    console.error('Failed to create enhanced composite reference image:', error);
    throw error;
  }
}

// Flux API client
class FluxAPIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Always use proxy endpoint for both development and production
    this.baseUrl = '/api/flux';
  }

  async createTask(payload: FluxTaskRequest): Promise<FluxTaskResponse> {
    const response = await fetch(`${this.baseUrl}/flux-pro-1.1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-key': this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Flux API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }

  async getResult(taskId: string, pollingUrl?: string): Promise<FluxResultResponse> {
    let url: string;
    
    if (pollingUrl && pollingUrl.includes('api.bfl.ai/v1')) {
      // Convert external polling URL to use our proxy
      url = pollingUrl.replace('https://api.bfl.ai/v1', this.baseUrl);
    } else {
      // Fallback: construct get_result URL through proxy
      url = `${this.baseUrl}/get_result?id=${taskId}`;
    }
    
    console.log(`Polling for result at: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-key': this.apiKey,
      },
    });

    if (!response.ok) {
      console.error(`Get result failed for URL: ${url}`, response.status, response.statusText);
      throw new Error(`Failed to get result: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async pollForResult(taskId: string, pollingUrl?: string, maxAttempts: number = 30, interval: number = 2000): Promise<FluxResultResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.getResult(taskId, pollingUrl);
        
        console.log(`Poll attempt ${attempt + 1}/${maxAttempts}:`, result.status, result.progress);
        
        if (result.status === 'Ready') {
          return result;
        } else if (result.status === 'Error' || result.status === 'Content Moderated' || result.status === 'Request Moderated') {
          throw new Error(`Task failed with status: ${result.status}. Details: ${JSON.stringify(result.details)}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.warn(`Poll attempt ${attempt + 1} failed:`, error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    throw new Error('Timeout: Task did not complete within expected time');
  }
}

interface FluxTaskRequest {
  prompt: string;
  width: number;
  height: number;
  prompt_upsampling?: boolean;
  seed?: number | null;
  safety_tolerance?: number;
  output_format?: 'jpeg' | 'png';
  image_prompt?: string | null; // Base64 encoded image for Flux Redux
}

interface FluxTaskResponse {
  id: string;
  polling_url: string;
}

interface FluxResultResponse {
  id: string;
  status: 'Task not found' | 'Pending' | 'Request Moderated' | 'Content Moderated' | 'Ready' | 'Error';
  result?: any;
  progress?: number | null;
  details?: object | null;
}

export function isFluxConfigured(): boolean {
  const apiKey = import.meta.env.VITE_FLUX_API_KEY;
  const isConfigured = !!apiKey && apiKey !== 'your_flux_api_key_here';
  
  // Enhanced debugging for production
  if (!isConfigured) {
    console.warn('Flux API key not configured:', {
      keyExists: !!apiKey,
      isPlaceholder: apiKey === 'your_flux_api_key_here',
      keyPreview: apiKey ? `${apiKey.substring(0, 7)}...` : 'undefined',
      env: import.meta.env.MODE
    });
  }
  
  return isConfigured;
}

export function getFluxAPIKeyStatus(): { configured: boolean; placeholder: boolean; keyPreview?: string } {
  const apiKey = import.meta.env.VITE_FLUX_API_KEY;
  const status = {
    configured: !!apiKey,
    placeholder: apiKey === 'your_flux_api_key_here',
    keyPreview: apiKey ? `${apiKey.substring(0, 7)}...` : undefined
  };
  
  // Log status for debugging in production
  console.log('Flux API key status:', status);
  
  return status;
}

// Legacy function removed - not used anywhere in the codebase

// Legacy function removed - replaced by separate background and product generation

// Duplicate function removed - now available in flux-product.ts

// Legacy function removed - prompts now split between flux-background.ts and flux-product.ts

// Duplicate functions removed - now available in separate files:
// - generateBannerBackground -> moved to flux-background.ts
// - generateProductCutout -> moved to flux-product.ts

// Legacy function removed - replaced by separate background and product generation workflow
 
