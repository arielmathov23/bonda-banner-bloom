import ColorThief from 'colorthief';
import { loadImageWithProxy, createCanvasFromUrl } from './cors-helper';

// Types for banner framing
export interface FramingOptions {
  targetWidth: number;
  targetHeight: number;
  fallbackColor?: string;
  brandColors?: {
    primary?: string;
    secondary?: string;
  };
}

export interface ExtractedColors {
  dominant: string;
  secondary: string;
  palette: string[];
  leftEdgeColor?: string;
  rightEdgeColor?: string;
}

export interface FramedBannerResult {
  framedImageUrl: string;
  originalImageUrl: string;
  extractedColors: ExtractedColors;
  frameSize: { width: number; height: number };
}

/**
 * Convert RGB array to hex color string
 */
function rgbToHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Calculate average color from RGB values
 */
function averageColor(colors: [number, number, number][]): [number, number, number] {
  if (colors.length === 0) return [243, 244, 246]; // Default gray
  
  const sum = colors.reduce(
    (acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b],
    [0, 0, 0]
  );
  
  return [
    Math.round(sum[0] / colors.length),
    Math.round(sum[1] / colors.length),
    Math.round(sum[2] / colors.length)
  ];
}

/**
 * Extract edge colors more precisely by sampling multiple points and analyzing background
 */
function extractEdgeColors(imageData: ImageData, width: number, height: number): { left: string; right: string } {
  const data = imageData.data;
  const leftColors: [number, number, number][] = [];
  const rightColors: [number, number, number][] = [];
  
  // Sample wider edges for better background detection
  const sampleWidth = Math.min(80, width * 0.15); // Sample up to 15% of image width
  const sampleStep = 2; // Sample every 2 pixels for more data
  
  // Sample left edge - focus on middle area to avoid artifacts
  const startY = height * 0.25;
  const endY = height * 0.75;
  
  for (let y = startY; y < endY; y += sampleStep) {
    for (let x = 0; x < sampleWidth; x += sampleStep) {
      const index = (Math.floor(y) * width + Math.floor(x)) * 4;
      if (index < data.length) {
        const alpha = data[index + 3];
        // Only consider opaque pixels
        if (alpha > 200) {
          leftColors.push([data[index], data[index + 1], data[index + 2]]);
        }
      }
    }
  }
  
  // Sample right edge
  for (let y = startY; y < endY; y += sampleStep) {
    for (let x = Math.max(0, width - sampleWidth); x < width; x += sampleStep) {
      const index = (Math.floor(y) * width + Math.floor(x)) * 4;
      if (index < data.length) {
        const alpha = data[index + 3];
        // Only consider opaque pixels
        if (alpha > 200) {
          rightColors.push([data[index], data[index + 1], data[index + 2]]);
        }
      }
    }
  }
  
  // If we don't have enough samples, fall back to corner sampling
  if (leftColors.length < 10) {
    // Sample top-left and bottom-left corners
    for (let y = 0; y < Math.min(50, height); y += 4) {
      for (let x = 0; x < Math.min(50, width); x += 4) {
        const index = (y * width + x) * 4;
        if (index < data.length && data[index + 3] > 200) {
          leftColors.push([data[index], data[index + 1], data[index + 2]]);
        }
      }
    }
  }
  
  if (rightColors.length < 10) {
    // Sample top-right and bottom-right corners
    for (let y = 0; y < Math.min(50, height); y += 4) {
      for (let x = Math.max(0, width - 50); x < width; x += 4) {
        const index = (y * width + x) * 4;
        if (index < data.length && data[index + 3] > 200) {
          rightColors.push([data[index], data[index + 1], data[index + 2]]);
        }
      }
    }
  }
  
  const leftAvg = averageColor(leftColors);
  const rightAvg = averageColor(rightColors);
  
  return {
    left: rgbToHex(leftAvg),
    right: rgbToHex(rightAvg)
  };
}

/**
 * Detect if image has uniform background by analyzing color variance
 */
