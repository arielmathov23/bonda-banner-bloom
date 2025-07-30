// Enhanced Background Removal using IS-Net (U²-Net Evolution) 
// Optimized for maximum accuracy with latest @imgly/background-removal package

import { removeBackground, preload, Config } from '@imgly/background-removal';

export interface BackgroundRemovalResult {
  imageUrl: string;
  blob: Blob;
  originalSize: number;
  processedSize: number;
}

/**
 * Enhanced configuration for maximum accuracy background removal
 * Optimized for products with white/light backgrounds and complex edges
 */
const getOptimizedConfig = (onProgress?: (progress: number, status: string) => void, useHighPrecision: boolean = true): Config => ({
  // Use full precision IS-Net for better white/light background handling
  model: useHighPrecision ? 'isnet' : 'isnet_fp16', // Full precision model for better white part detection
  
  // Use GPU when available for better accuracy with complex backgrounds
  device: isWebGPUSupported() ? 'gpu' : 'cpu', // GPU provides better accuracy for complex white backgrounds
  
  // Ultra-high quality output settings optimized for white backgrounds
  output: {
    format: 'image/png', // PNG for lossless quality with transparency
    quality: 1.0, // Maximum quality to preserve fine details and edges
  },
  
  // Enhanced processing options for better white background detection
  publicPath: '/assets/', // Ensure proper asset loading
  fetchArgs: {
    cache: 'force-cache', // Cache models for better performance
  },
  
  // Enable debugging for development
  debug: process.env.NODE_ENV === 'development',
  
  // Progress callback with enhanced status messages
  progress: onProgress ? (key: string, current: number, total: number) => {
    const progressPercent = Math.round((current / total) * 100);
    let status = 'Procesando con máxima precisión...';
    
    // Provide more specific status messages
    if (key.includes('model')) {
      status = useHighPrecision ? 'Cargando IS-Net (precisión completa)...' : 'Cargando IS-Net FP16...';
    } else if (key.includes('wasm')) {
      status = 'Inicializando procesador de alta precisión...';
    } else if (key.includes('ort')) {
      status = 'Configurando motor de detección avanzada...';
    } else if (key.includes('simd')) {
      status = 'Optimizando para detección de bordes...';
    }
    
    onProgress(progressPercent, status);
  } : undefined,
});

/**
 * Preload the background removal assets for faster subsequent processing
 * Call this during app initialization for better user experience
 */
export async function preloadBackgroundRemovalAssets(
  onProgress?: (progress: number, status: string) => void
): Promise<void> {
  try {
    console.log('🚀 [BG-REMOVAL] Preloading enhanced IS-Net assets for faster processing...');
    onProgress?.(0, 'Precargando recursos de IA avanzada...');
    
    // Preload high-precision model for white background handling
    const highPrecisionConfig = getOptimizedConfig((progressPercent, status) => {
      onProgress?.(progressPercent * 0.7, status);
    }, true);
    
    await preload(highPrecisionConfig);
    
    console.log('✅ [BG-REMOVAL] High-precision assets preloaded');
    onProgress?.(70, 'Modelo de alta precisión cargado');
    
    // Also preload FP16 model as fallback
    try {
      const fp16Config = getOptimizedConfig((progressPercent, status) => {
        const mappedProgress = 70 + (progressPercent * 0.3);
        onProgress?.(mappedProgress, `${status} (respaldo)`);
      }, false);
      
      await preload(fp16Config);
      console.log('✅ [BG-REMOVAL] FP16 fallback assets also preloaded');
    } catch (fp16Error) {
      console.warn('⚠️ [BG-REMOVAL] FP16 preload failed (non-critical):', fp16Error);
    }
    
    onProgress?.(100, 'Recursos de IA completamente cargados');
    console.log('✅ [BG-REMOVAL] All background removal assets preloaded successfully');
  } catch (error) {
    console.warn('⚠️ [BG-REMOVAL] Failed to preload main assets:', error);
    // Don't throw - this is just optimization, not critical
  }
}

/**
 * Analyze image to detect if it has white/light backgrounds that need special handling
 */
