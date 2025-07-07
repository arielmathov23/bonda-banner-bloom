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
    // Use proxy in development, direct URL in production
    this.baseUrl = import.meta.env.DEV 
      ? '/api/flux'  // Proxy route for development
      : 'https://api.bfl.ai/v1';  // Direct API for production
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
    
    if (pollingUrl && import.meta.env.DEV) {
      // In development, convert external polling URL to use our proxy
      if (pollingUrl.includes('api.bfl.ai/v1')) {
        url = pollingUrl.replace('https://api.bfl.ai/v1', this.baseUrl);
      } else {
        url = `${this.baseUrl}/get_result?id=${taskId}`;
      }
    } else if (pollingUrl) {
      // In production, use the polling URL directly
      url = pollingUrl;
    } else {
      // Fallback: construct get_result URL
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
  return !!import.meta.env.VITE_FLUX_API_KEY && import.meta.env.VITE_FLUX_API_KEY !== 'your_flux_api_key_here';
}

export function getFluxAPIKeyStatus(): { configured: boolean; placeholder: boolean; keyPreview?: string } {
  const apiKey = import.meta.env.VITE_FLUX_API_KEY;
  return {
    configured: !!apiKey,
    placeholder: apiKey === 'your_flux_api_key_here',
    keyPreview: apiKey ? `${apiKey.substring(0, 7)}...` : undefined
  };
}

