import OpenAI from 'openai';

// Initialize OpenAI client for style analysis
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface StyleAnalysis {
  reference_style: {
    color_composition: {
      primary_palette: string;
      accent_colors: string;
      background_treatment: string;
      contrast_level: string;
      color_temperature: string;
    };
    typography: {
      headline_style: string;
      body_text_treatment: string;
      text_hierarchy: string;
      text_effects: string;
    };
    layout_composition: {
      visual_balance: string;
      white_space_usage: string;
      element_arrangement: string;
      focus_direction: string;
    };
    imagery_style: {
      photo_treatment: string;
      product_presentation: string;
      human_elements: string;
      visual_metaphors: string;
    };
    brand_personality: {
      tone: string;
      target_demographic: string;
      emotional_appeal: string;
      brand_voice: string;
    };
    technical_elements: {
      cta_styling: string;
      logo_integration: string;
      border_treatment: string;
      effects_usage: string;
    };
  };
}

/**
 * Convert image file to base64 for OpenAI API
 */
async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to convert image to base64'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate comprehensive style analysis prompt with partner context
 */
function generateStyleAnalysisPrompt(partnerName: string, partnerDescription: string, regions: string[]): string {
  return `You are a professional brand and marketing analyst. Analyze the provided reference banner images for "${partnerName}" and extract detailed style DNA that can be used to generate consistent marketing materials.

**Partner Context:**
- Company: ${partnerName}
- Description: ${partnerDescription || 'Not provided'}
- Target Regions: ${regions.join(', ')}

**Analysis Instructions:**
1. Examine ALL provided banner images carefully
2. Identify consistent visual patterns across the images
3. Extract the brand's visual DNA and style characteristics
4. Focus on elements that make this brand recognizable and distinctive

**Required Output Format:**
Return a JSON object with the following structure. Be specific and descriptive in each field:

{
  "reference_style": {
    "color_composition": {
      "primary_palette": "Describe the main brand colors with hex codes if visible (e.g., 'Deep blue (#1a365d), warm orange (#ed8936)')",
      "accent_colors": "Secondary colors used for highlights, CTAs, or accents",
      "background_treatment": "How backgrounds are handled (solid colors, gradients, photos, textures, white space)",
      "left_side_background": "Detailed description of left side background treatment for text overlay (solid color, gradient fade, transparent overlay, dark vignette, light fade, texture pattern, etc.)",
      "right_side_background": "Detailed description of right side background treatment for text overlay (solid color, gradient fade, transparent overlay, dark vignette, light fade, texture pattern, etc.)",
      "text_overlay_zones": "Specific areas optimized for text readability (dark overlay zones, light backgrounds, high contrast areas, gradient transitions)",
      "fade_effects": "Description of any fade effects from center to edges (radial fade, linear gradient, vignette darkening, edge softening, etc.)",
      "contrast_level": "Overall contrast approach (high contrast for readability, soft/muted, dramatic)",
      "color_temperature": "Dominant color temperature (warm/orange-red, cool/blue-green, neutral)"
    },
    "typography": {
      "headline_style": "Main headline characteristics (bold sans-serif, elegant script, modern condensed, etc.)",
      "body_text_treatment": "Supporting text style (clean minimal, decorative, condensed, etc.)",
      "text_hierarchy": "How text sizes and weights create hierarchy",
      "text_effects": "Any text treatments (drop shadows, outlines, gradients, 3D effects, flat)"
    },
    "layout_composition": {
      "visual_balance": "Overall layout approach (centered, left-aligned, asymmetrical grid, dynamic)",
      "white_space_usage": "How empty space is used (minimal/packed, generous breathing room, strategic gaps)",
      "element_arrangement": "How elements relate (overlapping layers, clean separation, integrated design)",
      "focus_direction": "How the eye is guided through the design (left-to-right, center-out, diagonal flow)"
    },
    "imagery_style": {
      "photo_treatment": "Image style (realistic photography, stylized/filtered, illustrations, graphics)",
      "product_presentation": "How products are shown (lifestyle context, clean studio, in-use, abstract)",
      "human_elements": "People in images (diverse models, lifestyle shots, hands-only, no people)",
      "visual_metaphors": "Symbolic or conceptual elements vs literal product representation"
    },
    "brand_personality": {
      "tone": "Overall brand feeling (professional/corporate, playful/fun, luxury/premium, approachable/friendly, bold/edgy)",
      "target_demographic": "Apparent target audience indicators (young professionals, families, tech-savvy, traditional)",
      "emotional_appeal": "What emotions are evoked (trust/reliability, excitement/energy, comfort/security, aspiration/success)",
      "brand_voice": "Communication style (authoritative expert, friendly neighbor, cutting-edge innovator, trusted tradition)"
    },
    "technical_elements": {
      "cta_styling": "Call-to-action button/text design (bold buttons, text links, color treatment, positioning)",
      "logo_integration": "How the logo is used (prominent header, subtle corner, watermark, integrated into design)",
      "border_treatment": "Edge and frame approach (clean edges, rounded corners, decorative borders, no borders)",
      "effects_usage": "Visual effects used (drop shadows, gradients, textures, flat design, 3D elements)"
    }
  }
}

**Important Guidelines:**
- Be specific and actionable in descriptions
- Include actual color values when visible
- Note patterns that appear across multiple images
- Focus on elements that could be replicated in new banner designs
- If images show different styles, describe the dominant or most consistent approach
- Use professional marketing and design terminology`;
}

/**
 * Analyze reference banner images using OpenAI Vision API
 */
export async function analyzeReferenceStyle(
  images: File[],
  partnerName: string,
  partnerDescription: string = '',
  regions: string[] = []
): Promise<StyleAnalysis> {
  try {
    console.log(`Starting style analysis for ${partnerName} with ${images.length} reference images`);

    if (images.length === 0) {
      throw new Error('No images provided for analysis');
    }

    // Convert all images to base64
    const imagePromises = images.map(async (file) => {
      const base64 = await imageToBase64(file);
      return {
        type: "image_url" as const,
        image_url: {
          url: `data:${file.type};base64,${base64}`,
          detail: "high" as const
        }
      };
    });

    const imageContent = await Promise.all(imagePromises);

    // Create the complete message content
    const messageContent = [
      {
        type: "text" as const,
        text: generateStyleAnalysisPrompt(partnerName, partnerDescription, regions)
      },
      ...imageContent
    ];

    console.log('Sending style analysis request to OpenAI...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini for vision capabilities
      messages: [
        {
          role: "user",
          content: messageContent
        }
      ],
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for consistent, analytical responses
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    console.log('OpenAI style analysis response received');

    // Parse the JSON response
    try {
      // Extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      
      const styleAnalysis = JSON.parse(jsonStr) as StyleAnalysis;
      
      console.log('Style analysis completed successfully');
      return styleAnalysis;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Raw response:', content);
      throw new Error('Failed to parse style analysis response from OpenAI');
    }

  } catch (error) {
    console.error('Error in style analysis:', error);
    throw error;
  }
}

/**
 * Check if style analysis is available (OpenAI configured)
 */
export function isStyleAnalysisAvailable(): boolean {
  return !!import.meta.env.VITE_OPENAI_API_KEY && 
         import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here';
} 