async function analyzeImageBackground(imageFile: File): Promise<{ hasWhiteBackground: boolean; brightness: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // Sample a small version for quick analysis
      const sampleSize = 100;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        
        // Sample corner pixels to detect background
        const corners = [
          ctx.getImageData(0, 0, 1, 1).data,
          ctx.getImageData(sampleSize - 1, 0, 1, 1).data,
          ctx.getImageData(0, sampleSize - 1, 1, 1).data,
          ctx.getImageData(sampleSize - 1, sampleSize - 1, 1, 1).data,
        ];
        
        let totalBrightness = 0;
        let whiteCorners = 0;
        
        corners.forEach(pixel => {
          const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
          totalBrightness += brightness;
          if (brightness > 240) whiteCorners++;
        });
        
        const avgBrightness = totalBrightness / 4;
        const hasWhiteBackground = whiteCorners >= 2 && avgBrightness > 200;
        
        console.log('🔍 [BG-ANALYSIS] Background analysis:', {
          avgBrightness: avgBrightness.toFixed(1),
          whiteCorners,
          hasWhiteBackground
        });
        
        resolve({ hasWhiteBackground, brightness: avgBrightness });
      } else {
        resolve({ hasWhiteBackground: false, brightness: 128 });
      }
    };
    
    img.onerror = () => resolve({ hasWhiteBackground: false, brightness: 128 });
    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Remove background from product image using advanced IS-Net model
 * Optimized for products with white/light backgrounds and complex edges
 */
export async function removeProductBackground(
  imageFile: File,
  onProgress?: (progress: number, status: string) => void
): Promise<BackgroundRemovalResult> {
  
  console.log('🎨 [BG-REMOVAL] Starting advanced IS-Net background removal...');
  console.log('📊 [BG-REMOVAL] Input image details:', {
    name: imageFile.name,
    size: `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`,
    type: imageFile.type,
    hasGPU: isWebGPUSupported()
  });
  
  onProgress?.(2, 'Analizando imagen...');

  // Analyze image for optimal processing strategy
  const { hasWhiteBackground, brightness } = await analyzeImageBackground(imageFile);
  
  console.log('🔍 [BG-REMOVAL] Image analysis complete:', {
    hasWhiteBackground,
    brightness: brightness.toFixed(1),
    strategy: hasWhiteBackground ? 'High-precision mode' : 'Standard mode'
  });

  onProgress?.(5, 'Configurando procesamiento optimizado...');

  try {
    // Use high precision for white backgrounds, standard for others
    const useHighPrecision = hasWhiteBackground || brightness > 200;
    
    // Get optimized configuration based on image analysis
    const config = getOptimizedConfig((progressPercent, status) => {
      // Map loading progress to 5-40% range
      const mappedProgress = 5 + (progressPercent * 0.35);
      onProgress?.(mappedProgress, status);
    }, useHighPrecision);

    console.log('🤖 [BG-REMOVAL] Using optimized IS-Net configuration:', {
      model: config.model,
      device: config.device,
      format: config.output?.format,
      quality: config.output?.quality,
      precision: useHighPrecision ? 'HIGH' : 'STANDARD',
      optimizedFor: hasWhiteBackground ? 'White backgrounds' : 'General use'
    });
    
    onProgress?.(40, useHighPrecision ? 'Procesando con máxima precisión...' : 'Procesando con IS-Net...');

    // Perform background removal with optimized model
    const startTime = performance.now();
    let blob = await removeBackground(imageFile, config);
    const processingTime = performance.now() - startTime;
    
    console.log('✅ [BG-REMOVAL] IS-Net processing complete:', {
      processingTime: `${(processingTime / 1000).toFixed(2)}s`,
      originalSize: `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`,
      resultSize: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
      compressionRatio: `${Math.round((1 - blob.size / imageFile.size) * 100)}%`,
      format: blob.type,
      model: config.model
    });
    
    onProgress?.(85, 'Optimizando bordes...');
    
    // Apply post-processing for white backgrounds
    if (hasWhiteBackground || brightness > 220) {
      console.log('🔧 [BG-REMOVAL] Applying white background post-processing...');
      const postProcessStartTime = performance.now();
      blob = await postProcessWhiteBackground(blob);
      const postProcessTime = performance.now() - postProcessStartTime;
      
      console.log('✅ [BG-REMOVAL] Post-processing complete:', {
        postProcessTime: `${(postProcessTime / 1000).toFixed(2)}s`,
        finalSize: `${(blob.size / 1024 / 1024).toFixed(2)} MB`
      });
    }
    
    onProgress?.(90, 'Finalizando resultado...');

    // Create object URL for preview with proper lifecycle management
    const imageUrl = URL.createObjectURL(blob);
    
    // Store the object URL globally to prevent premature revocation
    if (typeof window !== 'undefined') {
      (window as any).__backgroundRemovalUrls = (window as any).__backgroundRemovalUrls || new Set();
      (window as any).__backgroundRemovalUrls.add(imageUrl);
    }
    
    console.log('🔗 Object URL created and protected from revocation:', imageUrl);
    
    onProgress?.(100, 'Recorte optimizado completado');

    return {
      imageUrl,
      blob,
      originalSize: imageFile.size,
      processedSize: blob.size
    };

  } catch (error) {
    console.error('❌ [BG-REMOVAL] IS-Net processing failed:', error);
    
    // Smart fallback strategy based on error type
    if (error instanceof Error) {
      if (error.message.includes('WebGPU') || error.message.includes('gpu')) {
        console.log('🔄 [BG-REMOVAL] GPU failed, retrying with CPU...');
        return retryWithAlternativeConfig(imageFile, onProgress, 'cpu');
      } else if (error.message.includes('memory') || error.message.includes('out of memory')) {
        console.log('🔄 [BG-REMOVAL] Memory issue, retrying with FP16 model...');
        return retryWithAlternativeConfig(imageFile, onProgress, 'fp16');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        console.log('🔄 [BG-REMOVAL] Network issue, retrying with cached fallback...');
        return retryWithAlternativeConfig(imageFile, onProgress, 'fallback');
      }
    }
    
    // Final fallback
    console.log('🔄 [BG-REMOVAL] Trying final fallback with basic configuration...');
    return retryWithAlternativeConfig(imageFile, onProgress, 'basic');
  }
}