function analyzeBackgroundUniformity(imageData: ImageData, width: number, height: number): {
  isUniform: boolean;
  backgroundColor: string;
  variance: number;
} {
  const data = imageData.data;
  const samples: [number, number, number][] = [];
  
  // Sample background area (edges and corners)
  const sampleAreas = [
    { x: 0, y: 0, w: width * 0.2, h: height * 0.2 }, // Top-left
    { x: width * 0.8, y: 0, w: width * 0.2, h: height * 0.2 }, // Top-right
    { x: 0, y: height * 0.8, w: width * 0.2, h: height * 0.2 }, // Bottom-left
    { x: width * 0.8, y: height * 0.8, w: width * 0.2, h: height * 0.2 }, // Bottom-right
    { x: 0, y: height * 0.4, w: width * 0.1, h: height * 0.2 }, // Left edge
    { x: width * 0.9, y: height * 0.4, w: width * 0.1, h: height * 0.2 }, // Right edge
  ];
  
  for (const area of sampleAreas) {
    for (let y = area.y; y < area.y + area.h && y < height; y += 8) {
      for (let x = area.x; x < area.x + area.w && x < width; x += 8) {
        const index = (Math.floor(y) * width + Math.floor(x)) * 4;
        if (index < data.length && data[index + 3] > 200) {
          samples.push([data[index], data[index + 1], data[index + 2]]);
        }
      }
    }
  }
  
  if (samples.length === 0) {
    return { isUniform: false, backgroundColor: '#F3F4F6', variance: 100 };
  }
  
  const avgColor = averageColor(samples);
  
  // Calculate variance
  let totalVariance = 0;
  for (const [r, g, b] of samples) {
    const rDiff = r - avgColor[0];
    const gDiff = g - avgColor[1];
    const bDiff = b - avgColor[2];
    totalVariance += Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
  }
  
  const variance = totalVariance / samples.length;
  const isUniform = variance < 25; // Threshold for uniform background
  
  return {
    isUniform,
    backgroundColor: rgbToHex(avgColor),
    variance
  };
}

/**
 * Extract exact background colors by sampling directly from image edges
 */
function extractPerfectEdgeColors(imageData: ImageData, width: number, height: number): { 
  left: string; 
  right: string; 
  leftSamples: string[];
  rightSamples: string[];
} {
  const data = imageData.data;
  const leftSamples: string[] = [];
  const rightSamples: string[] = [];
  
  // Sample the exact edge pixels - no approximation
  const edgeWidth = 1; // Sample exactly 1 pixel from each edge
  const sampleStep = 1; // Sample every pixel for maximum accuracy
  
  // Sample left edge - exact edge pixels
  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < edgeWidth; x++) {
      const index = (y * width + x) * 4;
      if (index < data.length) {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];
        
        if (alpha > 200) { // Only opaque pixels
          const color = rgbToHex([r, g, b]);
          leftSamples.push(color);
        }
      }
    }
  }
  
  // Sample right edge - exact edge pixels
  for (let y = 0; y < height; y += sampleStep) {
    for (let x = width - edgeWidth; x < width; x++) {
      const index = (y * width + x) * 4;
      if (index < data.length) {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];
        
        if (alpha > 200) { // Only opaque pixels
          const color = rgbToHex([r, g, b]);
          rightSamples.push(color);
        }
      }
    }
  }
  
  // Find the most common color on each edge
  const getMostCommonColor = (samples: string[]): string => {
    if (samples.length === 0) return '#F3F4F6';
    
    const colorCounts: { [key: string]: number } = {};
    samples.forEach(color => {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });
    
    return Object.entries(colorCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
  };
  
  const leftColor = getMostCommonColor(leftSamples);
  const rightColor = getMostCommonColor(rightSamples);
  
  return {
    left: leftColor,
    right: rightColor,
    leftSamples,
    rightSamples
  };
}

/**
 * Create perfect background match by sampling multiple edge strategies
 */
