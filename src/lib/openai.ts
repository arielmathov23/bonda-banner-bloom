import OpenAI, { toFile } from 'openai';

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
 * Analyze business context from partner information
 */




/**
 * Generate comprehensive, detailed prompt for banner creation
 */
function generateComprehensivePrompt(request: BannerGenerationRequest): string {
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
    referenceImageCount
  } = request;

  // Build comprehensive prompt with context and specific display requirements
  let prompt = `Create a professional, high-impact promotional banner in exactly 3:2 aspect ratio (landscape format) for "${partnerName}".

BUSINESS CONTEXT (for understanding only - DO NOT display this text):
- Company: ${partnerName}`;
  
  if (partnerUrl) {
    prompt += `\n- Website: ${partnerUrl}`;
  }
  
  if (benefits && benefits.length > 0) {
    prompt += `\n- Business benefits/services: ${benefits.join(', ')}`;
  }

  prompt += `\n\nCRITICAL LAYOUT SPECIFICATIONS:
- Aspect Ratio: EXACTLY 3:2 (landscape format - 1536x1024 pixels)
- Mandatory Padding: 40px from all edges (creates inner content area of 1456x944)
- Precise Three-Section Layout with Perfect Alignment:

LEFT SECTION (364px width):
- Company logo: Horizontally centered, positioned 25% from top (height: max 120px)
- Promotional text "${promotionalText}": Horizontally centered, starts 40% from top, bold typography with proper line spacing

CENTER SECTION (728px width):
- Product images/visuals: Perfectly centered both horizontally and vertically within section
- Main focal point with balanced proportions
- If multiple products, arrange in balanced grid maintaining perfect center alignment

RIGHT SECTION (364px width):
- Discount information (if applicable): Centered horizontally, positioned in upper portion
- Call-to-action "${ctaText}": Centered horizontally below discount, prominent button-style
- Both elements vertically centered as a cohesive group within section

PIXEL-PERFECT ALIGNMENT REQUIREMENTS:
- All elements must align to invisible grid system for professional appearance
- Consistent baseline alignment across all three sections
- Logo: Maximum 120px height, optically centered in left section
- Text elements: Proper kerning, line spacing, and optical centering (not geometric)
- CTA button: Consistent padding, visually balanced proportions
- Product staging: Center-aligned with equal margins on all sides
- Visual separation: Clear breathing room between sections while maintaining cohesion
- Typography scaling: All text sized appropriately for 1536x1024 viewing

TEXT TO DISPLAY (use only this text):
- Main message: "${promotionalText}"
- Call-to-action: "${ctaText}"`;

  // Add discount code if provided
  if (promotionDiscount && promotionDiscount.trim()) {
    prompt += `\n- Discount: "${promotionDiscount}" (highlight prominently)`;
  }

  // Reference images context
  if (referenceImageCount && referenceImageCount > 0) {
    prompt += `\n\nREFERENCE IMAGES (${referenceImageCount} provided):`;
    if (hasLogo) {
      prompt += `\n- Logo: Use in LEFT section`;
    }
    if (hasReferenceBanners) {
      prompt += `\n- Style reference: Follow visual approach`;
    }
    if (hasProductPhotos) {
      prompt += `\n- Product images: Feature in CENTER section`;
    }
    prompt += `\nIntegrate these images as actual elements in the design.`;
  }

  // Visual specifications
  prompt += `\n\nPROFESSIONAL DESIGN QUALITY:
- Typography: Premium fonts, sized for 3:2 landscape format visibility
- Text Hierarchy: Logo small → Promotional text LARGE → CTA prominent
- Colors: Professional, high-contrast palette`;

  if (brandColors?.primary) {
    prompt += ` (primary: ${brandColors.primary}`;
    if (brandColors?.secondary) {
      prompt += `, secondary: ${brandColors.secondary}`;
    }
    prompt += `)`;
  }

  prompt += `\n- Visual Balance: Perfect proportional distribution across three sections
- Product Staging: Professional product photography styling
- White Space: Generous spacing between sections for clarity
- Brand Consistency: Cohesive visual identity throughout
- Landscape Optimization: All elements scaled for 3:2 viewing experience`;

  // Custom requirements
  if (customPrompt && customPrompt.trim()) {
    prompt += `\n\nCUSTOM REQUIREMENTS: ${customPrompt.trim()}`;
  }

  // Final instruction
  prompt += `\n\nCRITICAL SUCCESS REQUIREMENTS:
- ASPECT RATIO: Must be exactly 3:2 landscape format
- LAYOUT: Logo+text LEFT, products CENTER, CTA+discount RIGHT
- PADDING: 40px margins from all edges
- SIZING: All elements properly scaled for 3:2 landscape banner
- CONTENT: Only display specified promotional text and CTA, no additional text

Create a professional 3:2 landscape marketing banner for ${partnerName} following these exact specifications.`;

  return prompt;
}


/**
 * Convert image URL to File object for OpenAI API using toFile utility
 */
async function urlToFile(url: string, filename: string = 'reference.png'): Promise<File> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    
    // Use OpenAI's toFile utility to create proper File object
    return await toFile(blob, filename, { type: blob.type });
  } catch (error) {
    console.warn(`Failed to convert URL to file: ${url}`, error);
    throw error;
  }
}

/**
 * Generate banner image using OpenAI Image API
 */
export async function generateBannerImage(
  request: BannerGenerationRequest
): Promise<GeneratedBanner> {
  try {
    const prompt = generateComprehensivePrompt(request);
    console.log('Generated comprehensive prompt:', prompt);

    // Handle reference images
    const referenceFiles: File[] = [];
    if (request.referenceImages && request.referenceImages.length > 0) {
      console.log(`Processing ${request.referenceImages.length} reference images...`);
      
      // Convert reference image URLs to File objects
      const validUrls = request.referenceImages.filter(url => url && url.startsWith('http'));
      
      for (const url of validUrls.slice(0, 4)) { // Limit to 4 reference images
        try {
          const file = await urlToFile(url, `reference-${Date.now()}.png`);
          referenceFiles.push(file);
          console.log(`Successfully processed reference image: ${url}`);
        } catch (error) {
          console.warn(`Failed to process reference image: ${url}`, error);
        }
      }
    }

    let result;

    if (referenceFiles.length > 0) {
      // Use image edit API with reference images
      console.log(`Generating banner with ${referenceFiles.length} reference images using gpt-image-1`);
      result = await client.images.edit({
        model: "gpt-image-1",
        image: referenceFiles,
        prompt: prompt,
      });
    } else {
      // Use basic image generation without reference images
      console.log('Generating banner without reference images using gpt-image-1');
      result = await client.images.generate({
        model: "gpt-image-1", 
        prompt: prompt,
        size: "1536x1024", // 3:2 landscape format for better alignment
        quality: "standard",
        n: 1,
      });
    }

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
      // Handle specific OpenAI API errors
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is missing or invalid. Please check your configuration.');
      } else if (error.message.includes('quota')) {
        throw new Error('OpenAI API quota exceeded. Please check your account limits.');
      } else if (error.message.includes('content policy')) {
        throw new Error('Content policy violation. Please modify your prompt and try again.');
      }
    }
    
    throw new Error(`Failed to generate banner: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const defaultColors = {
      primary: '#3B82F6', // Blue
      secondary: '#E5E7EB' // Gray
    };
    
    return defaultColors;
  } catch (error) {
    console.warn('Failed to extract brand colors:', error);
    return {};
  }
} 