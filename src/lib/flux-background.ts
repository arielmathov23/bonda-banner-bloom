// Background Banner Generation with Flux 1.1 Pro
// 
// This module handles the generation of banner backgrounds (Layer A) without any products or text.
// The background is optimized for text overlay and product placement.
//
// Workflow: Step A - Generate clean background based on style analysis

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
    
    console.log(`🎨 [STEP A] getResult called with taskId: ${taskId}, pollingUrl: ${pollingUrl}`);
    
    if (pollingUrl && pollingUrl.includes('api.bfl.ai/v1')) {
      // Convert external polling URL to use our proxy
      url = pollingUrl.replace('https://api.bfl.ai/v1', this.baseUrl);
      console.log(`🎨 [STEP A] Using external polling URL converted to proxy: ${url}`);
    } else {
      // Fallback: construct get_result URL through proxy
      url = `${this.baseUrl}/get_result?id=${taskId}`;
      console.log(`🎨 [STEP A] Using fallback constructed URL: ${url}`);
    }
    
    console.log(`🎨 [STEP A] Final polling URL: ${url}`);
    
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
    console.warn('Flux API key not configured for background generation:', {
      keyExists: !!apiKey,
      isPlaceholder: apiKey === 'your_flux_api_key_here',
      keyPreview: apiKey ? `${apiKey.substring(0, 7)}...` : 'undefined',
      env: import.meta.env.MODE
    });
  }
  
  return isConfigured;
}

/**
 * Generate background-only banner prompt (no product image in generation)  
 * Optimized for text overlay and product placement with PRECISE color matching
 */