function createPerfectBackgroundMatch(imageData: ImageData, width: number, height: number): {
  backgroundColor: string;
  leftEdgeColor: string;
  rightEdgeColor: string;
  isUniform: boolean;
  confidence: number;
} {
  const data = imageData.data;
  
  // Strategy 1: Sample exact edges
  const edgeColors = extractPerfectEdgeColors(imageData, width, height);
  
  // Strategy 2: Sample corner regions for background detection
  const cornerSamples: string[] = [];
  const cornerSize = Math.min(50, width * 0.1, height * 0.1);
  
  // Sample all four corners
  const corners = [
    { x: 0, y: 0 }, // Top-left
    { x: width - cornerSize, y: 0 }, // Top-right
    { x: 0, y: height - cornerSize }, // Bottom-left
    { x: width - cornerSize, y: height - cornerSize } // Bottom-right
  ];
  
  corners.forEach(corner => {
    for (let y = corner.y; y < corner.y + cornerSize && y < height; y += 2) {
      for (let x = corner.x; x < corner.x + cornerSize && x < width; x += 2) {
        const index = (y * width + x) * 4;
        if (index < data.length && data[index + 3] > 200) {
          const color = rgbToHex([data[index], data[index + 1], data[index + 2]]);
          cornerSamples.push(color);
        }
      }
    }
  });
  
  // Find most common background color
  const colorCounts: { [key: string]: number } = {};
  [...edgeColors.leftSamples, ...edgeColors.rightSamples, ...cornerSamples].forEach(color => {
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  });
  
  const sortedColors = Object.entries(colorCounts).sort(([,a], [,b]) => b - a);
  const backgroundColor = sortedColors[0]?.[0] || '#F3F4F6';
  
  // Check uniformity - if the most common color represents >60% of samples
  const totalSamples = Object.values(colorCounts).reduce((a, b) => a + b, 0);
  const dominantColorCount = sortedColors[0]?.[1] || 0;
  const uniformityRatio = dominantColorCount / totalSamples;
  const isUniform = uniformityRatio > 0.6;
  
  return {
    backgroundColor,
    leftEdgeColor: edgeColors.left,
    rightEdgeColor: edgeColors.right,
    isUniform,
    confidence: uniformityRatio
  };
}

/**
 * Extract EXACT edge colors with ultra-precision sampling
 */
function extractUltraPreciseEdgeColors(imageData: ImageData, width: number, height: number): { 
  left: string; 
  right: string; 
  leftSamples: string[];
  rightSamples: string[];
  confidence: number;
} {
  const data = imageData.data;
  const leftSamples: string[] = [];
  const rightSamples: string[] = [];
  
  // Sample multiple columns from each edge for better accuracy
  const edgeColumns = 3; // Sample first/last 3 columns
  const sampleStep = 1; // Sample every pixel
  
  // Sample left edge - multiple columns
  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < edgeColumns; x++) {
      const index = (y * width + x) * 4;
      if (index < data.length) {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];
        
        if (alpha > 200) { // Only opaque pixels
          const color = rgbToHex([r, g, b]);
          leftSamples.push(color);
        }
      }
    }
  }
  
  // Sample right edge - multiple columns
  for (let y = 0; y < height; y += sampleStep) {
    for (let x = width - edgeColumns; x < width; x++) {
      const index = (y * width + x) * 4;
      if (index < data.length) {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];
        
        if (alpha > 200) { // Only opaque pixels
          const color = rgbToHex([r, g, b]);
          rightSamples.push(color);
        }
      }
    }
  }
  
  // Find the most dominant color on each edge with confidence scoring
  const getEdgeColorWithConfidence = (samples: string[]): { color: string; confidence: number } => {
    if (samples.length === 0) return { color: '#1a365d', confidence: 0 };
    
    const colorCounts: { [key: string]: number } = {};
    samples.forEach(color => {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });
    
    const sortedColors = Object.entries(colorCounts).sort(([,a], [,b]) => b - a);
    const dominantColor = sortedColors[0][0];
    const dominantCount = sortedColors[0][1];
    const confidence = dominantCount / samples.length;
    
    return { color: dominantColor, confidence };
  };
  
  const leftResult = getEdgeColorWithConfidence(leftSamples);
  const rightResult = getEdgeColorWithConfidence(rightSamples);
  
  // Overall confidence is the average of both edges
  const overallConfidence = (leftResult.confidence + rightResult.confidence) / 2;
  
  return {
    left: leftResult.color,
    right: rightResult.color,
    leftSamples,
    rightSamples,
    confidence: overallConfidence
  };
}

/**
 * Create PERFECT background analysis with multiple strategies
 */