function generateOptimizedBannerPrompt(request: BannerGenerationRequest & { styleAnalysis?: any }, hasReferenceImage: boolean = false): string {
  const {
    ctaText,
    customPrompt,
    brandColors,
    hasProductPhotos,
    hasReferenceBanners,
    styleAnalysis
  } = request;

  // Extract brand colors for design context
  const primaryColor = brandColors?.primary || '#8A47F5';
  
  // Extract enhanced background treatment from style analysis
  const leftSideBackground = styleAnalysis?.reference_style?.color_composition?.left_side_background || 'solid dark background optimized for light text overlay';
  const rightSideBackground = styleAnalysis?.reference_style?.color_composition?.right_side_background || 'complementary background allowing product visibility';
  const textOverlayZones = styleAnalysis?.reference_style?.color_composition?.text_overlay_zones || 'high contrast areas for optimal text visibility';
  const fadeEffects = styleAnalysis?.reference_style?.color_composition?.fade_effects || 'subtle gradient transitions from center to edges';

  // Build context from custom prompt for AI understanding
  let contextualInfo = '';
  if (customPrompt && customPrompt.trim()) {
    contextualInfo = `[STYLE CONTEXT: ${customPrompt.trim()}] `;
  }

  // Enhanced prompt for professional banner background design
  let prompt = `${contextualInfo}[BANNER BACKGROUND GENERATION - NO TEXT RENDERING]

[DESIGN SPECIFICATIONS]
- Format: 1440x352 pixels horizontal banner background
- Purpose: Professional marketing banner background for e-commerce
- Style: Modern, clean, commercial-grade design
- Brand Color: ${primaryColor}

[CRITICAL INSTRUCTIONS]
- Generate ONLY the background design - DO NOT include any text, words, letters, or typography
- DO NOT render call-to-action buttons, text labels, or written content
- Text elements will be added separately as overlay in post-processing
- Focus on creating sophisticated visual background that supports text overlay
- Leave strategic clear areas for text placement on the left side

[BACKGROUND DESIGN REQUIREMENTS]
- Professional gradient or solid color background
- Complementary colors that work with ${primaryColor}
- Clean, modern aesthetic suitable for e-commerce
- Subtle geometric patterns or shapes (optional)
- High contrast areas that support text readability on the left
- Visual hierarchy that guides the eye
- Left 60% reserved for text overlay elements

[BACKGROUND TREATMENT SPECIFICATIONS]
- Left Side Background (60% of banner): ${leftSideBackground}
- Right Side Background (40% of banner): ${rightSideBackground}
- Text Overlay Zones: ${textOverlayZones}
- Fade Effects: ${fadeEffects}
- Ensure high contrast between background and where text will be placed
- Create smooth transitions between different background zones
- Optimize left side specifically for white/light colored text readability
- Optimize right side for product integration while maintaining text visibility

[VISUAL COMPOSITION]
- Use rule of thirds for balanced composition
- Create clear focal points for product and text areas
- Maintain visual balance between elements
- Leave adequate white/clear space for text overlay on left side
- Professional marketing quality background
- Suitable for web display and digital advertising

`;
  
  if (hasReferenceImage) {
    prompt += `[PRODUCT INTEGRATION - SIZE CONSTRAINT]
- Extract and incorporate the product from the reference image
- Product should occupy MAXIMUM 20% of the total banner area (288x70 pixels max)
- Position product in center-right or right portion of the banner
- Ensure product is clearly visible and well-lit but not dominant
- Maintain product proportions and professional presentation
- Use product as supporting visual element, not main focus
- Professional product photography lighting and presentation
- Product should complement the overall design, not overpower it
- Leave 80% of space for background design and text placement areas

[LAYOUT POSITIONING]
- Left 60% (864x352 pixels): Reserved for logo, text, and CTA placement
  * Background treatment: ${leftSideBackground}
  * Optimize for text contrast and readability
  * Apply fade effects: ${fadeEffects}
  * Ensure text overlay zones are clearly defined
- Right 40% (576x352 pixels): Available for product placement
  * Background treatment: ${rightSideBackground}
  * Maintain product visibility while supporting text if needed
  * Apply complementary fade effects that don't interfere with product
- Product uses maximum 20% of total banner space within the right area
- Maintain clear visual separation and hierarchy
- Create seamless transitions between left and right background treatments

`;
  }

  prompt += `[FINAL OUTPUT]
- Complete marketing banner background ready for text overlay
- Professional commercial quality
- Optimized for digital advertising platforms
- Modern, clean aesthetic foundation
- Strategic composition supporting text elements on the left
- Product (if included) positioned as supporting element, not dominant feature

IMPORTANT: This is a BACKGROUND GENERATION project. Do not include any text, typography, or written elements. Create a sophisticated visual foundation that will support text overlay elements, with any product elements limited to maximum 20% of the total image space.`;

  return prompt;
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
      safety_tolerance: 2,
      output_format: 'png',
      image_prompt: productImageBase64 // Use product image as reference
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
 */
function generateStyledBannerPrompt(
  partnerName: string,
  productDescription: string,
  styleAnalysis: any,
  mainText: string,
  ctaText: string,
  discountPercentage?: number
): string {
  // Extract style elements from analysis
  const colorPalette = styleAnalysis?.reference_style?.color_composition?.primary_palette || 'professional blue and white colors';
  const backgroundTreatment = styleAnalysis?.reference_style?.color_composition?.background_treatment || 'clean gradient background';
  const leftSideBackground = styleAnalysis?.reference_style?.color_composition?.left_side_background || 'solid color background optimized for text readability';
  const rightSideBackground = styleAnalysis?.reference_style?.color_composition?.right_side_background || 'complementary background allowing product visibility';
  const textOverlayZones = styleAnalysis?.reference_style?.color_composition?.text_overlay_zones || 'high contrast areas for optimal text visibility';
  const fadeEffects = styleAnalysis?.reference_style?.color_composition?.fade_effects || 'subtle gradient transitions from center to edges';
  const brandTone = styleAnalysis?.reference_style?.brand_personality?.tone || 'professional and modern';
  const layoutStyle = styleAnalysis?.reference_style?.layout_composition?.visual_balance || 'balanced and clean layout';

  const prompt = `[BANNER BACKGROUND GENERATION - NO TEXT OVERLAY]

[STYLE ANALYSIS: ${JSON.stringify(styleAnalysis?.reference_style || {})}]

[PRODUCT DESCRIPTION: ${productDescription}]

[SPECIFICATIONS]
- Dimensions: 1440x352 pixels (horizontal marketing banner)
- Brand: ${partnerName}
- Style: ${brandTone} 
- Layout: ${layoutStyle}
- Color Palette: ${colorPalette}
- Background: ${backgroundTreatment}

[CRITICAL INSTRUCTIONS]
- DO NOT include any text, words, or letters.Text overlay will be added separately in post-processing
- Focus on creating a sophisticated banner background.
- Leave clear space areas for text placement (left side for logo and text)

[BACKGROUND TREATMENT SPECIFICATIONS]
- Left Side Background (60% of banner): ${leftSideBackground}
- Right Side Background (40% of banner): ${rightSideBackground}
- Text Overlay Zones: ${textOverlayZones}
- Fade Effects: ${fadeEffects}
- Ensure high contrast between background and where text will be placed
- Create smooth transitions between different background zones
- Optimize left side specifically for white/light colored text readability
- Optimize right side for product integration while maintaining text visibility

[PRODUCT INTEGRATION RULES]
- Product should occupy MAXIMUM 20% of the total banner area
- Position product in center-right or right portion of the banner
- Product should be secondary to the overall design composition
- Maintain ample white/clear space around the product
- Product should complement the background, not dominate it
- Scale product appropriately to maintain visual hierarchy
- Ensure product doesn't interfere with left-side text placement areas

[DESIGN REQUIREMENTS]
- Professional marketing banner background
- High-quality commercial-grade aesthetic
- Product integrated naturally but not overwhelming the composition
- Maintain visual hierarchy with clear text placement areas on the left
- Background should enhance but not compete with text overlay
- Use referenced product image as accent element, not focal point
- Professional lighting and composition suitable for digital advertising
- 80% of space dedicated to background design and text areas
- 20% maximum space for product element

[LAYOUT COMPOSITION]
- Left 60% of banner: Reserved for logo, main text, and CTA button
  * Background treatment: ${leftSideBackground}
  * Optimize for text contrast and readability
  * Apply fade effects: ${fadeEffects}
  * Ensure text overlay zones are clearly defined
- Right 40% of banner: Product placement area (product uses max 20% of total)
  * Background treatment: ${rightSideBackground}
  * Maintain product visibility while supporting text if needed
  * Apply complementary fade effects that don't interfere with product
- Maintain visual balance between text space and product space
- Ensure clear visual separation between content areas
- Create seamless transitions between left and right background treatments

[TECHNICAL SPECIFICATIONS]
- Ultra-high quality commercial banner background
- Marketing campaign ready
- Optimized for digital advertising platforms
- Clean, modern aesthetic foundation
- Strategic white/clear space planning for text elements

Generate a sophisticated banner background that incorporates the referenced product image as a supporting element (maximum 20% of total space) while maintaining the specified brand style and leaving appropriate clear areas for text overlay elements on the left side.`;

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

    const generationPrompt = generateOptimizedBannerPrompt(request, hasReferenceImage);
    
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
      safety_tolerance: 4,
      output_format: 'png',
      image_prompt: selectedImageBase64 // Send the selected image directly
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
        throw new Error(`CORS Error: Cannot connect to Flux API directly from browser. 
        
Solutions:
1. Restart your dev server to use the proxy: npm run dev
2. For production, implement a backend proxy

Original error: ${error.message}`);
      } else if (error.message.includes('API key') || error.message.includes('x-key')) {
        throw new Error('Flux API key is missing or invalid. Please check your configuration.');
      } else if (error.message.includes('quota') || error.message.includes('credits')) {
        throw new Error('Flux API quota exceeded. Please check your account limits.');
      } else if (error.message.includes('Content Moderated') || error.message.includes('Request Moderated')) {
        throw new Error('Content policy violation. Please modify your prompt and try again.');
      } else if (error.message.includes('Timeout')) {
        throw new Error('Banner generation timed out. Please try again.');
      }
    }
    
    throw new Error(`Failed to generate banner with Flux 1.1 Pro: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
 