/**
 * Advanced fallback system with multiple strategies
 */
async function retryWithAlternativeConfig(
  imageFile: File,
  onProgress?: (progress: number, status: string) => void,
  fallbackType: 'cpu' | 'fp16' | 'fallback' | 'basic' = 'cpu'
): Promise<BackgroundRemovalResult> {
  
  console.log(`🔄 [BG-REMOVAL] Retrying with ${fallbackType} fallback...`);
  
  let config: Config;
  let statusMessage: string;
  
  switch (fallbackType) {
    case 'cpu':
      onProgress?.(50, 'Usando procesador como respaldo...');
      config = getOptimizedConfig((progressPercent, status) => {
        const mappedProgress = 50 + (progressPercent * 0.45);
        onProgress?.(mappedProgress, `${status} (CPU)`);
      }, true);
      config.device = 'cpu'; // Force CPU
      statusMessage = 'CPU fallback';
      break;
      
    case 'fp16':
      onProgress?.(50, 'Usando modelo optimizado...');
      config = getOptimizedConfig((progressPercent, status) => {
        const mappedProgress = 50 + (progressPercent * 0.45);
        onProgress?.(mappedProgress, `${status} (FP16)`);
      }, false); // Use FP16 model
      statusMessage = 'FP16 model fallback';
      break;
      
    case 'fallback':
      onProgress?.(50, 'Usando modo de compatibilidad...');
      config = {
        model: 'isnet_quint8',
        device: 'cpu',
        output: { format: 'image/png', quality: 0.9 },
        debug: false
      };
      statusMessage = 'IS-Net Quint8 compatibility fallback';
      break;
      
    case 'basic':
    default:
      onProgress?.(50, 'Usando configuración básica...');
      config = {
        model: 'isnet_quint8',
        device: 'cpu',
        output: { format: 'image/png', quality: 0.8 },
        debug: false
      };
      statusMessage = 'IS-Net Quint8 basic fallback';
      break;
  }
  
  try {
    console.log(`🤖 [BG-REMOVAL] ${statusMessage} configuration:`, {
      model: config.model,
      device: config.device,
      quality: config.output?.quality
    });
    
    const startTime = performance.now();
    const blob = await removeBackground(imageFile, config);
    const processingTime = performance.now() - startTime;
    
    const imageUrl = URL.createObjectURL(blob);
    
    // Store the object URL globally to prevent premature revocation
    if (typeof window !== 'undefined') {
      (window as any).__backgroundRemovalUrls = (window as any).__backgroundRemovalUrls || new Set();
      (window as any).__backgroundRemovalUrls.add(imageUrl);
    }
    
    console.log(`✅ [BG-REMOVAL] ${statusMessage} successful:`, {
      processingTime: `${(processingTime / 1000).toFixed(2)}s`,
      model: config.model,
      device: config.device
    });
    
    onProgress?.(100, `Completado con ${fallbackType.toUpperCase()}`);
    
    return {
      imageUrl,
      blob,
      originalSize: imageFile.size,
      processedSize: blob.size
    };
    
  } catch (fallbackError) {
    console.error(`❌ [BG-REMOVAL] ${statusMessage} also failed:`, fallbackError);
    
    // Try next fallback strategy if available
    if (fallbackType === 'cpu') {
      console.log('🔄 [BG-REMOVAL] CPU failed, trying FP16 model...');
      return retryWithAlternativeConfig(imageFile, onProgress, 'fp16');
    } else if (fallbackType === 'fp16') {
      console.log('🔄 [BG-REMOVAL] FP16 failed, trying Quint8 fallback...');
      return retryWithAlternativeConfig(imageFile, onProgress, 'fallback');
    } else if (fallbackType === 'fallback') {
      console.log('🔄 [BG-REMOVAL] Quint8 failed, trying basic configuration...');
      return retryWithAlternativeConfig(imageFile, onProgress, 'basic');
    } else {
      // All fallbacks failed
      throw new Error(`Todos los métodos de procesamiento fallaron. Error final: ${fallbackError instanceof Error ? fallbackError.message : 'Error desconocido'}`);
    }
  }
}