function generateBackgroundOnlyPrompt(
  partnerName: string,
  productDescription: string,
  styleAnalysis: any,
  productStyleInfo: any,
  mainText: string,
  ctaText: string,
  discountPercentage?: number
): string {
  console.log('🎨 [PROMPT] Processing style analysis:', JSON.stringify(styleAnalysis?.reference_style?.color_palette, null, 2));
  console.log('🎨 [PROMPT] Processing product style info:', JSON.stringify(productStyleInfo, null, 2));
  
  // Extract comprehensive style elements with intelligent fallbacks
  const colorPalette = styleAnalysis?.reference_style?.color_palette || {};
  const backgroundTreatment = styleAnalysis?.reference_style?.background_treatment || {};
  const designComponents = styleAnalysis?.reference_style?.design_components || {};
  const brandPersonality = styleAnalysis?.reference_style?.brand_personality || {};
  const wowFactorElements = styleAnalysis?.reference_style?.wow_factor_elements || {};
  const compositionStructure = styleAnalysis?.reference_style?.composition_structure || {};
  const backgroundEnhancement = styleAnalysis?.reference_style?.background_enhancement_potential || {};
  
  // INTEGRATE PRODUCT STYLE INFO with brand style analysis
  let primaryColors, accentColors, secondaryColors, colorTemp;
  
  if (productStyleInfo?.styleInfo) {
    console.log('🎨 [PROMPT] Using product-derived style information');
    // Use product style as primary source, enhanced with brand compatibility
    const productColors = productStyleInfo.styleInfo.dominantColors || [];
    const productAccents = productStyleInfo.styleInfo.accentColors || [];
    const recommendedBgColors = productStyleInfo.styleInfo.backgroundCompatibility?.recommendedColors || [];
    
    primaryColors = recommendedBgColors.length > 0 ? recommendedBgColors.join(', ') : (colorPalette.dominant_colors || '#0072B8, #004A99');
    accentColors = productAccents.length > 0 ? productAccents.join(', ') : (colorPalette.accent_colors || '#00A3E0, #66B2FF');
    secondaryColors = productColors.length > 0 ? productColors.join(', ') : (colorPalette.secondary_colors || '#E6F3FF, #B3D9FF');
    colorTemp = productStyleInfo.styleInfo.colorTemperature || colorPalette.color_temperature || 'cool and professional';
  } else {
    console.log('🎨 [PROMPT] Using brand style analysis fallback');
    // Fallback to brand style analysis
    primaryColors = colorPalette.dominant_colors || '#0072B8, #004A99';
    accentColors = colorPalette.accent_colors || '#00A3E0, #66B2FF';
    secondaryColors = colorPalette.secondary_colors || '#E6F3FF, #B3D9FF';
    colorTemp = colorPalette.color_temperature || 'cool and professional';
  }
  
  const gradientSophistication = colorPalette.gradient_sophistication || 'smooth professional transitions';
  const colorContrast = colorPalette.color_contrast_strategy || 'high-contrast for impact';
  
  // Enhanced background treatment with proper fallbacks
  const backgroundType = backgroundTreatment.base_type || 'professional gradient';
  const gradientDetails = backgroundTreatment.gradient_details || 'left-to-right smooth transition';
  const atmosphereStyle = backgroundTreatment.atmosphere_style || 'clean modern professional';
  const textureDetails = backgroundTreatment.texture_details || 'smooth professional finish';
  const environmentalElements = backgroundTreatment.environmental_elements || 'clean abstract environment';
  
  // Enhanced design components with product style integration
  const geometricElements = designComponents.geometric_elements || 'clean modern lines';
  let patternDetails = designComponents.pattern_details || 'minimal professional patterns';
  
  // Override pattern details with product recommendations if available
  if (productStyleInfo?.styleInfo?.backgroundCompatibility?.patternSuggestions?.length > 0) {
    const productPatterns = productStyleInfo.styleInfo.backgroundCompatibility.patternSuggestions;
    patternDetails = productPatterns.join(' and ') + ' patterns optimized for product compatibility';
    console.log('🎨 [PROMPT] Using product-recommended patterns:', patternDetails);
  }
  
  const dimensionalEffects = designComponents.dimensional_effects || 'subtle depth and shadows';
  const iconographicElements = designComponents.iconographic_elements || 'abstract professional elements';
  
  // Brand personality
  const visualTone = brandPersonality.visual_tone || 'professional and modern';
  const approachability = brandPersonality.approachability || 'welcoming and professional';
  const emotionalImpact = brandPersonality.emotional_impact || 'trust and innovation';

  // EXTRACT PRODUCT-SPECIFIC STYLE ENHANCEMENTS
  let materialFinishStyle = textureDetails; // fallback to brand texture style
  let visualStyleApproach = visualTone; // fallback to brand visual tone
  
  if (productStyleInfo?.styleInfo) {
    // Integrate material finish from product analysis
    const productMaterialFinish = productStyleInfo.styleInfo.materialFinish;
    if (productMaterialFinish) {
      materialFinishStyle = `${productMaterialFinish} texture optimized for ${productMaterialFinish} product compatibility`;
      console.log('🎨 [PROMPT] Using product material finish:', materialFinishStyle);
    }
    
    // Integrate visual style from product analysis
    const productVisualStyle = productStyleInfo.styleInfo.visualStyle;
    if (productVisualStyle) {
      visualStyleApproach = `${productVisualStyle} aesthetic approach enhanced for ${productVisualStyle} product presentation`;
      console.log('🎨 [PROMPT] Using product visual style:', visualStyleApproach);
    }
  }

  console.log('🎨 [PROMPT] Color values being used:', {
    primaryColors,
    accentColors,
    secondaryColors,
    colorTemp,
    backgroundType,
    patternDetails,
    environmentalElements,
    materialFinishStyle,
    visualStyleApproach
  });

  // Validate color values
  if (!primaryColors || primaryColors.includes('undefined') || primaryColors === '#0072B8, #004A99') {
    console.warn('🚨 [PROMPT] Primary colors not properly extracted, using fallback');
  }

  // Create ultra-focused color-first prompt with aggressive restrictions
  const prompt = `Professional banner background with CENTER FOCUS and EDGE CONTRAST. Color palette: ${primaryColors} (dominant), ${accentColors} (accents), ${secondaryColors} (details).

<composition_requirements>
CENTER SPOTLIGHT: Create a 400x200px clear center area (30% of banner) that is BRIGHTER and LESS BUSY
The center must be optimized for product overlay with maximum contrast
EDGE FADE: Gradually fade to ${colorTemp === 'Warm' ? 'soft shadows' : 'gentle gradients'} at all 4 edges
Border intensity should be ${colorTemp === 'Warm' ? '20% darker' : '15% more saturated'} than center
</composition_requirements>

<color_palette_rules>
Primary color ${primaryColors} must dominate (70% of design)
Accent color ${accentColors} for patterns and highlights  
Detail color ${secondaryColors} for depth elements
${colorTemp} color temperature throughout
FORBIDDEN: blue, teal, turquoise, pink, purple, cyan, magenta (unless specified in palette)
Only use the 3 specified colors above
</color_palette_rules>

<center_focus_design>
CENTER AREA (middle 400x200px): Lighter/cleaner version of ${primaryColors}
Center should have minimal patterns - just subtle ${accentColors} accents
Create a natural "spotlight effect" drawing attention to center
Center background should contrast well with both dark and light products
</center_focus_design>

<edge_treatment>
OUTER EDGES: More intense ${primaryColors} with full ${patternDetails}
FADE TRANSITION: Smooth 100px fade from edges toward center
${colorTemp === 'Warm' ? 'DARK FADE: Edges 30% darker for warm contrast' : 'GRADIENT FADE: Edges more saturated for cool contrast'}
Corner areas can have more complex ${patternDetails} in ${accentColors}
</edge_treatment>

<pattern_distribution>
EDGE PATTERNS: Full ${patternDetails} intensity at borders
TRANSITION ZONE: 50% pattern intensity 
CENTER ZONE: Minimal patterns, maximum product visibility
Pattern elements should guide eye toward center
</pattern_distribution>

<technical_specifications>
Banner dimensions: 1440x352px
Center focus area: 400x200px (positioned center)
Edge fade: 100px transition zone
${visualStyleApproach} mood with ${atmosphereStyle} atmosphere
${backgroundType} base with ${materialFinishStyle}
</technical_specifications>

<absolute_restrictions>
NO landscapes, skies, clouds, sunsets, nature scenes
NO airplanes, vehicles, buildings, objects, people
NO photographic or realistic elements  
NO text, logos, symbols, or writing anywhere
NO busy patterns in the center area
Simple abstract design optimized for product overlay
</absolute_restrictions>

<final_goal>
Create a ${primaryColors} background with ${patternDetails} and ${materialFinishStyle} that naturally frames and highlights a center product area with perfect contrast for overlay. Use ${visualStyleApproach} to complement the product aesthetic.
</final_goal>`;

  return prompt;
}

