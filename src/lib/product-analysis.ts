import OpenAI from 'openai';

// Initialize OpenAI client for product analysis
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

/**
 * Convert image file to base64 for OpenAI API with proper validation
 */
async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Validate file
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        reject(new Error(`Invalid file type: ${file.type}. Expected image/*`));
        return;
      }
      
      if (file.size === 0) {
        reject(new Error('Empty file'));
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        reject(new Error('File too large (max 10MB)'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const result = reader.result as string;
          
          if (!result || typeof result !== 'string') {
            reject(new Error('Failed to read file as data URL'));
            return;
          }
          
          // Validate data URL format
          if (!result.startsWith('data:image/')) {
            reject(new Error('Invalid data URL format'));
            return;
          }
          
          // Remove data URL prefix (e.g., "data:image/png;base64,")
          const base64 = result.split(',')[1];
          
          if (!base64 || base64.length === 0) {
            reject(new Error('Empty base64 data'));
            return;
          }
          
          // Validate base64 format
          try {
            atob(base64);
          } catch (error) {
            reject(new Error('Invalid base64 encoding'));
            return;
          }
          
          console.log(`Successfully converted image to base64. Size: ${file.size} bytes, Base64 length: ${base64.length}`);
          resolve(base64);
        } catch (error) {
          reject(new Error(`Failed to process file data: ${error}`));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error occurred'));
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error(`Image processing error: ${error}`));
    }
  });
}

/**
 * Extract style information from product image for background generation
 */
export async function analyzeProductImage(imageFile: File): Promise<{
  productDescription: string;
  styleInfo: {
    dominantColors: string[];
    accentColors: string[];
    colorTemperature: 'warm' | 'cool' | 'neutral';
    materialFinish: string;
    visualStyle: string;
    backgroundCompatibility: {
      recommendedColors: string[];
      avoidColors: string[];
      patternSuggestions: string[];
    };
  };
}> {
  try {
    console.log('🎨 Starting product style analysis with OpenAI Vision...');

    // Convert image to base64
    const base64Image = await imageToBase64(imageFile);

    const prompt = `Analyze this product image and extract STYLE INFORMATION for banner background generation.

EXTRACT STYLE DATA (Return as JSON):
{
  "productDescription": "Brief product name and category (max 50 words)",
  "styleInfo": {
    "dominantColors": ["#hex1", "#hex2", "#hex3"],
    "accentColors": ["#hex1", "#hex2"],
    "colorTemperature": "warm|cool|neutral",
    "materialFinish": "matte|glossy|metallic|fabric|plastic|glass|wood",
    "visualStyle": "modern|classic|luxury|minimalist|industrial|organic",
    "backgroundCompatibility": {
      "recommendedColors": ["#hex1", "#hex2", "#hex3"],
      "avoidColors": ["#hex1", "#hex2"],
      "patternSuggestions": ["geometric", "gradient", "solid", "textured"]
    }
  }
}

FOCUS ON:
- Extract exact HEX colors from the product (#RRGGBB format)
- Identify complementary colors for background
- Suggest pattern styles that enhance the product
- Determine warm/cool temperature
- Avoid colors that clash with the product

EXAMPLE OUTPUT:
{
  "productDescription": "Premium rose gold smartphone with metallic finish",
  "styleInfo": {
    "dominantColors": ["#E8B4A0", "#D4A574", "#C19A6B"],
    "accentColors": ["#F4E4D6", "#8B7355"],
    "colorTemperature": "warm",
    "materialFinish": "metallic",
    "visualStyle": "luxury",
    "backgroundCompatibility": {
      "recommendedColors": ["#F5F1EB", "#E6DDD4", "#D2C2B0"],
      "avoidColors": ["#0066CC", "#FF1493", "#00FF00"],
      "patternSuggestions": ["gradient", "subtle geometric", "soft texture"]
    }
  }
}

Return ONLY valid JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini for vision capabilities
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageFile.type};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3, // Very low temperature for consistent JSON output
    });

    const jsonResponse = response.choices[0]?.message?.content;
    if (!jsonResponse) {
      throw new Error('No response generated from OpenAI');
    }

    console.log('🎨 Raw OpenAI response:', jsonResponse);

    // Parse the JSON response (handle markdown code blocks)
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      let cleanJson = jsonResponse.trim();
      
      // Check if response is wrapped in markdown code blocks
      if (cleanJson.startsWith('```json') || cleanJson.startsWith('```')) {
        console.log('🎨 Detected markdown code blocks, cleaning JSON...');
        // Remove opening code block
        cleanJson = cleanJson.replace(/^```(?:json)?\s*\n?/, '');
        // Remove closing code block
        cleanJson = cleanJson.replace(/\n?\s*```\s*$/, '');
        console.log('🎨 Cleaned JSON:', cleanJson.substring(0, 200) + '...');
      }
      
      parsedResponse = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', jsonResponse);
      console.error('❌ Parse error:', parseError);
      throw new Error(`Invalid JSON response from OpenAI: ${parseError}`);
    }

    // Validate the response structure
    if (!parsedResponse.styleInfo || !parsedResponse.productDescription) {
      throw new Error('Invalid response structure from OpenAI');
    }

    console.log('🎨 Product style analysis completed successfully');
    console.log('🎨 Extracted style info:', parsedResponse.styleInfo);

    return parsedResponse;

  } catch (error) {
    console.error('Error analyzing product image:', error);
    throw new Error(`Failed to analyze product image: ${error}`);
  }
}

/**
 * Check if product analysis is available (OpenAI configured)
 */
export function isProductAnalysisAvailable(): boolean {
  return !!import.meta.env.VITE_OPENAI_API_KEY && 
         import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here';
} 