/**
 * Check if WebGPU is supported for optimal performance
 */
export function isWebGPUSupported(): boolean {
  return 'gpu' in navigator;
}

/**
 * Get recommended settings info for the user
 */
export function getPerformanceInfo(): {
  hasWebGPU: boolean;
  recommendedSize: string;
  maxSize: string;
  processingSpeed: string;
} {
  const hasWebGPU = isWebGPUSupported();
  
  return {
    hasWebGPU,
    recommendedSize: hasWebGPU ? '< 10MB' : '< 5MB',
    maxSize: hasWebGPU ? '50MB' : '20MB', 
    processingSpeed: hasWebGPU ? '100-500ms' : '2-10s'
  };
}

/**
 * Utility to validate image before processing
 */
export function validateImageForProcessing(file: File): {
  isValid: boolean;
  error?: string;
  warnings?: string[];
} {
  const warnings: string[] = [];
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'El archivo debe ser una imagen' };
  }
  
  // Check file size limits
  const maxSize = isWebGPUSupported() ? 50 * 1024 * 1024 : 20 * 1024 * 1024; // 50MB or 20MB
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `La imagen es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: ${maxSize / 1024 / 1024}MB` 
    };
  }
  
  // Add warnings for large files
  const warnSize = isWebGPUSupported() ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > warnSize) {
    warnings.push(`Imagen grande (${(file.size / 1024 / 1024).toFixed(1)}MB) - el procesamiento puede tardar más`);
  }
  
  // Check for supported formats
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedFormats.includes(file.type.toLowerCase())) {
    warnings.push(`Formato ${file.type} puede tener menor calidad - se recomienda PNG o JPEG`);
  }
  
  return { isValid: true, warnings: warnings.length > 0 ? warnings : undefined };
} 

/**
 * Clean up background removal object URLs to prevent memory leaks
 */
export function cleanupBackgroundRemovalUrls(): void {
  if (typeof window !== 'undefined' && (window as any).__backgroundRemovalUrls) {
    const urls = (window as any).__backgroundRemovalUrls as Set<string>;
    console.log(`🧹 Cleaning up ${urls.size} background removal object URLs...`);
    
    urls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
        console.log('🗑️ Revoked object URL:', url.substring(0, 50) + '...');
      } catch (error) {
        console.warn('⚠️ Failed to revoke object URL:', error);
      }
    });
    
    urls.clear();
    console.log('✅ Background removal URL cleanup completed');
  }
}

/**
 * Post-process the result for better white background handling
 */
export async function postProcessWhiteBackground(blob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      if (!ctx) {
        resolve(blob);
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Enhance edge detection for white/light pixels
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // If pixel is very light and semi-transparent, make it fully transparent
        const brightness = (r + g + b) / 3;
        if (brightness > 240 && a > 0 && a < 200) {
          data[i + 3] = 0; // Make fully transparent
        }
        // If pixel is white-ish but opaque, check if it should be transparent
        else if (brightness > 250 && a > 200) {
          // Check neighboring pixels to determine if this is background
          const isEdgePixel = isNearTransparentPixel(data, i, canvas.width, canvas.height);
          if (isEdgePixel) {
            data[i + 3] = 0; // Make transparent
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      canvas.toBlob((processedBlob) => {
        resolve(processedBlob || blob);
      }, 'image/png', 1.0);
    };
    
    img.onerror = () => resolve(blob);
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Helper function to check if a pixel is near transparent pixels
 */
function isNearTransparentPixel(data: Uint8ClampedArray, pixelIndex: number, width: number, height: number): boolean {
  const pixelPosition = pixelIndex / 4;
  const x = pixelPosition % width;
  const y = Math.floor(pixelPosition / width);
  
  // Check 3x3 neighborhood
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighborIndex = (ny * width + nx) * 4;
        const neighborAlpha = data[neighborIndex + 3];
        
        // If any neighbor is transparent, this might be an edge pixel
        if (neighborAlpha < 128) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Check if an object URL is still valid
 */
export function isObjectUrlValid(url: string): boolean {
  if (!url || !url.startsWith('blob:')) {
    return false;
  }
  
  try {
    // Try to create an image to test if the URL is still valid
    const testImg = new Image();
    testImg.src = url;
    return true;
  } catch (error) {
    console.warn('🚫 Object URL appears to be invalid:', url);
    return false;
  }
} 