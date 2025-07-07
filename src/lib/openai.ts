import OpenAI from 'openai';

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
});

export interface BannerGenerationRequest {
  partnerName: string;
  partnerUrl?: string;
  benefits: string[];
  promotionalText: string;
  ctaText: string;
  customPrompt?: string;
  promotionDiscount?: string;
  brandColors?: {
    primary?: string;
    secondary?: string;
  };
  referenceImages?: string[]; // URLs to logos, brand visuals, product photos
  style: string;
  aspectRatio: '3:2';
  // Enhanced context
  partnerDescription?: string;
  selectedBenefit?: string;
  hasLogo?: boolean;
  hasReferenceBanners?: boolean;
  hasProductPhotos?: boolean;
  referenceImageCount?: number;
}

export interface GeneratedBanner {
  imageUrl: string;
  base64Data: string;
  prompt: string;
}

/**
 * Check if OpenAI API key is configured and valid
 */
export function isOpenAIConfigured(): boolean {
  return !!import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here';
}

/**
 * Get current API key status for debugging
 */
export function getAPIKeyStatus(): { configured: boolean; placeholder: boolean; keyPreview?: string } {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  return {
    configured: !!apiKey,
    placeholder: apiKey === 'your_openai_api_key_here',
    keyPreview: apiKey ? `${apiKey.substring(0, 7)}...` : undefined
  };
}

/**
 * Generate comprehensive English prompt optimized for gradient extension
 */
function generateEnglishPrompt(request: BannerGenerationRequest): string {
  const {
    partnerName,
    partnerUrl,
    benefits,
    promotionalText,
    ctaText,
    promotionDiscount,
    customPrompt,
    brandColors,
    hasLogo,
    hasReferenceBanners,
    hasProductPhotos,
    referenceImageCount,
    selectedBenefit
  } = request;

  // Start with main prompt structure in English
  let prompt = `Create an attractive horizontal promotional banner for the company "${partnerName}". The design should be clean, modern and well-balanced. It will be displayed in a website home carrousel of banners.

BUSINESS CONTEXT (for understanding only - DO NOT display this text):
- Company: ${partnerName}`;
  
  if (partnerUrl) {
    prompt += `\n- Website: ${partnerUrl}`;
  }
  
  // Benefit is mandatory and part of context
  if (selectedBenefit) {
    prompt += `\n- Target benefit/service: ${selectedBenefit}`;
  }
  
  if (benefits && benefits.length > 0) {
    prompt += `\n- Available services: ${benefits.slice(0, 5).join(', ')}`;
  }

  prompt += `\n\nTEXT TO DISPLAY (in Spanish):
- Main promotional text: "${promotionalText}"
- Call-to-action: "${ctaText}"`;

  // Add discount if provided
  if (promotionDiscount && promotionDiscount.trim()) {
    prompt += `\n- Featured discount: "${promotionDiscount}%" (highlight prominently)`;
  }

  // Custom prompt gets priority and more relevance
  if (customPrompt && customPrompt.trim()) {
    prompt += `\n\nCUSTOM DESIGN REQUIREMENTS (PRIORITY - follow these instructions carefully):
${customPrompt.trim()}`;
  }

  // Brand and visual guidance
  prompt += `\n\nVISUAL ELEMENTS:`;
  
  // Logo handling
  if (hasLogo) {
    prompt += `\n- Incorporate the company logo visibly and professionally on the left side`;
  } else {
    prompt += `\n- Use the company name "${partnerName}" with prominent and modern typography as the main visual element`;
  }

  // Product photos
  if (hasProductPhotos) {
    prompt += `\n- Visually showcase the products or services using the provided reference images in the center of the banner`;
  } else if (benefits && benefits.length > 0) {
    prompt += `\n- Include visual elements related to: ${benefits.slice(0, 3).join(', ')}`;
  }

  // Brand colors
  if (brandColors?.primary) {
    prompt += `\n- Use the brand's primary color: ${brandColors.primary}`;
    if (brandColors?.secondary) {
      prompt += ` and secondary color: ${brandColors.secondary}`;
    }
  } else {
    prompt += `\n- Use a neutral and professional color palette (corporate blue, grays, whites)`;
  }

  // Style reference handling
  if (hasReferenceBanners) {
    prompt += `\n- Inspired by the visual style of the provided reference images`;
  }

  // Layout optimized for gradient extension - MORE DETAILED
  prompt += `\n\nCRITICAL 4:1 EXPANSION DESIGN REQUIREMENTS:
- Generate in 16:9 format (1536x1024) but design for 4:1 final display
- MANDATORY: Create solid color or subtle gradient backgrounds on the LEFT and RIGHT edges (at least 200px each side)
- These edge areas MUST use colors that can be seamlessly extended horizontally with gradients
- Edge colors should be: solid brand colors, soft gradients, or neutral tones (avoid complex patterns, textures, or imagery on edges)
- Main content (logo, text, products) concentrated in the central 60% of the banner
- Left edge area: Should contain brand color or complementary solid color for gradient extension
- Right edge area: Should contain matching or harmonious solid color for gradient extension
- Avoid placing any important visual elements in the outer 20% on each side
- Design as if the banner will be stretched horizontally - edges must flow naturally when extended`;

  // Composition details
  prompt += `\n\nSTYLE AND COMPOSITION:
- Balanced composition with three sections: logo/brand (left-center), product/central visual (center), CTA/discount (right-center)
- Adequate white space and attractive visual distribution
- Modern typography, clear and high contrast against the background
- Professional corporate appearance suitable for employee benefits platform
- Ensure horizontal gradient-friendly design with extensible solid color edges`;

  // Add context for HR benefits platform
  prompt += `\n\nUSAGE CONTEXT:
- The banner will be used on an employee benefits platform home carousel
- Should have a modern and professional corporate appearance
- Targeted at employees looking for business benefits and discounts
- Will be displayed alongside other partner banners in a rotating carousel`;

  // Final technical requirements
  prompt += `\n\nTECHNICAL SPECIFICATIONS:
- Edge gradient compatibility: Solid colors on left/right 200px margins
- Central content area: 1392x1024 (avoid outer edges for important content)
- All text content in Spanish language
- High-quality, professional marketing banner appearance
- Optimized for web display and carousel rotation

Create a professional promotional banner for ${partnerName} following these exact specifications with particular attention to gradient-extensible edge design.`;

  return prompt;
}

