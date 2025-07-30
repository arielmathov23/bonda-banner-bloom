// Product Image Generation with Flux 1.1 Pro
// 
// This module handles the generation of product cutouts (Layer B) with transparent backgrounds.
// The product images are optimized for overlay on banner backgrounds in 1:1 aspect ratio.
//
// Workflow: Step B - Generate product cutout with transparent background

import { GeneratedBanner } from './openai';

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
 * Helper function to convert File to base64 with validation and resizing
 * Optimized for product image processing
 */
async function imageToBase64File(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Validate file
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        reject(new Error(`Invalid file type for Flux: ${file.type}. Expected image/*`));
        return;
      }
      
      if (file.size === 0) {
        reject(new Error('Empty file for Flux processing'));
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        reject(new Error('File too large for Flux (max 10MB)'));
        return;
      }
      
      console.log(`🖼️ [STEP B] Converting file for Flux: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      
      // Create image element to check dimensions
      const img = new Image();
      img.onload = () => {
        try {
          console.log(`🖼️ [STEP B] Original image dimensions: ${img.width}x${img.height}`);
          
          // Check if image meets Flux minimum requirements (256x256)
          const minSize = 256;
          let targetWidth = img.width;
          let targetHeight = img.height;
          
          if (img.width < minSize || img.height < minSize) {
            console.log(`🖼️ [STEP B] Image too small for Flux (${img.width}x${img.height}), resizing to meet 256x256 minimum`);
            
            // Calculate new dimensions maintaining aspect ratio
            const aspectRatio = img.width / img.height;
            
            if (img.width < img.height) {
              targetWidth = minSize;
              targetHeight = Math.round(minSize / aspectRatio);
            } else {
              targetHeight = minSize;
              targetWidth = Math.round(minSize * aspectRatio);
            }
            
            // Ensure both dimensions are at least 256
            if (targetWidth < minSize) targetWidth = minSize;
            if (targetHeight < minSize) targetHeight = minSize;
            
            console.log(`🖼️ [STEP B] Resizing to: ${targetWidth}x${targetHeight}`);
          }
          
          // Create canvas for resizing if needed
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not create canvas context for image processing'));
            return;
          }
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // Draw image with new dimensions
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          
          // Convert to base64
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob from resized image'));
              return;
            }
            
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const result = reader.result as string;
                
                if (!result || typeof result !== 'string') {
                  reject(new Error('Failed to read resized image as data URL'));
                  return;
                }
                
                if (!result.startsWith('data:image/')) {
                  reject(new Error('Invalid data URL format from resized image'));
                  return;
                }
                
                const base64 = result.split(',')[1];
                
                if (!base64 || base64.length === 0) {
                  reject(new Error('Empty base64 data from resized image'));
                  return;
                }
                
                // Validate base64 format
                try {
                  atob(base64);
                } catch (error) {
                  reject(new Error('Invalid base64 encoding from resized image'));
                  return;
                }
                
                console.log(`🖼️ [STEP B] Successfully processed image for Flux. Final dimensions: ${targetWidth}x${targetHeight}, Base64 length: ${base64.length}`);
                resolve(base64);
              } catch (error) {
                reject(new Error(`Failed to process resized image: ${error}`));
              }
            };
            reader.onerror = () => reject(new Error('FileReader error for resized image'));
            reader.readAsDataURL(blob);
          }, 'image/png', 0.95);
          
        } catch (error) {
          reject(new Error(`Image processing error: ${error}`));
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image for dimension checking'));
      
      // Load image from file
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file for image processing'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error during image loading'));
      reader.readAsDataURL(file);
      
    } catch (error) {
      reject(new Error(`Flux image processing error: ${error}`));
    }
  });
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
    
    console.log(`🔳 [STEP B] getResult called with taskId: ${taskId}, pollingUrl: ${pollingUrl}`);
    
    if (pollingUrl && pollingUrl.includes('api.bfl.ai/v1')) {
      // Convert external polling URL to use our proxy
      url = pollingUrl.replace('https://api.bfl.ai/v1', this.baseUrl);
      console.log(`🔳 [STEP B] Using external polling URL converted to proxy: ${url}`);
    } else {
      // Fallback: construct get_result URL through proxy
      url = `${this.baseUrl}/get_result?id=${taskId}`;
      console.log(`🔳 [STEP B] Using fallback constructed URL: ${url}`);
    }
    
    console.log(`🔳 [STEP B] Final polling URL: ${url}`);
    
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
  image_prompt?: string | null;
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
  
  if (!isConfigured) {
    console.warn('Flux API key not configured for product generation:', {
      keyExists: !!apiKey,
      isPlaceholder: apiKey === 'your_flux_api_key_here',
      keyPreview: apiKey ? `${apiKey.substring(0, 7)}...` : 'undefined',
      env: import.meta.env.MODE
    });
  }
  
  return isConfigured;
}

/**
 * Generate product cutout prompt (transparent background)
 * Optimized for clean product isolation with 1:1 aspect ratio
 */
function generateProductCutoutPrompt(productDescription: string): string {
  const prompt = `Create a perfect product cutout image with transparent background, suitable for overlay on banner backgrounds.

CRITICAL REQUIREMENTS:
- COMPLETELY TRANSPARENT BACKGROUND (like a PNG cutout)
- NO background colors, patterns, shadows, or environmental elements
- ONLY the product itself, perfectly isolated
- Professional product photography lighting on the product
- High-contrast edges for clean cutout appearance
- Square aspect ratio (1:1) for optimal banner integration

<product_specifications>
Product: ${productDescription}
Lighting: Professional studio lighting directly on product only
Shadows: NO drop shadows or cast shadows (transparent background)
Edges: Clean, crisp edges for perfect cutout appearance
Quality: Ultra-high resolution for banner scaling
Orientation: Best angle for banner display (usually 3/4 view)
</product_specifications>

<technical_requirements>
Background: 100% transparent (alpha channel)
Format: PNG-compatible with transparency
Isolation: Product completely separated from any background
Detail Level: Maximum detail retention for large format use
Edge Quality: Anti-aliased edges for smooth overlay blending
</technical_requirements>

The result should look like a professionally cut-out product photo that can be seamlessly overlaid on any background without visible edges or artifacts.`;

  return prompt;
}

/**
 * Generate product cutout with transparent background - Step B
 * This creates the product layer for overlay on the background
 */
export async function generateProductCutout(
  productImageFile: File,
  productDescription: string,
  onProgress?: (progress: number, status: string) => void
): Promise<GeneratedBanner> {
  try {
    console.log('🔳 [STEP B] Starting Flux product cutout generation...');
    onProgress?.(10, 'Generando recorte del producto...');

    if (!isFluxConfigured()) {
      throw new Error('Flux API key is not configured for product generation');
    }

    // Convert product image to base64 for reference
    const productImageBase64 = await imageToBase64File(productImageFile);
    console.log('🔳 [STEP B] Product image converted to base64 for cutout reference');

    // Generate product cutout prompt
    const prompt = generateProductCutoutPrompt(productDescription);

    console.log('🔳 [STEP B] Generated product cutout prompt (first 200 chars):', prompt.substring(0, 200) + '...');
    onProgress?.(20, 'Creando recorte optimizado...');

    // Use square dimensions for product cutout (1:1 aspect ratio)
    const targetDimensions = validateFluxDimensions(512, 512);
    console.log('🔳 [STEP B] Using 1:1 aspect ratio dimensions:', targetDimensions);
    
    const client = new FluxAPIClient(import.meta.env.VITE_FLUX_API_KEY);
    
    console.log('🔳 [STEP B] Creating Flux product cutout task...');
    onProgress?.(30, 'Creando tarea de recorte...');

    const taskRequest: FluxTaskRequest = {
      prompt: prompt,
      width: targetDimensions.width,
      height: targetDimensions.height,
      prompt_upsampling: false,
      seed: null,
      safety_tolerance: 2,
      output_format: 'png',
      image_prompt: productImageBase64 // Use product image as reference
    };

    const task = await client.createTask(taskRequest);
    console.log('🔳 [STEP B] Flux product cutout task created:', task.id);
    onProgress?.(40, 'Generando recorte...');

    const result = await client.pollForResult(task.id, task.polling_url, 30, 2000);
    onProgress?.(90, 'Recorte generado...');

    if (result.status !== 'Ready' || !result.result) {
      throw new Error(`Flux product cutout generation failed: ${result.status}`);
    }

    const imageUrl = result.result.sample;
    console.log('🔳 [STEP B] Product cutout generation completed successfully:', imageUrl);

    onProgress?.(100, 'Recorte completado');

    return {
      imageUrl: imageUrl,
      base64Data: '',
      prompt: prompt
    };

  } catch (error) {
    console.error('🔳 [STEP B] Error in Flux product cutout generation:', error);
    throw new Error(`Failed to generate product cutout: ${error}`);
  }
}
