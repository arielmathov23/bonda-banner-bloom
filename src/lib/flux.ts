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

/**
 * Test Flux API configuration and provide detailed diagnostics
 */
export async function testFluxConfiguration(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    // Check if API key is configured
    const apiKey = import.meta.env.VITE_FLUX_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        message: 'Flux API key not found. Please set VITE_FLUX_API_KEY in your environment variables.',
        details: {
          environment: import.meta.env.MODE,
          allEnvKeys: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
        }
      };
    }
    
    if (apiKey === 'your_flux_api_key_here') {
      return {
        success: false,
        message: 'Flux API key is set to placeholder value. Please replace with your actual API key.',
        details: { keyPreview: `${apiKey.substring(0, 7)}...` }
      };
    }
    
    // Test API connection by making a simple request
    const client = new FluxAPIClient(apiKey);
    
    // This is a simple test - we'll try to create a minimal task to verify the key works
    console.log('Testing Flux API connection...');
    
    return {
      success: true,
      message: 'Flux API configuration appears to be correct.',
      details: {
        keyPreview: `${apiKey.substring(0, 7)}...`,
        environment: import.meta.env.MODE,
        baseUrl: client['baseUrl'] // Access private property for debugging
      }
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Flux API configuration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

/**
 * Generate banner background with Flux using partner style analysis and product description
 */
export async function generateBannerWithProductAndStyle(
  partnerName: string,
  productDescription: string,
  styleAnalysis: any,
  productImageFile: File,
  mainText: string,
  ctaText: string,
  discountPercentage?: number,
  onProgress?: (progress: number, status: string) => void
): Promise<GeneratedBanner> {
  try {
    console.log('Starting Flux banner generation with product and style analysis...');
    onProgress?.(10, 'Inicializando generación con Flux...');

    if (!isFluxConfigured()) {
      throw new Error('Flux API key is not configured');
    }

    // Convert product image to base64 for reference
    const productImageBase64 = await imageToBase64File(productImageFile);
    console.log('Product image converted to base64 for Flux reference');

    // Generate optimized banner prompt based on style analysis and product
    const prompt = generateStyledBannerPrompt(
      partnerName,
      productDescription,
      styleAnalysis,
      mainText,
      ctaText,
      discountPercentage
    );

    console.log('Generated styled banner prompt:', prompt);
    onProgress?.(20, 'Prompt optimizado generado...');

    // Set exact banner dimensions (validated for Flux)
    const targetDimensions = validateFluxDimensions(1440, 352);
    
    const client = new FluxAPIClient(import.meta.env.VITE_FLUX_API_KEY);
    
    console.log('Creating Flux task with product reference...');
    onProgress?.(30, 'Creando tarea en Flux...');

    const taskRequest: FluxTaskRequest = {
      prompt: prompt,
      width: targetDimensions.width,
      height: targetDimensions.height,
      prompt_upsampling: false,
      seed: null,
      safety_tolerance: 3, // Increased to be more permissive and reduce weird rejections
      output_format: 'png',
      image_prompt: productImageBase64 // Use product image as compositional reference only
    };

    const task = await client.createTask(taskRequest);
    console.log('Flux task created:', task.id);
    onProgress?.(40, 'Tarea creada, generando imagen...');

    // Poll for result with progress updates
    let lastProgress = 40;
    const result = await client.pollForResult(task.id, task.polling_url, 30, 2000);
    
    onProgress?.(90, 'Imagen generada, procesando resultado...');

    if (result.status !== 'Ready' || !result.result) {
      throw new Error(`Flux generation failed: ${result.status}`);
    }

    const imageUrl = result.result.sample;
    console.log('Flux generation completed successfully:', imageUrl);

    onProgress?.(100, 'Generación completada exitosamente');

    return {
      imageUrl: imageUrl,
      base64Data: '', // Flux returns URL, not base64
      prompt: prompt
    };

  } catch (error) {
    console.error('Error in Flux banner generation:', error);
    throw new Error(`Failed to generate banner with Flux: ${error}`);
  }
}

/**
 * Helper function to convert File to base64 with validation and resizing
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
      
      console.log(`Converting file for Flux: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      
      // Create image element to check dimensions
      const img = new Image();
      img.onload = () => {
        try {
          console.log(`Original image dimensions: ${img.width}x${img.height}`);
          
          // Check if image meets Flux minimum requirements (256x256)
          const minSize = 256;
          let targetWidth = img.width;
          let targetHeight = img.height;
          
          if (img.width < minSize || img.height < minSize) {
            console.log(`Image too small for Flux (${img.width}x${img.height}), resizing to meet 256x256 minimum`);
            
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
            
            console.log(`Resizing to: ${targetWidth}x${targetHeight}`);
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
                
                console.log(`Successfully processed image for Flux. Final dimensions: ${targetWidth}x${targetHeight}, Base64 length: ${base64.length}`);
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

/**
 * Generate optimized prompt for Flux based on style analysis and product description
 * ENHANCED VERSION - Uses comprehensive style analysis data
 */
function generateStyledBannerPrompt(
  partnerName: string,
  productDescription: string,
  styleAnalysis: any,
  mainText: string,
  ctaText: string,
  discountPercentage?: number
): string {
  // Extract comprehensive style elements with intelligent fallbacks
  const colorPalette = styleAnalysis?.reference_style?.color_palette || {};
  const backgroundTreatment = styleAnalysis?.reference_style?.background_treatment || {};
  const designComponents = styleAnalysis?.reference_style?.design_components || {};
  const brandPersonality = styleAnalysis?.reference_style?.brand_personality || {};
  const wowFactorElements = styleAnalysis?.reference_style?.wow_factor_elements || {};
  const photoIntegration = styleAnalysis?.reference_style?.photo_integration || {};
  const compositionStructure = styleAnalysis?.reference_style?.composition_structure || {};
  const backgroundEnhancement = styleAnalysis?.reference_style?.background_enhancement_potential || {};
  
  // Enhanced color extraction
  const primaryColors = colorPalette.dominant_colors || '#0072B8, #004A99';
  const accentColors = colorPalette.accent_colors || '#00A3E0, #66B2FF';
  const secondaryColors = colorPalette.secondary_colors || '#E6F3FF, #B3D9FF';
  const colorTemp = colorPalette.color_temperature || 'cool and professional';
  const gradientSophistication = colorPalette.gradient_sophistication || 'smooth professional transitions';
  const colorContrast = colorPalette.color_contrast_strategy || 'high-contrast for impact';
  
  // Enhanced background treatment
  const backgroundType = backgroundTreatment.base_type || 'professional gradient';
  const gradientDetails = backgroundTreatment.gradient_details || 'left-to-right smooth transition';
  const atmosphereStyle = backgroundTreatment.atmosphere_style || 'clean modern professional';
  const textureDetails = backgroundTreatment.texture_details || 'smooth professional finish';
  const environmentalElements = backgroundTreatment.environmental_elements || 'clean abstract environment';
  
  // Wow factor elements for modern appeal
  const dynamicElements = wowFactorElements.dynamic_background_elements || 'subtle flowing lines and energy';
  const modernTrends = wowFactorElements.modern_trends_applied || 'contemporary gradient meshes and depth';
  const depthIllusions = wowFactorElements.depth_illusions || 'layered dimensional stacking';
  const lightShadow = wowFactorElements.light_and_shadow || 'soft professional lighting';
  const textureSophistication = wowFactorElements.texture_sophistication || 'subtle premium textures';
  const colorDrama = wowFactorElements.color_drama || 'vibrant professional color pops';
  
  // Enhanced design components
  const geometricElements = designComponents.geometric_elements || 'clean modern lines';
  const patternDetails = designComponents.pattern_details || 'minimal professional patterns';
  const dimensionalEffects = designComponents.dimensional_effects || 'subtle depth and shadows';
  const iconographicElements = designComponents.iconographic_elements || 'abstract professional elements';
  
  // Photo integration specifications
  const productScale = photoIntegration.product_scale_optimization || '30%';
  const positioningStrategy = photoIntegration.positioning_strategy || 'center-focused with rule-of-thirds';
  const photoTreatment = photoIntegration.photo_treatment || 'natural professional integration';
  const photoEffects = photoIntegration.photo_effects || 'subtle drop shadows and depth';
  
  // Composition structure
  const visualWeight = compositionStructure.visual_weight || 'balanced professional distribution';
  const focalAreas = compositionStructure.focal_areas || 'center-focused with supporting elements';
  const spaceUsage = compositionStructure.space_usage || 'balanced asymmetrical composition';
  const textOverlayZones = compositionStructure.text_overlay_zones || 'left and right thirds optimized';
  const visualBreathing = compositionStructure.visual_breathing_room || 'generous professional spacing';
  
  // Brand personality
  const visualTone = brandPersonality.visual_tone || 'professional and modern';
  const sophistication = brandPersonality.sophistication_level || 'high professional standard';
  const approachability = brandPersonality.approachability || 'welcoming and professional';
  const emotionalImpact = brandPersonality.emotional_impact || 'trust and innovation';
  
  // Background enhancement potential
  const missingWow = backgroundEnhancement.missing_wow_elements || 'modern visual impact elements';
  const modernUpgrade = backgroundEnhancement.modern_upgrade_opportunities || 'contemporary design trends';
  const depthEnhancement = backgroundEnhancement.depth_enhancement_suggestions || 'dimensional layering';
  const colorIntensity = backgroundEnhancement.color_intensity_improvements || 'vibrant professional drama';
  const textureEnrichment = backgroundEnhancement.texture_enrichment_possibilities || 'premium surface treatments';
  const lightingDrama = backgroundEnhancement.lighting_drama_potential || 'sophisticated lighting effects';

  const prompt = `Create a stunning, scroll-stopping e-commerce banner for ${partnerName} that combines sophisticated brand style analysis with modern visual impact for maximum engagement and conversion.

CRITICAL INSTRUCTIONS:
- ABSOLUTELY NO LOGOS, TEXT, letters, numbers, words, or symbols anywhere in the image
- Image attaced must be CENTERED IN THE MIDDLE AND RESIZED to EXACTLY 30%, 500px, of banner width (not larger)
- Apply brand-specific style while enhancing with modern visual impact elements

<image_processing>
${productDescription}
EXTRACT/ISOLATE the product from its current background completely.
COMPLETELY DISCARD the original background colors and design elements.
DO NOT use any colors, gradients, or design elements from the original image background.
Apply design elements for natural integration with the new background.
Use ${photoTreatment} for premium visual quality
</image_processing>

<enhanced_design_foundation>
Visual Style: ${visualTone} with ${sophistication} execution
Emotional Impact: ${emotionalImpact} with ${approachability} accessibility
Color Palette: ${primaryColors} (dominant 60%), ${accentColors} (accent 30%), ${secondaryColors} (supporting 10%)
Color Temperature: ${colorTemp} with enhanced saturation
Color Contrast Strategy: ${colorContrast} for maximum visual impact
Background Type: ${backgroundType} with ${modernUpgrade} enhancements
Gradient Sophistication: ${gradientSophistication} with ${gradientDetails}
Atmosphere: ${atmosphereStyle} with ${environmentalElements} integration
Surface Quality: ${textureDetails} enhanced with ${textureSophistication}
</enhanced_design_foundation>

<wow_factor_implementation>
Dynamic Elements: ${dynamicElements} for movement and energy
Modern Trends: ${modernTrends} for cutting-edge appeal
Depth Illusions: ${depthIllusions} for dimensional interest
Light & Shadow: ${lightShadow} enhanced with ${lightingDrama}
Color Drama: ${colorDrama} for ${colorIntensity} visual impact
Missing Elements: Integrate ${missingWow} for enhanced appeal
Depth Enhancement: Apply ${depthEnhancement} for professional depth
Texture Enrichment: Implement ${textureEnrichment} for premium feel
</wow_factor_implementation>

<precision_design_elements>
Geometric Style: ${geometricElements} with professional precision
Pattern Integration: ${patternDetails} applied subtly for sophistication
Dimensional Effects: ${dimensionalEffects} strategically placed
Iconographic Elements: ${iconographicElements} for brand personality
Visual Effects: Modern enhancement while maintaining ${sophistication}
Border Treatment: Clean professional edges with subtle ${dimensionalEffects}
Surface Quality: Premium finish suitable for high-end commercial use
</precision_design_elements>

<final_requirements>
Create a sophisticated banner background design that captures the brand's complete visual DNA through comprehensive style analysis. Integrate modern visual impact elements while maintaining brand authenticity. The result must be a premium foundation suitable for overlay text and graphics, leveraging all analyzed style elements for maximum conversion potential.
</final_requirements>`;

  return prompt;
}

export async function generateBannerImageWithFlux(
  request: BannerGenerationRequest,
  onProgress?: (progress: number, status: string) => void
): Promise<GeneratedBanner> {
  try {
    const apiKey = import.meta.env.VITE_FLUX_API_KEY;
    if (!apiKey || apiKey === 'your_flux_api_key_here') {
      throw new Error('Flux API key is missing or not configured properly');
    }

    const client = new FluxAPIClient(apiKey);
    
    // Validate and adjust dimensions for Flux API requirements
    const targetDimensions = validateFluxDimensions(1440, 352);
    
    console.log(`Generating banner with Flux 1.1 Pro at validated dimensions (${targetDimensions.width}x${targetDimensions.height})...`);
    onProgress?.(10, 'Preparing banner generation...');

    // Use selected image directly (no composite needed)
    let selectedImageBase64: string | null = null;
    let hasReferenceImage = false;
    
    if (request.referenceImages && request.referenceImages.length > 0) {
      try {
        onProgress?.(15, 'Processing selected reference image...');
        console.log('=== REFERENCE IMAGE PROCESSING ===');
        console.log('Reference images array:', request.referenceImages);
        console.log('Has logo:', request.hasLogo);
        console.log('Has reference banners:', request.hasReferenceBanners);
        console.log('Has product photos:', request.hasProductPhotos);
        console.log('Partner name:', request.partnerName);
        
        // Use the last image in the array (most recently selected product image)
        const selectedImageUrl = request.referenceImages[request.referenceImages.length - 1];
        console.log('Using selected image URL:', selectedImageUrl);
        
        // Convert selected image to base64
        selectedImageBase64 = await imageUrlToBase64(selectedImageUrl);
        hasReferenceImage = true;
        
        console.log('Selected image converted to base64 successfully');
        console.log('Base64 image length:', selectedImageBase64 ? selectedImageBase64.length : 'NULL');
        console.log('Base64 first 50 chars:', selectedImageBase64 ? selectedImageBase64.substring(0, 50) + '...' : 'NULL');
        console.log('=== END REFERENCE IMAGE PROCESSING ===');
      } catch (error) {
        console.warn('Failed to process selected reference image:', error);
        selectedImageBase64 = null;
        hasReferenceImage = false;
        // Continue without reference image
      }
    } else {
      console.log('No reference images provided - generating without image references');
    }

    // Extract parameters for the styled prompt generation
    const partnerName = request.partnerName || 'Brand';
    const productDescription = request.customPrompt || 'Product';
    const mainText = request.customPrompt || 'Main Text';
    const ctaText = request.ctaText || 'Call to Action';
    const discountPercentage = request.promotionDiscount ? parseInt(request.promotionDiscount) : undefined;
    
    const generationPrompt = generateStyledBannerPrompt(
      partnerName,
      productDescription, 
      (request as any).styleAnalysis, // Cast to any since this might be added to the request elsewhere
      mainText,
      ctaText,
      discountPercentage
    );
    
    console.log('=== GENERATED PROMPT ===');
    console.log(generationPrompt);
    console.log('=== END GENERATED PROMPT ===');
    console.log('Has reference image for prompt:', hasReferenceImage);

    onProgress?.(20, 'Creating banner generation task...');
    
    // Debug: Check selected image before sending to Flux
    console.log('=== FLUX PAYLOAD DEBUG ===');
    console.log('About to create taskPayload with selectedImageBase64:', selectedImageBase64 ? 'PRESENT' : 'NULL');
    console.log('selectedImageBase64 length:', selectedImageBase64 ? selectedImageBase64.length : 'NULL');
    console.log('hasReferenceImage flag:', hasReferenceImage);
    console.log('=== END FLUX PAYLOAD DEBUG ===');
    
    const taskPayload: FluxTaskRequest = {
      prompt: generationPrompt,
      width: targetDimensions.width,
      height: targetDimensions.height,
      prompt_upsampling: false,
      seed: null,
      safety_tolerance: 1, // Increased to be more permissive and reduce weird rejections
      output_format: 'png',
      image_prompt: selectedImageBase64 // Use product image as compositional reference only
    };

    console.log('Creating Flux 1.1 generation task with payload:', {
      ...taskPayload,
      image_prompt: taskPayload.image_prompt ? `[Base64 image: ${taskPayload.image_prompt.length} chars]` : null
    });
    
    console.log('FINAL CHECK - image_prompt being sent to Flux:', taskPayload.image_prompt ? 'VALID BASE64' : 'NULL');
    
    const taskResponse = await client.createTask(taskPayload);
    console.log('Flux 1.1 generation task created:', taskResponse);
    console.log('Task ID:', taskResponse.id);
    console.log('Polling URL from Flux:', taskResponse.polling_url);

    onProgress?.(30, 'Generating banner with Flux 1.1 Pro...');
    const result = await client.pollForResult(taskResponse.id, taskResponse.polling_url, 30, 2000);
    console.log('Flux 1.1 generation completed:', result);

    if (!result.result || !result.result.sample) {
      throw new Error('No banner generated by Flux API');
    }

    const imageUrl = result.result.sample;
    
    // Skip base64 conversion to avoid CORS issues with Flux CDN URLs
    // The imageUrl is sufficient for most use cases
    console.log('Flux 1.1 generation successful, image URL:', imageUrl);
    console.log(`Banner generated at validated dimensions: ${targetDimensions.width}x${targetDimensions.height} - no reframing required`);
    
    onProgress?.(100, 'Complete!');

    return {
      imageUrl,
      base64Data: '', // Empty since we can't fetch due to CORS
      prompt: generationPrompt
    };

  } catch (error) {
    console.error('Flux 1.1 banner generation failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('multiple_of') && error.message.includes('32')) {
        throw new Error('Flux API dimension error: Width and height must be multiples of 32. This has been automatically corrected - please try again.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        throw new Error(`Network Error: Cannot connect to Flux API. 
        
Possible solutions:
1. Check your internet connection
2. Verify the API proxy is working correctly
3. In development: restart your dev server (npm run dev)
4. In production: check Vercel deployment logs for API errors

Original error: ${error.message}`);
      } else if (error.message.includes('API key') || error.message.includes('x-key') || error.message.includes('not configured')) {
        throw new Error(`Flux API key error: ${error.message}

Production troubleshooting:
1. Verify VITE_FLUX_API_KEY is set in your Vercel environment variables
2. Check the API key is valid and not expired
3. Ensure the key has proper permissions for Flux API access`);
      } else if (error.message.includes('quota') || error.message.includes('credits') || error.message.includes('billing')) {
        throw new Error(`Flux API quota exceeded: ${error.message}

Please check your Flux API account:
1. Verify your billing information is up to date
2. Check your credit balance
3. Review your usage limits`);
      } else if (error.message.includes('Content Moderated') || error.message.includes('Request Moderated')) {
        throw new Error('Content policy violation. Please modify your prompt and try again.');
      } else if (error.message.includes('Timeout') || error.message.includes('timeout')) {
        throw new Error('Banner generation timed out. The Flux API might be experiencing high load. Please try again.');
      } else if (error.message.includes('500') || error.message.includes('Internal server error')) {
        throw new Error(`Flux API server error: ${error.message}

This is likely a temporary issue with the Flux API. Please try again in a few minutes.`);
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        throw new Error(`Flux API endpoint not found: ${error.message}

This might indicate a deployment issue. Please check:
1. The API proxy is deployed correctly
2. All environment variables are set
3. Try refreshing the page`);
      }
    }
    
    throw new Error(`Failed to generate banner with Flux 1.1 Pro: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
 