function createUltraPreciseBackgroundMatch(imageData: ImageData, width: number, height: number): {
  backgroundColor: string;
  leftEdgeColor: string;
  rightEdgeColor: string;
  isUniform: boolean;
  confidence: number;
  strategy: string;
} {
  const data = imageData.data;
  
  // Strategy 1: Ultra-precise edge sampling
  const edgeAnalysis = extractUltraPreciseEdgeColors(imageData, width, height);
  
  // Strategy 2: Comprehensive background sampling
  const backgroundSamples: string[] = [];
  
  // Sample strategic areas for background detection
  const sampleAreas = [
    // Top edge
    { x: 0, y: 0, w: width, h: 20 },
    // Bottom edge  
    { x: 0, y: height - 20, w: width, h: 20 },
    // Left edge (wider)
    { x: 0, y: 0, w: 50, h: height },
    // Right edge (wider)
    { x: width - 50, y: 0, w: 50, h: height },
    // Corners (larger)
    { x: 0, y: 0, w: 100, h: 100 },
    { x: width - 100, y: 0, w: 100, h: 100 },
    { x: 0, y: height - 100, w: 100, h: 100 },
    { x: width - 100, y: height - 100, w: 100, h: 100 }
  ];
  
  sampleAreas.forEach(area => {
    for (let y = area.y; y < Math.min(area.y + area.h, height); y += 4) {
      for (let x = area.x; x < Math.min(area.x + area.w, width); x += 4) {
        const index = (y * width + x) * 4;
        if (index < data.length && data[index + 3] > 200) {
          const color = rgbToHex([data[index], data[index + 1], data[index + 2]]);
          backgroundSamples.push(color);
        }
      }
    }
  });
  
  // Analyze background uniformity
  const colorFrequency: { [key: string]: number } = {};
  [...edgeAnalysis.leftSamples, ...edgeAnalysis.rightSamples, ...backgroundSamples].forEach(color => {
    colorFrequency[color] = (colorFrequency[color] || 0) + 1;
  });
  
  const sortedColors = Object.entries(colorFrequency).sort(([,a], [,b]) => b - a);
  const dominantColor = sortedColors[0]?.[0] || '#1a365d';
  const dominantCount = sortedColors[0]?.[1] || 0;
  const totalSamples = Object.values(colorFrequency).reduce((a, b) => a + b, 0);
  const uniformityRatio = dominantCount / totalSamples;
  
  // Determine strategy and confidence
  let strategy = 'edge-sampling';
  let finalConfidence = edgeAnalysis.confidence;
  let isUniform = uniformityRatio > 0.7; // Higher threshold for uniformity
  
  // Check if edges match (indicating uniform background)
  const edgesMatch = edgeAnalysis.left === edgeAnalysis.right;
  const edgeMatchesDominant = (edgeAnalysis.left === dominantColor || edgeAnalysis.right === dominantColor);
  
  if (edgesMatch && edgeMatchesDominant && uniformityRatio > 0.8) {
    strategy = 'uniform-solid';
    finalConfidence = Math.max(0.9, uniformityRatio);
    isUniform = true;
  } else if (uniformityRatio > 0.6) {
    strategy = 'background-dominant';
    finalConfidence = uniformityRatio;
    isUniform = true;
  }
  
  return {
    backgroundColor: dominantColor,
    leftEdgeColor: edgeAnalysis.left,
    rightEdgeColor: edgeAnalysis.right,
    isUniform,
    confidence: finalConfidence,
    strategy
  };
}

/**
 * Extract dominant and secondary colors from an image with improved edge detection
 */
export async function extractImageColors(imageUrl: string): Promise<ExtractedColors> {
  try {
    // Use CORS proxy to load the image
    const img = await loadImageWithProxy(imageUrl);
    const colorThief = new ColorThief();
    
    // Get color palette (up to 8 colors)
    const palette = colorThief.getPalette(img, 8);
    
    if (!palette || palette.length === 0) {
      throw new Error('No colors extracted');
    }
    
    // Get dominant color (first in palette)
    const dominantRGB = palette[0];
    const dominant = rgbToHex(dominantRGB);
    
    // Get secondary color (second in palette, or a variation of dominant)
    let secondaryRGB = palette.length > 1 ? palette[1] : palette[0];
    
    // If we only have one color, create a lighter/darker variation
    if (palette.length === 1) {
      const [r, g, b] = dominantRGB;
      // Create a lighter version for secondary
      const factor = 0.7;
      secondaryRGB = [
        Math.min(255, Math.round(r + (255 - r) * factor)),
        Math.min(255, Math.round(g + (255 - g) * factor)),
        Math.min(255, Math.round(b + (255 - b) * factor))
      ] as [number, number, number];
    }
    
    const secondary = rgbToHex(secondaryRGB);
    const paletteHex = palette.map(rgb => rgbToHex(rgb));
    
    // Extract edge colors for better gradient matching
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const edgeColors = extractEdgeColors(imageData, img.width, img.height);
      
      return {
        dominant,
        secondary,
        palette: paletteHex,
        leftEdgeColor: edgeColors.left,
        rightEdgeColor: edgeColors.right
      };
    } else {
      // Fallback without edge detection
      return {
        dominant,
        secondary,
        palette: paletteHex,
        leftEdgeColor: dominant,
        rightEdgeColor: secondary
      };
    }
  } catch (error) {
    console.warn('Color extraction failed:', error);
    // Return fallback colors
    return {
      dominant: '#F3F4F6',
      secondary: '#E5E7EB',
      palette: ['#F3F4F6', '#E5E7EB'],
      leftEdgeColor: '#F3F4F6',
      rightEdgeColor: '#E5E7EB'
    };
  }
}