/**
 * Describe reference images for prompt context
 */
function describeReferenceImages(request: BannerGenerationRequest): string {
  const { hasLogo, hasReferenceBanners, hasProductPhotos, referenceImageCount } = request;
  
  if (!referenceImageCount || referenceImageCount === 0) {
    return '';
  }

  let description = `\n\nREFERENCE IMAGES (${referenceImageCount} provided):`;
  
  if (hasLogo) {
    description += `\n- Company logo: Use in the left section of the banner`;
  }
  
  if (hasReferenceBanners) {
    description += `\n- Reference banners: Follow the visual style and design approach shown`;
  }
  
  if (hasProductPhotos) {
    description += `\n- Product photos: Incorporate in the central section of the banner showcasing the products/services`;
  }
  
  description += `\nIntegrate these images as actual visual elements in the banner design.`;
  
  return description;
}

/**
 * Generate banner image using OpenAI Image API (gpt-image-1 only)
 */
export async function generateBannerImage(
  request: BannerGenerationRequest
): Promise<GeneratedBanner> {
  try {
    // Generate English prompt optimized for gradient extension
    let prompt = generateEnglishPrompt(request);
    
    // Add reference images description if available
    if (request.referenceImages && request.referenceImages.length > 0) {
      prompt += describeReferenceImages(request);
      
      // Add reference URLs to prompt for context (since we can't pass files directly)
      prompt += `\n\nVisual references available for inspiration:`;
      request.referenceImages.slice(0, 4).forEach((url, index) => {
        prompt += `\n- Image ${index + 1}: ${url}`;
      });
    }
    
    console.log('Generated English prompt for gradient extension:', prompt);

    // Always use images.generate with gpt-image-1
    console.log('Generating banner using gpt-image-1 at 1536x1024');
    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1536x1024", // 16:9 format optimized for gradient extension
      quality: "medium",
      n: 1,
    });

    if (!result.data || result.data.length === 0) {
      throw new Error('No image generated by OpenAI API');
    }

    const imageData = result.data[0];
    
    // Handle both base64 and URL responses
    let imageUrl: string;
    let base64Data: string;

    if (imageData.b64_json) {
      base64Data = imageData.b64_json;
      imageUrl = `data:image/png;base64,${base64Data}`;
    } else if (imageData.url) {
      imageUrl = imageData.url;
      // Convert URL to base64 for consistent handling
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        base64Data = await new Promise((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.warn('Failed to convert URL to base64:', error);
        base64Data = '';
      }
    } else {
      throw new Error('Invalid response format from OpenAI API');
    }

    return {
      imageUrl,
      base64Data,
      prompt
    };

  } catch (error) {
    console.error('Banner generation failed:', error);
    
    if (error instanceof Error) {
      // Handle specific OpenAI API errors with Spanish messages
      if (error.message.includes('API key')) {
        throw new Error('La API key de OpenAI falta o es inválida. Por favor verifica tu configuración.');
      } else if (error.message.includes('quota')) {
        throw new Error('Cuota de la API de OpenAI excedida. Por favor verifica los límites de tu cuenta.');
      } else if (error.message.includes('content policy')) {
        throw new Error('Violación de política de contenido. Por favor modifica tu prompt e intenta de nuevo.');
      } else if (error.message.includes('billing')) {
        throw new Error('Problema de facturación con la API de OpenAI. Por favor verifica tu cuenta.');
      }
    }
    
    throw new Error(`Error al generar banner: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Extract brand colors from a partner's website URL
 * This is a placeholder implementation - in production, you might use a color extraction service
 */
export async function extractBrandColors(partnerUrl: string): Promise<{ primary?: string; secondary?: string }> {
  try {
    // This is a simplified implementation
    // In production, you might use a service like Brand Colors API or implement color extraction
    // Colors should be defined from partner's brand guidelines, not extracted from URL
    console.warn('extractBrandColors called but colors should come from partner brand guidelines');
    return {};
  } catch (error) {
    console.warn('Failed to extract brand colors:', error);
    return {};
  }
} 