/**
 * Generate banner background only (without product image) - Step A
 * This creates the foundation layer for text overlay and product placement
 */
export async function generateBannerBackground(
  partnerName: string,
  productDescription: string,
  styleAnalysis: any,
  productStyleInfo: any,
  mainText: string,
  ctaText: string,
  discountPercentage?: number,
  onProgress?: (progress: number, status: string) => void
): Promise<GeneratedBanner> {
  try {
    console.log('🎨 [STEP A] Starting Flux background generation...');
    console.log('🎨 [STEP A] Style analysis received:', {
      hasStyleAnalysis: !!styleAnalysis,
      hasReferenceStyle: !!styleAnalysis?.reference_style,
      hasColorPalette: !!styleAnalysis?.reference_style?.color_palette,
      colorPalette: styleAnalysis?.reference_style?.color_palette,
      partnerName,
      productDescription: productDescription?.substring(0, 100) + '...'
    });
    onProgress?.(10, 'Generando fondo del banner...');

    if (!isFluxConfigured()) {
      throw new Error('Flux API key is not configured for background generation');
    }

    // Validate style analysis data
    if (!styleAnalysis || !styleAnalysis.reference_style) {
      console.warn('🎨 [STEP A] Missing or incomplete style analysis data, using fallback values');
    }

    // Generate background-only prompt
    const prompt = generateBackgroundOnlyPrompt(
      partnerName,
      productDescription,
      styleAnalysis,
      productStyleInfo,
      mainText,
      ctaText,
      discountPercentage
    );

    console.log('🎨 [STEP A] Generated background prompt (first 200 chars):', prompt.substring(0, 200) + '...');
    onProgress?.(20, 'Creando fondo optimizado...');

    // Set exact banner dimensions (validated for Flux)
    const targetDimensions = validateFluxDimensions(1440, 352);
    console.log('🎨 [STEP A] Using banner dimensions:', targetDimensions);
    
    const client = new FluxAPIClient(import.meta.env.VITE_FLUX_API_KEY);
    
    console.log('🎨 [STEP A] Creating Flux background task...');
    onProgress?.(30, 'Creando tarea de fondo...');

    const taskRequest: FluxTaskRequest = {
      prompt: prompt,
      width: targetDimensions.width,
      height: targetDimensions.height,
      prompt_upsampling: false,
      seed: null,
      safety_tolerance: 3,
      output_format: 'png',
      image_prompt: null // No product image for background generation
    };

    const task = await client.createTask(taskRequest);
    console.log('🎨 [STEP A] Flux background task created:', task.id);
    onProgress?.(40, 'Generando fondo...');

    const result = await client.pollForResult(task.id, task.polling_url, 30, 2000);
    onProgress?.(90, 'Fondo generado...');

    if (result.status !== 'Ready' || !result.result) {
      throw new Error(`Flux background generation failed: ${result.status}`);
    }

    const imageUrl = result.result.sample;
    console.log('🎨 [STEP A] Background generation completed successfully:', imageUrl);

    onProgress?.(100, 'Fondo completado');

    return {
      imageUrl: imageUrl,
      base64Data: '',
      prompt: prompt
    };

  } catch (error) {
    console.error('🎨 [STEP A] Error in Flux background generation:', error);
    throw new Error(`Failed to generate background: ${error}`);
  }
}
