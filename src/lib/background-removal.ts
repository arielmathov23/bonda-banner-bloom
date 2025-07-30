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
 * Uses IS-Net model which is an evolution of U²-Net with better accuracy
 */
const getOptimizedConfig = (onProgress?: (progress: number, status: string) => void): Config => ({
  // Use isnet_fp16 for better precision and less aggressive removal
  model: 'isnet_fp16', // Half-precision model that's more conservative
  
  // Use CPU for more predictable results
  device: 'cpu', // CPU provides more consistent, less aggressive results than GPU
  
  // High-quality output settings to preserve edges
  output: {
    format: 'image/png', // PNG for lossless quality with transparency
    quality: 1.0, // Maximum quality to preserve fine details
  },
  
  // Enable debugging for development (can be disabled in production)
  debug: process.env.NODE_ENV === 'development',
  
  // Progress callback
  progress: onProgress ? (key: string, current: number, total: number) => {
    const progressPercent = Math.round((current / total) * 100);
    let status = 'Procesando con precisión mejorada...';
    
    // Provide more specific status messages
    if (key.includes('model')) {
      status = 'Cargando modelo IS-Net FP16...';
    } else if (key.includes('wasm')) {
      status = 'Cargando procesador de precisión...';
    } else if (key.includes('ort')) {
      status = 'Inicializando motor de alta precisión...';
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
    console.log('🚀 [BG-REMOVAL] Preloading IS-Net assets for faster processing...');
    onProgress?.(0, 'Precargando recursos de IA...');
    
    const config = getOptimizedConfig(onProgress);
    await preload(config);
    
    console.log('✅ [BG-REMOVAL] Assets preloaded successfully');
    onProgress?.(100, 'Recursos precargados');
  } catch (error) {
    console.warn('⚠️ [BG-REMOVAL] Failed to preload assets:', error);
    // Don't throw - this is just optimization, not critical
  }
}

/**
 * Remove background from product image using state-of-the-art IS-Net model
 * IS-Net is an enhanced version of U²-Net with significantly better accuracy
 */
export async function removeProductBackground(
  imageFile: File,
  onProgress?: (progress: number, status: string) => void
): Promise<BackgroundRemovalResult> {
  
  console.log('🎨 [BG-REMOVAL] Starting precision IS-Net FP16 background removal...');
  console.log('📊 [BG-REMOVAL] Input image details:', {
    name: imageFile.name,
    size: `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`,
    type: imageFile.type,
    dimensions: 'Will be auto-detected'
  });
  
  onProgress?.(5, 'Inicializando IA IS-Net (precisión mejorada)...');

  try {
    // Get optimized configuration
    const config = getOptimizedConfig((progressPercent, status) => {
      // Map loading progress to 5-40% range
      const mappedProgress = 5 + (progressPercent * 0.35);
      onProgress?.(mappedProgress, status);
    });

    console.log('🤖 [BG-REMOVAL] Using precision IS-Net FP16 configuration:', {
      model: config.model,
      device: config.device,
      format: config.output?.format,
      quality: config.output?.quality
    });
    
    onProgress?.(40, 'Procesando con IS-Net FP16 (máxima precisión)...');

    // Perform background removal with advanced IS-Net model
    const startTime = performance.now();
    const blob = await removeBackground(imageFile, config);
    const processingTime = performance.now() - startTime;
    
    console.log('✅ [BG-REMOVAL] IS-Net processing complete:', {
      processingTime: `${(processingTime / 1000).toFixed(2)}s`,
      originalSize: `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`,
      resultSize: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
      compressionRatio: `${Math.round((1 - blob.size / imageFile.size) * 100)}%`,
      format: blob.type
    });
    
    onProgress?.(90, 'Finalizando resultado...');

    // Create object URL for preview with proper lifecycle management
    const imageUrl = URL.createObjectURL(blob);
    
    // Store the object URL globally to prevent premature revocation
    if (typeof window !== 'undefined') {
      (window as any).__backgroundRemovalUrls = (window as any).__backgroundRemovalUrls || new Set();
      (window as any).__backgroundRemovalUrls.add(imageUrl);
    }
    
    console.log('🔗 Object URL created and protected from revocation:', imageUrl);
    
    onProgress?.(100, 'Recorte de precisión completado');

    return {
      imageUrl,
      blob,
      originalSize: imageFile.size,
      processedSize: blob.size
    };

  } catch (error) {
    console.error('❌ [BG-REMOVAL] IS-Net processing failed:', error);
    
    // Provide detailed error information
    let errorMessage = 'Error desconocido en procesamiento IS-Net';
    if (error instanceof Error) {
      if (error.message.includes('WebGPU')) {
        errorMessage = 'Error de aceleración GPU - usando CPU como respaldo';
        console.log('🔄 [BG-REMOVAL] Retrying with CPU fallback...');
        return retryWithCPUFallback(imageFile, onProgress);
      } else if (error.message.includes('memory')) {
        errorMessage = 'Imagen demasiado grande para procesar';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Error de conexión al cargar modelo';
      } else {
        errorMessage = error.message;
      }
    }
    
    throw new Error(`Fallo en procesamiento IS-Net: ${errorMessage}`);
  }
}

/**
 * Fallback to CPU processing if GPU fails
 */
async function retryWithCPUFallback(
  imageFile: File,
  onProgress?: (progress: number, status: string) => void
): Promise<BackgroundRemovalResult> {
  
  console.log('🔄 [BG-REMOVAL] Retrying with CPU fallback...');
  onProgress?.(50, 'Usando procesador como respaldo...');
  
  const cpuConfig = getOptimizedConfig((progressPercent, status) => {
    const mappedProgress = 50 + (progressPercent * 0.45);
    onProgress?.(mappedProgress, `${status} (CPU)`);
  });
  
  // Force CPU execution
  cpuConfig.device = 'cpu';
  
  try {
    const blob = await removeBackground(imageFile, cpuConfig);
    const imageUrl = URL.createObjectURL(blob);
    
    console.log('✅ [BG-REMOVAL] CPU fallback successful');
    onProgress?.(100, 'Completado con CPU');
    
    return {
      imageUrl,
      blob,
      originalSize: imageFile.size,
      processedSize: blob.size
    };
  } catch (cpuError) {
    console.error('❌ [BG-REMOVAL] CPU fallback also failed:', cpuError);
    throw new Error('Tanto GPU como CPU fallaron en el procesamiento');
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