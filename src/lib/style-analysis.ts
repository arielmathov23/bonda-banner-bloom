import OpenAI from 'openai';

// Initialize OpenAI client for style analysis
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface StyleAnalysis {
  reference_style: {
    color_palette: {
      dominant_colors: string;
      accent_colors: string;
      secondary_colors: string;
      color_intensity: string;
      color_temperature: string;
      color_harmony: string;
      brand_color_usage: string;
    };
    background_treatment: {
      base_type: string;
      gradient_details: string;
      environmental_elements: string;
      depth_treatment: string;
      overlay_treatment: string;
      texture_details: string;
      lighting_approach: string;
      atmosphere_style: string;
    };
    design_components: {
      geometric_elements: string;
      decorative_elements: string;
      structural_lines: string;
      pattern_details: string;
      dimensional_effects: string;
      border_treatments: string;
      accent_graphics: string;
      iconographic_elements: string;
    };
    photo_integration: {
      person_placement: string;
      photo_background_blend: string;
      photo_treatment: string;
      scale_relationship: string;
      cutout_style: string;
      photo_effects: string;
      integration_quality: string;
    };
    composition_structure: {
      visual_weight: string;
      focal_areas: string;
      space_usage: string;
      layout_grid: string;
      hierarchy_flow: string;
      balance_approach: string;
      negative_space: string;
    };
    brand_personality: {
      visual_tone: string;
      sophistication_level: string;
      energy_level: string;
      approachability: string;
      innovation_vs_tradition: string;
      premium_vs_accessible: string;
    };
    technical_specifications: {
      aspect_ratio: string;
      resolution_quality: string;
      color_profile: string;
      contrast_levels: string;
      saturation_approach: string;
      sharpness_style: string;
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
  return `You are a professional brand and marketing analyst specializing in visual identity extraction. Analyze the provided reference banner images for "${partnerName}" and extract comprehensive style DNA that can be used to generate consistent marketing banners.

**Partner Context:**
- Company: ${partnerName}

**Analysis Instructions:**
1. Examine the provided banner images carefully to analyze the ACTUAL backgrounddesign and visual elements present
2. Extract specific design patterns, color schemes, and visual treatments
3. Identify unique brand personality traits conveyed through design
4. Analyze technical execution and quality standards
5. Focus on background design, photo treatment, and layout composition
6. **CRITICALLY ANALYZE**: Visual impact elements that create "scroll-stopping" appeal
7. Completely ignore text content, logos, and brand names - focus only on visual design DNA

**Required Output Format:**
Return a JSON object with the following structure. Be EXACT and SPECIFIC about what you observe:

{
  "reference_style": {
    "color_palette": {
      "dominant_colors": "Primary background colors with exact hex codes (e.g., '#0066cc', '#004499')",
      "accent_colors": "Secondary accent colors visible in backgrounds, graphics, overlays",
      "secondary_colors": "Supporting colors used in details, gradients, or subtle elements",
      "color_intensity": "Vibrant/saturated/muted/subtle - describe the overall color strength",
      "color_temperature": "Warm/cool/neutral - overall temperature of the color scheme",
      "color_harmony": "Monochromatic/analogous/complementary/triadic - color relationship strategy",
      "brand_color_usage": "How brand colors are applied (dominant/accent/highlight/background)",
      "gradient_sophistication": "Simple/complex/multi-directional/radial/mesh - gradient complexity level",
      "color_contrast_strategy": "High-contrast/subtle/graduated/dramatic - how colors interact for impact"
    },
    "background_treatment": {
      "base_type": "Solid/linear_gradient/radial_gradient/environmental_photo/texture/pattern/composite",
      "gradient_details": "Direction (left-to-right/top-to-bottom/radial/diagonal), colors, transition points",
      "environmental_elements": "Real-world background elements (architecture, equipment, nature, office, industrial)",
      "depth_treatment": "Background depth creation (blur/fade/layering/sharp_focus/bokeh)",
      "overlay_treatment": "Colored overlays, transparency effects, filters, vignettes applied",
      "texture_details": "Surface textures (smooth/rough/metallic/matte/glossy/fabric/paper)",
      "lighting_approach": "Natural/studio/dramatic/soft/hard lighting characteristics",
      "atmosphere_style": "Professional/casual/energetic/calm/modern/traditional atmosphere"
    },
    "wow_factor_elements": {
      "visual_impact_level": "Subtle/moderate/high/dramatic/explosive - overall scroll-stopping potential",
      "dynamic_background_elements": "Motion blur, particle effects, flowing lines, energy trails, light streaks",
      "premium_effects": "Holographic overlays, metallic sheens, glass morphism, depth blur, atmospheric lighting",
      "modern_trends_applied": "Glassmorphism, neumorphism, gradient meshes, 3D elements, neon accents, abstract shapes",
      "depth_illusions": "Layered parallax, floating elements, dimensional stacking, shadow depth, perspective tricks",
      "light_and_shadow": "Dramatic lighting, soft glows, hard shadows, rim lighting, backlighting effects",
      "texture_sophistication": "Subtle noise, fabric weaves, metal brushing, glass reflections, organic textures",
      "color_drama": "Vibrant pops, neon highlights, deep shadows, color bleeding, saturation gradients"
    },
    "design_components": {
      "geometric_elements": "Lines (diagonal/horizontal/vertical/curved), shapes (circles/rectangles/triangles)",
      "decorative_elements": "Borders, frames, ornamental details, abstract shapes, design flourishes",
      "structural_lines": "Grid lines, dividers, accent lines, directional elements that guide the eye",
      "pattern_details": "Dots, stripes, chevrons, zigzags, repeating motifs, textural patterns",
      "dimensional_effects": "3D elements, shadows, highlights, depth illusions, layered components",
      "border_treatments": "Edge treatments, frame styles, containment methods, boundary definitions",
      "accent_graphics": "Small graphic elements, icons, symbols, decorative graphics not part of main design",
      "iconographic_elements": "Symbolic elements, industry-specific graphics, representational elements",
      "flow_elements": "Directional arrows, curved paths, spiral motions, wave patterns, organic flows",
      "energy_indicators": "Speed lines, burst patterns, radiating elements, dynamic compositions"
    },
    "photo_integration": {
      "person_placement": "Exact position (left-side/right-side/center/bottom-right/top-left/full-frame)",
      "photo_background_blend": "Integration method (cutout/natural_blend/overlay/fade/composite)",
      "photo_treatment": "Visual treatment (natural/enhanced/stylized/filtered/color_graded)",
      "scale_relationship": "Size proportion relative to background space (dominant/balanced/accent)",
      "cutout_style": "Edge treatment for cutout photos (clean/soft/feathered/artistic)",
      "photo_effects": "Applied effects (shadows/glows/reflections/distortions/filters)",
      "integration_quality": "How seamlessly photos blend with background (perfect/good/obvious/stylized)",
      "product_scale_optimization": "Ideal product size percentage (25%/30%/35%/40%) for banner composition",
      "positioning_strategy": "Strategic placement for maximum impact (rule-of-thirds/golden-ratio/centered/offset)"
    },
    "composition_structure": {
      "visual_weight": "Weight distribution (left-heavy/right-heavy/top-heavy/bottom-heavy/balanced)",
      "focal_areas": "Primary attention zones (upper-left/center/lower-right/multiple)",
      "space_usage": "Background space utilization (full-bleed/contained/asymmetrical/centered)",
      "layout_grid": "Underlying structure (rule-of-thirds/golden-ratio/centered/free-form)",
      "hierarchy_flow": "Visual flow direction (left-to-right/top-to-bottom/circular/diagonal)",
      "balance_approach": "Balance method (symmetrical/asymmetrical/radial/mosaic)",
      "negative_space": "Empty space usage (minimal/generous/strategic/cluttered)",
      "text_overlay_zones": "Optimal areas for text placement (left-third/right-third/center/top/bottom)",
      "visual_breathing_room": "Space allocation for comfortable viewing (tight/balanced/generous/spacious)"
    },
    "brand_personality": {
      "visual_tone": "Overall mood (professional/friendly/serious/playful/sophisticated/approachable)",
      "sophistication_level": "Design complexity (minimal/moderate/complex/luxury/premium)",
      "energy_level": "Visual energy (calm/moderate/dynamic/high-energy/explosive)",
      "approachability": "Accessibility feeling (corporate/friendly/intimidating/welcoming/neutral)",
      "innovation_vs_tradition": "Design approach (cutting-edge/modern/classic/traditional/timeless)",
      "premium_vs_accessible": "Market positioning (luxury/premium/mid-market/accessible/budget)",
      "scroll_stopping_potential": "Likelihood to capture attention (low/moderate/high/exceptional)",
      "emotional_impact": "Feeling evoked (excitement/trust/luxury/innovation/reliability/aspiration)"
    },
    "technical_specifications": {
      "aspect_ratio": "Banner proportions (16:9/21:9/3:1/custom)",
      "resolution_quality": "Image clarity (high/medium/low resolution indicators)",
      "color_profile": "Color space characteristics (vibrant/natural/muted/high-contrast)",
      "contrast_levels": "Contrast approach (high/medium/low/dramatic/subtle)",
      "saturation_approach": "Color saturation (highly_saturated/natural/desaturated/selective)",
      "sharpness_style": "Edge treatment (crisp/soft/artistic/mixed)",
      "rendering_quality": "Overall polish level (basic/professional/premium/luxury/cutting-edge)"
    },
    "background_enhancement_potential": {
      "missing_wow_elements": "Visual impact elements that could be added to enhance appeal",
      "modern_upgrade_opportunities": "Current design trends that could elevate the visual impact",
      "depth_enhancement_suggestions": "Ways to add dimensional interest to flat backgrounds",
      "color_intensity_improvements": "Opportunities to increase visual drama through color",
      "texture_enrichment_possibilities": "Surface treatments that could add premium feel",
      "lighting_drama_potential": "Lighting effects that could increase visual interest",
      "composition_optimization": "Layout improvements for better visual flow and impact"
    }
  }
}

**Critical Analysis Guidelines:**
- Provide EXACT hex color codes by analyzing actual colors visible
- Be precise about gradient directions and transition points
- Describe environmental elements that create context or atmosphere
- Identify specific design components: lines, shapes, patterns, textures
- Specify exact positioning and spatial relationships
- Analyze how different elements work together to create brand personality
- Focus on technical execution quality and professional standards
- Completely ignore all text, logos, and brand names - extract only visual design DNA
- Be specific about measurements, positions, and proportions where possible
- Describe how elements contribute to overall brand feeling and market positioning
- **CRITICAL**: If the reference design lacks modern visual impact, explicitly note enhancement opportunities`;
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