/**
 * Check if an image has a simple, extendable background with improved detection
 */
export async function hasExtendableBackground(imageUrl: string): Promise<boolean> {
  try {
    // Use CORS proxy to load the image
    const img = await loadImageWithProxy(imageUrl);
    
    // Create canvas to analyze edge pixels
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return false;
    }
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // Improved edge analysis
    const edgeWidth = 50; // Sample wider edge
    const sampleHeight = Math.min(200, img.height * 0.6); // Sample more height
    const startY = Math.floor((img.height - sampleHeight) / 2);
    
    // Get left and right edge data
    const leftEdge = ctx.getImageData(0, startY, edgeWidth, sampleHeight);
    const rightEdge = ctx.getImageData(img.width - edgeWidth, startY, edgeWidth, sampleHeight);
    
    // Check consistency with improved tolerance
    const tolerance = 40; // Slightly more tolerant
    
    const isConsistent = (pixels: Uint8ClampedArray): boolean => {
      if (pixels.length === 0) return false;
      
      const baseR = pixels[0];
      const baseG = pixels[1];
      const baseB = pixels[2];
      
      let consistentPixels = 0;
      const totalPixels = pixels.length / 4;
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        if (Math.abs(r - baseR) <= tolerance &&
            Math.abs(g - baseG) <= tolerance &&
            Math.abs(b - baseB) <= tolerance) {
          consistentPixels++;
        }
      }
      
      // Require 80% consistency
      return (consistentPixels / totalPixels) >= 0.8;
    };
    
    const leftConsistent = isConsistent(leftEdge.data);
    const rightConsistent = isConsistent(rightEdge.data);
    
    // Image is extendable if both edges are reasonably consistent
    return leftConsistent && rightConsistent;
  } catch (error) {
    console.warn('Background extendability check failed:', error);
    return false;
  }
}

/**
 * Create desktop framed banner with ULTRA-PRECISE background matching
 */
export async function createFramedBanner(
  originalImageUrl: string,
  options: FramingOptions = { targetWidth: 1440, targetHeight: 338 }
): Promise<FramedBannerResult> {
  const { targetWidth, targetHeight, fallbackColor = '#1a365d', brandColors } = options;
  
  try {
    // Extract colors with standard method first
    const extractedColors = await extractImageColors(originalImageUrl);
    
    // Create canvas for the final desktop frame
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    // Load and analyze the original image with ultra-precision using CORS proxy
    const img = await loadImageWithProxy(originalImageUrl);
    
    // Create ultra-high resolution analysis
    const analysisCanvas = document.createElement('canvas');
    const analysisCtx = analysisCanvas.getContext('2d');
    if (!analysisCtx) {
      throw new Error('Could not create analysis canvas');
    }
    
    // Use full resolution for maximum precision
    analysisCanvas.width = img.width;
    analysisCanvas.height = img.height;
    analysisCtx.drawImage(img, 0, 0);
    
    const imageData = analysisCtx.getImageData(0, 0, img.width, img.height);
    const ultraPreciseMatch = createUltraPreciseBackgroundMatch(imageData, img.width, img.height);
    
    console.log('Background analysis:', {
      strategy: ultraPreciseMatch.strategy,
      confidence: ultraPreciseMatch.confidence,
      isUniform: ultraPreciseMatch.isUniform,
      backgroundColor: ultraPreciseMatch.backgroundColor,
      leftEdge: ultraPreciseMatch.leftEdgeColor,
      rightEdge: ultraPreciseMatch.rightEdgeColor,
      hasBrandColors: !!brandColors?.primary
    });
    
    // Create PERFECT gradient based on ultra-precise analysis OR brand colors
    const gradient = ctx.createLinearGradient(0, 0, targetWidth, 0);
    
    // PRIORITY: Use brand colors if available and confidence is low
    if (brandColors?.primary && ultraPreciseMatch.confidence < 0.8) {
      console.log('Using brand colors due to low confidence:', brandColors.primary);
      gradient.addColorStop(0, brandColors.primary);
      gradient.addColorStop(1, brandColors.primary);
      
    } else if (ultraPreciseMatch.strategy === 'uniform-solid' && ultraPreciseMatch.confidence > 0.85) {
      // Perfect uniform background - use exact color
      const bgColor = ultraPreciseMatch.backgroundColor;
      gradient.addColorStop(0, bgColor);
      gradient.addColorStop(1, bgColor);
      console.log('Using uniform solid background:', bgColor);
      
    } else if (ultraPreciseMatch.isUniform && ultraPreciseMatch.confidence > 0.7) {
      // High confidence uniform background - minimal variation
      const bgColor = ultraPreciseMatch.backgroundColor;
      gradient.addColorStop(0, bgColor);
      gradient.addColorStop(0.1, bgColor);
      gradient.addColorStop(0.9, bgColor);
      gradient.addColorStop(1, bgColor);
      console.log('Using high-confidence uniform background:', bgColor);
      
    } else if (brandColors?.primary) {
      // Use brand colors as fallback for complex backgrounds
      console.log('Using brand colors as fallback for complex background:', brandColors.primary);
      gradient.addColorStop(0, brandColors.primary);
      if (brandColors.secondary) {
        gradient.addColorStop(0.2, brandColors.primary);
        gradient.addColorStop(0.8, brandColors.secondary);
        gradient.addColorStop(1, brandColors.secondary);
      } else {
        gradient.addColorStop(1, brandColors.primary);
      }
      
    } else {
      // Use precise edge colors for gradient
      const leftColor = ultraPreciseMatch.leftEdgeColor;
      const rightColor = ultraPreciseMatch.rightEdgeColor;
      
      if (leftColor === rightColor) {
        // Edges match - treat as uniform
        gradient.addColorStop(0, leftColor);
        gradient.addColorStop(1, leftColor);
      } else {
        // Different edge colors - create smooth transition
        gradient.addColorStop(0, leftColor);
        gradient.addColorStop(0.05, leftColor);
        gradient.addColorStop(0.95, rightColor);
        gradient.addColorStop(1, rightColor);
      }
      console.log('Using edge-based gradient:', leftColor, '→', rightColor);
    }
    
    // Fill background with ultra-precise gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    
    // Calculate dimensions for maximum visual impact
    const originalAspectRatio = img.width / img.height;
    
    let drawWidth: number;
    let drawHeight: number;
    
    // Use maximum space for better visual impact
    const maxHeight = targetHeight * 0.96; // Use 96% of frame height
    const maxWidth = targetWidth * 0.92;   // Use 92% of frame width
    
    if (originalAspectRatio > (maxWidth / maxHeight)) {
      drawWidth = maxWidth;
      drawHeight = drawWidth / originalAspectRatio;
    } else {
      drawHeight = maxHeight;
      drawWidth = drawHeight * originalAspectRatio;
    }
    
    // Perfect centering
    const drawX = (targetWidth - drawWidth) / 2;
    const drawY = (targetHeight - drawHeight) / 2;
    
    // Only add shadow for non-uniform backgrounds to maintain seamless look
    if (!ultraPreciseMatch.isUniform || ultraPreciseMatch.confidence < 0.8) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
    }
    
    // Draw the original image
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    
    // Convert to final image
    const framedImageUrl = canvas.toDataURL('image/png', 1.0);
    
    // Enhanced color information - include brand colors if used
    const enhancedColors: ExtractedColors = {
      ...extractedColors,
      leftEdgeColor: brandColors?.primary || ultraPreciseMatch.leftEdgeColor,
      rightEdgeColor: brandColors?.secondary || ultraPreciseMatch.rightEdgeColor,
      palette: brandColors?.primary ? 
        [brandColors.primary, brandColors.secondary || brandColors.primary, ...extractedColors.palette.slice(2)] :
        [ultraPreciseMatch.backgroundColor, ...extractedColors.palette.slice(1)]
    };
    
    return {
      framedImageUrl,
      originalImageUrl,
      extractedColors: enhancedColors,
      frameSize: { width: targetWidth, height: targetHeight }
    };
  } catch (error) {
    console.error('Failed to create framed banner:', error);
    throw error;
  }
}

/**
 * Download the framed banner
 */
export function downloadFramedBanner(
  framedImageUrl: string,
  filename: string = 'banner-4x1.png'
): void {
  const link = document.createElement('a');
  link.href = framedImageUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 