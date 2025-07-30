import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, ZoomOut, Save, Type, Image, Trash2, Copy, Move, 
  MousePointer2, Bold, Italic, Underline, AlignLeft, AlignCenter, 
  AlignRight, Minus, Plus, Layers, Eye, EyeOff, Edit2, RotateCw, Lock, X, Upload
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { getBannerForEditor } from '@/lib/enhanced-banner-service';
import { usePartners } from '@/hooks/usePartners';
import { cleanupBackgroundRemovalUrls, isObjectUrlValid } from '@/lib/background-removal';
import { supabase } from '@/integrations/supabase/client';
import type { BannerComposition, BannerAsset, EditorState, ExportOptions } from '@/types/banner-editor';

// Alignment guide interface
interface AlignmentGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
}

interface BannerEditorProps {
  backgroundImageUrl: string;
  partnerId: string;
  partnerName: string;
  partnerLogoUrl?: string;
  bannerText: string;
  descriptionText?: string;
  ctaText: string;
  bannerId: string;
  onSave?: (composition: BannerComposition) => void;
  onExit?: () => void;
}

// Partner brand guidelines interface
interface BrandGuidelines {
  mainColor: string;
  secondaryColor: string;
  fontPrimary: string;
  fontSecondary: string;
}

// Dynamic layout configuration based on mirror state  
const getLayout = (isMirrored: boolean) => {
  if (isMirrored) {
    // Mirrored layout: logo left (closer to center), text elements right-aligned (closer to center)
    return {
      logo: { x: 200, y: 90 }, // Logo closer to center from left
      product: { x: 595, y: 51, width: 250, height: 250 }, // Product stays centered
      mainText: { x: 840, y: 90, width: 400, height: 50 }, // Title closer to center, right-aligned
      descriptionText: { x: 760, y: 140, width: 480, height: 40 }, // Description closer to center, right-aligned  
      ctaButton: { x: 1080, y: 230, width: 160, height: 45 }, // CTA button closer to center, right-aligned
    };
  } else {
    // Normal layout: logo right (closer to center), text elements left-aligned (closer to center)
    return {
      logo: { x: 950, y: 90 }, // Logo closer to center from right
      product: { x: 595, y: 51, width: 250, height: 250 }, // Product perfectly centered: (1440-250)/2, (352-250)/2
      mainText: { x: 200, y: 90, width: 400, height: 50 }, // Title closer to center horizontally
      descriptionText: { x: 200, y: 140, width: 480, height: 40 }, // Description closer to center
      ctaButton: { x: 200, y: 230, width: 160, height: 45 }, // CTA button closer to center
    };
  }
};

const BannerEditor: React.FC<BannerEditorProps> = ({
  backgroundImageUrl,
  partnerId,
  partnerName,
  partnerLogoUrl,
  bannerText,
  descriptionText,
  ctaText,
  bannerId,
  onSave,
  onExit
}) => {
  const { partners } = usePartners();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [productImage, setProductImage] = useState<HTMLImageElement | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [miniToolbarPosition, setMiniToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [textEditValue, setTextEditValue] = useState('');
  const [lastClickTime, setLastClickTime] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [initialResizeData, setInitialResizeData] = useState<any>(null);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragReady, setIsDragReady] = useState(false);
  
  // Loading state for banner data
  const [isLoadingBanner, setIsLoadingBanner] = useState(false);
  const [bannerData, setBannerData] = useState<any>(null);
  const [actualBackgroundImageUrl, setActualBackgroundImageUrl] = useState(backgroundImageUrl);
  const [actualProductImageUrl, setActualProductImageUrl] = useState<string | null>(null);
  const [actualPartnerLogoUrl, setActualPartnerLogoUrl] = useState(partnerLogoUrl);
  const [actualBannerText, setActualBannerText] = useState(bannerText);
  const [actualDescriptionText, setActualDescriptionText] = useState(descriptionText || '');
  const [actualCtaText, setActualCtaText] = useState(ctaText);
  
  // Brand guidelines state
  const [brandGuidelines, setBrandGuidelines] = useState<BrandGuidelines>({
    mainColor: '#8A47F5',
    secondaryColor: '#E9DEFF',
    fontPrimary: 'DM Sans',
    fontSecondary: 'Arial',
  });
  const [isLoadingGuidelines, setIsLoadingGuidelines] = useState(false);
  
  // Logo upload state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // Alignment guides state
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);
  
  // Window focus state to handle image reloading
  const [windowFocused, setWindowFocused] = useState(true);
  
  // Layout mirror state - false = normal, true = mirrored
  const [isMirroredLayout, setIsMirroredLayout] = useState(false);
  
  // Enhanced function to detect background brightness and return appropriate text color
  const getAdaptiveTextColor = useCallback(() => {
    if (!backgroundImage) return '#0C0908'; // Default dark text
    
    // Create a temporary canvas to analyze background brightness
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return '#0C0908';
    
    // Use higher resolution for better analysis
    tempCanvas.width = 200;
    tempCanvas.height = 200;
    
    try {
      // Draw the background image to analyze
      tempCtx.drawImage(backgroundImage, 0, 0, 200, 200);
      
      // Define strategic sampling areas where text typically appears
      const textAreas = [
        { x: 40, y: 40, width: 80, height: 20 },   // Top-left text area
        { x: 40, y: 70, width: 96, height: 16 },   // Description area
        { x: 40, y: 120, width: 32, height: 18 },  // CTA area
        { x: 120, y: 40, width: 60, height: 15 },  // Right side (mirrored)
        { x: 60, y: 100, width: 80, height: 40 }   // Central area
      ];
      
      let totalWeightedBrightness = 0;
      let totalWeight = 0;
      
      // Analyze each text area with different weights
      textAreas.forEach((area, index) => {
        const imageData = tempCtx.getImageData(area.x, area.y, area.width, area.height);
        const data = imageData.data;
        
        let areaBrightness = 0;
        let pixelCount = 0;
        
        // Calculate luminance using improved formula
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // Skip transparent pixels
          if (a < 128) continue;
          
          // Use sRGB luminance formula for better accuracy
          const luminance = 0.2126 * Math.pow(r/255, 2.2) + 
                           0.7152 * Math.pow(g/255, 2.2) + 
                           0.0722 * Math.pow(b/255, 2.2);
          
          areaBrightness += luminance * 255;
          pixelCount++;
        }
        
        if (pixelCount > 0) {
          const avgAreaBrightness = areaBrightness / pixelCount;
          
          // Weight main text areas more heavily
          const weight = index < 3 ? 2.0 : 1.0;
          
          totalWeightedBrightness += avgAreaBrightness * weight;
          totalWeight += weight;
        }
      });
      
      if (totalWeight === 0) {
        return '#0C0908'; // Default to dark if no valid pixels
      }
      
      const averageBrightness = totalWeightedBrightness / totalWeight;
      
      // Use more sophisticated thresholds for better contrast decisions
      if (averageBrightness > 140) {
        return '#0C0908'; // Dark text on light background
      } else if (averageBrightness < 100) {
        return '#FAFAFA'; // Light text on dark background  
      } else {
        // For medium brightness, check contrast ratio and lean toward dark text
        return averageBrightness > 120 ? '#0C0908' : '#FAFAFA';
      }
      
    } catch (error) {
      console.warn('Could not analyze background brightness:', error);
      return '#0C0908'; // Default to dark text
    }
  }, [backgroundImage]);

  // Helper function for logo sizing: ONLY constrain height, calculate width proportionally
  const calculateLogoSize = (naturalWidth: number, naturalHeight: number) => {
    // Validate input dimensions
    if (naturalWidth <= 0 || naturalHeight <= 0) {
      console.warn('Invalid logo dimensions:', naturalWidth, 'x', naturalHeight);
      return { width: 100, height: 100 }; // fallback square
    }
    
    // FIXED HEIGHT - never change this, only scale width proportionally
    const targetHeight = 75; // Fixed height for all logos
    
    // Calculate original aspect ratio (width/height)
    const originalAspectRatio = naturalWidth / naturalHeight;
    
    // ALWAYS use target height, calculate width proportionally
    const logoHeight = targetHeight;
    const logoWidth = targetHeight * originalAspectRatio; // height * aspect ratio = proportional width
    
    console.log(`✅ Logo proportional sizing: ${naturalWidth}x${naturalHeight} (ratio: ${originalAspectRatio.toFixed(3)}) → ${Math.round(logoWidth)}x${Math.round(logoHeight)}`);
    return { width: logoWidth, height: logoHeight };
  };

  // Helper function to automatically break text after 14 characters for better readability
  const autoBreakText = (text: string, maxCharsPerLine: number = 14): string[] => {
    if (!text) return [];
    
    // First, respect existing line breaks
    const manualLines = text.split('\n');
    const resultLines: string[] = [];
    
    manualLines.forEach(line => {
      if (line.length <= maxCharsPerLine) {
        // Line is short enough, keep as is
        resultLines.push(line);
      } else {
        // Line is too long, break it intelligently
        const words = line.split(' ');
        let currentLine = '';
        
        words.forEach(word => {
          // Check if adding this word would exceed the limit
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          
          if (testLine.length <= maxCharsPerLine) {
            currentLine = testLine;
          } else {
            // Adding this word exceeds limit
            if (currentLine) {
              // Save current line and start new one with this word
              resultLines.push(currentLine);
              currentLine = word;
            } else {
              // Even single word is too long, break it forcefully
              if (word.length > maxCharsPerLine) {
                for (let i = 0; i < word.length; i += maxCharsPerLine) {
                  resultLines.push(word.slice(i, i + maxCharsPerLine));
                }
                currentLine = '';
              } else {
                currentLine = word;
              }
            }
          }
        });
        
        // Don't forget the last line
        if (currentLine) {
          resultLines.push(currentLine);
        }
      }
    });
    
    return resultLines;
  };

  // Calculate alignment guides during drag
  const calculateAlignmentGuides = (draggedAsset: BannerAsset, newX: number, newY: number): { guides: AlignmentGuide[], snappedX: number, snappedY: number } => {
    const guides: AlignmentGuide[] = [];
    const snapTolerance = 8; // pixels
    let snappedX = newX;
    let snappedY = newY;

    // Get bounds of dragged asset at new position
    const draggedBounds = {
      left: newX,
      right: newX + draggedAsset.size.width,
      centerX: newX + draggedAsset.size.width / 2,
      top: newY,
      bottom: newY + draggedAsset.size.height,
      centerY: newY + draggedAsset.size.height / 2
    };

    // Check alignment with other assets
    const otherAssets = composition.assets?.filter(asset => asset.id !== draggedAsset.id) ?? [];
    
    for (const asset of otherAssets) {
      const assetBounds = {
        left: asset.position.x,
        right: asset.position.x + asset.size.width,
        centerX: asset.position.x + asset.size.width / 2,
        top: asset.position.y,
        bottom: asset.position.y + asset.size.height,
        centerY: asset.position.y + asset.size.height / 2
      };

      // Vertical alignment checks
      const verticalAlignments = [
        { position: assetBounds.left, type: 'left' as const, dragPos: draggedBounds.left },
        { position: assetBounds.centerX, type: 'center' as const, dragPos: draggedBounds.centerX },
        { position: assetBounds.right, type: 'right' as const, dragPos: draggedBounds.right }
      ];

      for (const alignment of verticalAlignments) {
        const distance = Math.abs(alignment.dragPos - alignment.position);
        if (distance < snapTolerance) {
          // Snap to this alignment
          const offsetX = alignment.position - alignment.dragPos;
          snappedX = newX + offsetX;
          
          // Add guide line
          guides.push({
            type: 'vertical',
            position: alignment.position,
            start: Math.min(assetBounds.top, newY),
            end: Math.max(assetBounds.bottom, newY + draggedAsset.size.height)
          });
        }
      }

      // Horizontal alignment checks
      const horizontalAlignments = [
        { position: assetBounds.top, type: 'top' as const, dragPos: draggedBounds.top },
        { position: assetBounds.centerY, type: 'center' as const, dragPos: draggedBounds.centerY },
        { position: assetBounds.bottom, type: 'bottom' as const, dragPos: draggedBounds.bottom }
      ];

      for (const alignment of horizontalAlignments) {
        const distance = Math.abs(alignment.dragPos - alignment.position);
        if (distance < snapTolerance) {
          // Snap to this alignment
          const offsetY = alignment.position - alignment.dragPos;
          snappedY = newY + offsetY;
          
          // Add guide line
          guides.push({
            type: 'horizontal',
            position: alignment.position,
            start: Math.min(assetBounds.left, newX),
            end: Math.max(assetBounds.right, newX + draggedAsset.size.width)
          });
        }
      }
    }

    return { guides, snappedX, snappedY };
  };
  
  // Font options including partner fonts
  const fontOptions = [
    'DM Sans',
    'Roboto',
    'Cerebi Sans',
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Verdana',
    'Tahoma',
    'Trebuchet MS',
    'Impact',
    'Comic Sans MS',
    'Courier New',
    'Lucida Console',
    'Palatino',
    'Garamond',
    'Bookman',
    'Arial Black',
    'Century Gothic',
    'Franklin Gothic Medium'
  ];
  
  // Editor state
  const [editorState, setEditorState] = useState<EditorState>({
    selectedAssetId: null,
    isDragging: false,
    isResizing: false,
    dragOffset: { x: 0, y: 0 },
    zoom: 1,
    canvasPosition: { x: 0, y: 0 }
  });

  // Composition state
  const [composition, setComposition] = useState<BannerComposition>({
    id: `composition_${bannerId}`,
    bannerId,
    backgroundImageUrl: actualBackgroundImageUrl,
    assets: [],
    canvasSize: { width: 1440, height: 352 }, // Standard banner dimensions
    zoom: 1,
    lastModified: new Date()
  });

  // Track whether we've attempted to load saved composition
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Load partner brand guidelines
  const loadPartnerBrandGuidelines = useCallback(async () => {
    try {
      const partner = partners.find(p => p.id === partnerId);
      if (!partner || !partner.brand_manual_url) {
        console.log('No brand manual URL found for partner:', partnerId);
        return;
      }

      setIsLoadingGuidelines(true);
      console.log('Loading brand guidelines from:', partner.brand_manual_url);
      
      const response = await fetch(partner.brand_manual_url);
      const csvText = await response.text();
      
      // Parse CSV
      const lines = csvText.split('\n');
      const brandData: Record<string, string> = {};
      
      lines.forEach(line => {
        if (line.trim() && !line.startsWith('Field,')) {
          const [field, value] = line.split(',');
          if (field && value) {
            brandData[field.trim()] = value.trim();
          }
        }
      });
      
      // Update brand guidelines state with parsed data
      const updatedGuidelines = {
        mainColor: brandData['Main Color'] || '#8A47F5',
        secondaryColor: brandData['Secondary Color'] || '#E9DEFF',
        fontPrimary: brandData['Font Primary'] || 'DM Sans',
        fontSecondary: brandData['Font Secondary'] || 'Arial',
      };
      
      console.log('Loaded brand guidelines:', updatedGuidelines);
      setBrandGuidelines(updatedGuidelines);
      
    } catch (error) {
      console.error('Error loading brand guidelines:', error);
      // Keep default values if loading fails
    } finally {
      setIsLoadingGuidelines(false);
    }
  }, [partnerId, partners]);

  // Logo upload handler
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona un archivo de imagen",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploadingLogo(true);
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      
      // Load image to get natural dimensions
      const img = document.createElement('img');
      img.onload = () => {
        console.log(`Logo loaded: ${img.naturalWidth}x${img.naturalHeight}`);
        
        // Scale logo to max height 150px, maintain aspect ratio
        const { width: logoWidth, height: logoHeight } = calculateLogoSize(img.naturalWidth, img.naturalHeight);
        
        // Update or create logo asset with proper dimensions
      const logoAsset = composition.assets?.find(asset => asset.type === 'logo');
      if (logoAsset) {
          // Update existing logo with new image and dimensions
          updateComposition(prev => ({
            ...prev,
            assets: prev.assets.map(asset => 
              asset.id === logoAsset.id
                ? {
                    ...asset,
                    imageUrl: objectUrl,
                    size: { width: logoWidth, height: logoHeight }
                  }
                : asset
            ),
            lastModified: new Date()
          }));
          console.log(`Logo updated: ${logoWidth}x${logoHeight}`);
      } else {
          // Create new logo asset with proper dimensions
        const newLogoAsset: BannerAsset = {
          id: `logo_${Date.now()}`,
          type: 'logo',
          position: { x: getLayout(isMirroredLayout).logo.x, y: getLayout(isMirroredLayout).logo.y },
            size: { width: logoWidth, height: logoHeight },
          rotation: 0,
          imageUrl: objectUrl
        };
        
        updateComposition(prev => ({
          ...prev,
          assets: [...prev.assets, newLogoAsset],
          lastModified: new Date()
        }));
          console.log(`Logo created: ${logoWidth}x${logoHeight}`);
      }
      };
      img.src = objectUrl;
      
      toast({
        title: "Logo actualizado",
        description: "El logo se ha actualizado correctamente",
      });
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error al cargar logo",
        description: "No se pudo cargar el logo",
        variant: "destructive"
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Load banner data if backgroundImageUrl is empty (indicating we need to fetch from database)
  useEffect(() => {
    const loadBannerData = async () => {
      if (!backgroundImageUrl && bannerId) {
        setIsLoadingBanner(true);
        try {
          const banner = await getBannerForEditor(bannerId);
          setBannerData(banner);
          setActualBackgroundImageUrl(banner.background_image_url || banner.image_url);
          setActualProductImageUrl(banner.product_image_url);
          setActualPartnerLogoUrl(banner.partners?.logo_url);
          setActualBannerText(banner.main_text || '');
          setActualDescriptionText(banner.description_text || '');
          setActualCtaText(banner.cta_text || '');
          
          console.log('Banner data loaded (3-layer):', {
            bannerId: banner.id,
            hasBackground: !!banner.background_image_url,
            hasProduct: !!banner.product_image_url,
            backgroundUrl: banner.background_image_url,
            productUrl: banner.product_image_url,
            legacy: !!banner.image_url
          });
          
          // Debug the product image URL specifically
          if (banner.product_image_url) {
            console.log('✅ Product image URL found:', banner.product_image_url);
          } else {
            console.log('❌ No product image URL in banner data');
            console.log('Full banner data:', banner);
          }
        } catch (error) {
          console.error('Failed to load banner data:', error);
          toast({
            title: "Error al cargar banner",
            description: "No se pudo cargar la información del banner",
            variant: "destructive"
          });
        } finally {
          setIsLoadingBanner(false);
        }
      }
    };

    loadBannerData();
  }, [bannerId, backgroundImageUrl]);

  // Load partner brand guidelines when partners or partnerId changes
  useEffect(() => {
    if (partners.length > 0 && partnerId) {
      loadPartnerBrandGuidelines();
    }
  }, [partners, partnerId, loadPartnerBrandGuidelines]);

  // Handle window focus/blur events to manage image lifecycle
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔍 Window gained focus - checking image integrity...');
      setWindowFocused(true);
      
      // Check if images are still valid and reload if necessary
      setTimeout(() => {
        if (backgroundImage && backgroundImage.src && backgroundImage.complete === false) {
          console.log('🔄 Background image needs reloading after focus...');
          // Trigger background image reload by updating the URL state
          setActualBackgroundImageUrl(prev => prev ? prev + '?reload=' + Date.now() : prev);
        }
        
        if (productImage && productImage.src && productImage.complete === false) {
          console.log('🔄 Product image needs reloading after focus...');
          // Trigger product image reload
          setActualProductImageUrl(prev => prev ? prev + '?reload=' + Date.now() : prev);
        }
      }, 100);
    };

    const handleBlur = () => {
      console.log('👁️ Window lost focus - images may be cleaned up by browser...');
      setWindowFocused(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    // Also listen for visibility change (more reliable than focus/blur)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      } else {
        handleBlur();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

         return () => {
       window.removeEventListener('focus', handleFocus);
       window.removeEventListener('blur', handleBlur);
       document.removeEventListener('visibilitychange', handleVisibilityChange);
     };
   }, [backgroundImage, productImage]);

   // Cleanup object URLs when component unmounts
   useEffect(() => {
     return () => {
       console.log('🧹 BannerEditor unmounting - cleaning up object URLs...');
       cleanupBackgroundRemovalUrls();
     };
   }, []);

  // Initialize assets with fixed positioning and brand colors (only if no saved composition)
  useEffect(() => {
    // Only initialize if we've attempted to load and there are no assets yet
    if (!hasAttemptedLoad || !brandGuidelines || (composition.assets?.length ?? 0) > 0) return;
    
    // If we have a bannerId but banner data isn't loaded yet, wait for it
    if (bannerId && isLoadingBanner) {
      console.log('🕒 Banner data still loading, waiting before creating assets...');
      return;
    }
    
    console.log('🎨 Creating initial composition with default layout');
    const initialAssets: BannerAsset[] = [];
    
    // Add logo with fixed position - use 4:3 aspect ratio by default instead of 1:1
    if (actualPartnerLogoUrl) {
      initialAssets.push({
        id: `logo_${Date.now()}`,
        type: 'logo',
        position: { x: getLayout(isMirroredLayout).logo.x, y: getLayout(isMirroredLayout).logo.y },
        size: { width: 100, height: 75 }, // Use 4:3 aspect ratio, smaller size
        rotation: 0,
        imageUrl: actualPartnerLogoUrl
      });
    }

    // Add product image asset if available
    if (actualProductImageUrl) {
      console.log('🖼️ Adding product image asset:', actualProductImageUrl);
      initialAssets.push({
        id: `product_${Date.now()}`,
        type: 'product',
        position: { x: getLayout(isMirroredLayout).product.x, y: getLayout(isMirroredLayout).product.y },
        size: { width: getLayout(isMirroredLayout).product.width, height: getLayout(isMirroredLayout).product.height },
        rotation: 0,
        imageUrl: actualProductImageUrl
      });
    }
    
    // Add main text with fixed position and Cerebi Sans in black
    if (actualBannerText) {
      initialAssets.push({
        id: `text_${Date.now()}`,
        type: 'text',
        position: { x: getLayout(isMirroredLayout).mainText.x, y: getLayout(isMirroredLayout).mainText.y },
        size: { width: getLayout(isMirroredLayout).mainText.width, height: getLayout(isMirroredLayout).mainText.height },
        rotation: 0,
        text: actualBannerText,
        fontSize: 42, // Larger title font
        fontFamily: 'Cerebi Sans',
        color: getAdaptiveTextColor(),
        fontWeight: 'bold',
        textAlign: isMirroredLayout ? 'right' : 'left'
      });
    }

    // Add description text with fixed position and Cerebi Sans in black
    if (actualDescriptionText) {
      initialAssets.push({
        id: `description_${Date.now()}`,
        type: 'text',
        position: { x: getLayout(isMirroredLayout).descriptionText.x, y: getLayout(isMirroredLayout).descriptionText.y },
        size: { width: getLayout(isMirroredLayout).descriptionText.width, height: getLayout(isMirroredLayout).descriptionText.height },
        rotation: 0,
        text: actualDescriptionText,
        fontSize: 36, // Smaller than title, good proportion
        fontFamily: 'Cerebi Sans',
        color: getAdaptiveTextColor(),
        fontWeight: 'normal',
        textAlign: isMirroredLayout ? 'right' : 'left'
      });
    }

    // Add CTA button with fixed position and styling
    if (actualCtaText) {
      initialAssets.push({
        id: `cta_${Date.now()}`,
        type: 'cta',
        position: { x: getLayout(isMirroredLayout).ctaButton.x, y: getLayout(isMirroredLayout).ctaButton.y },
        size: { width: getLayout(isMirroredLayout).ctaButton.width, height: getLayout(isMirroredLayout).ctaButton.height },
        rotation: 0,
        text: actualCtaText,
        fontSize: 20, // Appropriate size for CTA button
        fontFamily: 'Roboto', // Use Roboto for CTA buttons
        color: brandGuidelines.mainColor,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: brandGuidelines.secondaryColor,
        borderRadius: 24 // Higher border radius for more rounded appearance
      });
    }

    // Set initial composition with generated assets
    console.log('🎯 Setting initial composition with assets:', initialAssets.map(asset => ({
      id: asset.id,
      type: asset.type,
      position: asset.position,
      size: asset.size,
      imageUrl: asset.imageUrl ? 'YES' : 'NO'
    })));
    
    setComposition(prev => ({
      ...prev,
      assets: initialAssets,
      lastModified: new Date()
    }));
  }, [hasAttemptedLoad, bannerId, isLoadingBanner, actualPartnerLogoUrl, actualProductImageUrl, actualBannerText, actualDescriptionText, actualCtaText, brandGuidelines, composition.assets?.length]);

  // Helper function to check if saved composition exists
  const checkForSavedComposition = useCallback(async (): Promise<boolean> => {
    try {
      // Check database first
      const { data: banner, error } = await supabase
        .from('banners')
        .select('composition_data')
        .eq('id', bannerId)
        .single();

      if (!error && banner?.composition_data) {
        return true;
      }

      // Check localStorage
      const key = `banner_composition_${bannerId}`;
      const saved = localStorage.getItem(key);
      return !!saved;
    } catch (error) {
      return false;
    }
  }, [bannerId]);

  // Load composition from database first, then fallback to localStorage
  const loadComposition = useCallback(async (): Promise<boolean> => {
    // Try to load from database first, then fallback to localStorage
    try {
      console.log('📥 Loading composition from database...');
      const { data: banner, error } = await supabase
        .from('banners')
        .select('composition_data')
        .eq('id', bannerId)
        .single();

      if (error) {
        console.warn('Database load failed, trying localStorage:', error);
      } else if (banner?.composition_data) {
        const savedComposition = banner.composition_data as any;
        
        console.log('📥 Raw composition data from database:', banner.composition_data);
        console.log('📊 Loaded composition details:', {
          assets: savedComposition.assets?.length || 0,
          assetDetails: savedComposition.assets?.map(asset => ({
            id: asset.id,
            type: asset.type,
            position: asset.position,
            size: asset.size,
            imageUrl: asset.imageUrl ? 'YES' : 'NO'
          })) || [],
          zoom: savedComposition.zoom,
          canvasSize: savedComposition.canvasSize
        });
        
        // Convert lastModified back to Date object
        if (savedComposition.lastModified) {
          savedComposition.lastModified = new Date(savedComposition.lastModified);
        }
        
        console.log('✅ Loaded composition from database');
        setComposition(savedComposition);
        setEditorState(prev => ({ ...prev, zoom: savedComposition.zoom || 1 }));
        
        // Force a re-render after composition is loaded
        setTimeout(() => {
          console.log('🎨 Triggering canvas re-render after composition load');
          renderCanvas();
        }, 100);
        
        return true;
      }
    } catch (dbError) {
      console.warn('Database composition load error:', dbError);
    }

    // Fallback to localStorage
    const key = `banner_composition_${bannerId}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        const savedComposition = JSON.parse(saved);
        console.log('📦 Loaded composition from localStorage');
        setComposition(savedComposition);
        setEditorState(prev => ({ ...prev, zoom: savedComposition.zoom || 1 }));
        return true;
      } catch (error) {
        console.error('Failed to load composition from localStorage:', error);
      }
    }
    
    return false; // No saved composition found
  }, [bannerId]);

  // Load saved composition from database/localStorage (separate effect to avoid ordering issues)
  useEffect(() => {
    // Always attempt to load composition first, regardless of brand guidelines
    // This ensures existing banners show their saved elements immediately
    if (brandGuidelines && !hasAttemptedLoad) {
      const loadSavedComposition = async () => {
        console.log('🔄 Checking for saved composition...');
        const hasLoadedComposition = await loadComposition();
        
        // Mark that we've attempted to load composition
        setHasAttemptedLoad(true);
        
        if (hasLoadedComposition) {
          console.log('✅ Loaded existing composition with saved assets');
        } else {
          console.log('📝 No saved composition found, will create default assets');
        }
      };
      
      loadSavedComposition();
    }
  }, [bannerId, brandGuidelines, loadComposition, hasAttemptedLoad]);

  // Update existing composition assets with brand colors ONLY if they have default colors
  useEffect(() => {
    if (hasAttemptedLoad && (composition.assets?.length ?? 0) > 0 && partnerId) {
      const isDefaultGuidelines = brandGuidelines.mainColor === '#8A47F5' && brandGuidelines.secondaryColor === '#E9DEFF';
      
      // Only update colors if brand guidelines are loaded and assets have default colors
      if (!isDefaultGuidelines) {
        console.log('🎨 Checking if assets need brand color updates:', brandGuidelines);
        
        const updatedAssets = composition.assets?.map(asset => {
          // Only update if asset has default purple colors (indicating it needs brand colors)
          if (asset.type === 'text' && (asset.color === '#000000' || asset.color === '#8A47F5')) {
            console.log(`Updating text asset ${asset.id} color from ${asset.color} to ${brandGuidelines.mainColor}`);
            return { ...asset, color: brandGuidelines.mainColor };
          } else if (asset.type === 'cta' && (
            asset.color === '#8A47F5' || asset.backgroundColor === '#E9DEFF' || 
            asset.color === '#000000' || !asset.backgroundColor
          )) {
            console.log(`Updating CTA asset ${asset.id} colors`);
            return { 
              ...asset, 
              color: brandGuidelines.mainColor,
              backgroundColor: brandGuidelines.secondaryColor
            };
          }
          return asset;
        }) ?? [];
        
        // Only update if there are actual changes
        const hasChanges = updatedAssets.some((asset, index) => {
          const originalAsset = composition.assets?.[index];
          return originalAsset && ((asset.color !== originalAsset.color) || 
                 (asset.backgroundColor !== originalAsset.backgroundColor));
        });
        
        if (hasChanges) {
          setComposition(prev => ({
            ...prev,
            assets: updatedAssets,
            lastModified: new Date()
          }));
          console.log('✅ Updated assets with default colors to use partner brand colors');
        } else {
          console.log('✅ No color updates needed - assets already have proper colors');
        }
      }
    }
  }, [brandGuidelines, partnerId, hasAttemptedLoad, composition.assets?.length]);



  // Save composition to both localStorage and database
  const saveComposition = useCallback(async () => {
    try {
      const compositionData = { ...composition, lastModified: new Date() };
      
      // Save to localStorage for quick recovery
      const key = `banner_composition_${bannerId}`;
      localStorage.setItem(key, JSON.stringify(compositionData));
      
      // Save to database for persistence
      console.log('💾 Saving composition to database...');
      console.log('📊 Composition data being saved:', {
        assets: compositionData.assets.length,
        assetDetails: compositionData.assets.map(asset => ({
          id: asset.id,
          type: asset.type,
          position: asset.position,
          size: asset.size,
          imageUrl: asset.imageUrl ? 'YES' : 'NO'
        })),
        zoom: compositionData.zoom,
        canvasSize: compositionData.canvasSize
      });
      
      // Prepare composition data for database (ensure JSON compatibility)
      const dbCompositionData = JSON.parse(JSON.stringify({
        ...compositionData,
        lastModified: compositionData.lastModified.toISOString()
      }));
      
      console.log('📦 DB composition data:', dbCompositionData);
      
      const { error } = await supabase
        .from('banners')
        .update({
          composition_data: dbCompositionData,
          // Also update text fields if they've changed
          main_text: actualBannerText,
          description_text: actualDescriptionText,
          cta_text: actualCtaText
        })
        .eq('id', bannerId);

      if (error) {
        console.error('Database save error:', error);
        toast({
          title: "Error al guardar",
          description: `Error de base de datos: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      // Verify the save by reading back the data
      console.log('🔍 Verifying save by reading back from database...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('banners')
        .select('composition_data')
        .eq('id', bannerId)
        .single();
        
      if (verifyError) {
        console.warn('⚠️ Could not verify save:', verifyError);
      } else {
        console.log('✅ Verified saved data:', verifyData?.composition_data);
      }
      
      setHasUnsavedChanges(false);
      
      toast({
        title: "✅ Banner guardado",
        description: "La composición se ha guardado correctamente en la base de datos",
      });

      // Call onSave callback if provided (but don't exit automatically)
      if (onSave) {
        onSave(compositionData);
      }
      
      console.log('✅ Composition saved successfully to database');
      
    } catch (error) {
      console.error('Save composition error:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la composición",
        variant: "destructive",
      });
    }
  }, [composition, bannerId, actualBannerText, actualDescriptionText, actualCtaText, onSave]);

  // Auto-save composition every 10 seconds when there are unsaved changes
  useEffect(() => {
    let autoSaveInterval: NodeJS.Timeout;
    
    if (hasUnsavedChanges && (composition.assets?.length ?? 0) > 0) {
      console.log('⏰ Starting auto-save timer...');
      autoSaveInterval = setInterval(async () => {
        if (hasUnsavedChanges) {
          console.log('💾 Auto-saving composition...');
          try {
            await saveComposition();
            console.log('✅ Auto-save successful');
          } catch (error) {
            console.warn('⚠️ Auto-save failed:', error);
          }
        }
      }, 10000); // Auto-save every 10 seconds
    }
    
    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [hasUnsavedChanges, composition.assets?.length, saveComposition]);

  const updateComposition = useCallback((updater: (prev: BannerComposition) => BannerComposition) => {
    setComposition(prev => {
      const updated = updater(prev);
      console.log('🔄 Composition updated:', {
        assetsCount: updated.assets.length,
        hasUnsavedChanges: true,
        productAsset: updated.assets.find(a => a.type === 'product') ? {
          position: updated.assets.find(a => a.type === 'product')?.position,
          size: updated.assets.find(a => a.type === 'product')?.size
        } : 'NOT_FOUND'
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  }, []);

  // Toggle mirror layout function
  const toggleMirrorLayout = useCallback(() => {
    const newMirrorState = !isMirroredLayout;
    setIsMirroredLayout(newMirrorState);
    
    // Update existing assets with new positions and alignments
    const newLayout = getLayout(newMirrorState);
    
    setComposition(prev => ({
      ...prev,
      assets: prev.assets.map(asset => {
        if (asset.type === 'logo') {
          return {
            ...asset,
            position: { x: newLayout.logo.x, y: newLayout.logo.y }
          };
        } else if (asset.type === 'text') {
          // Determine if this is main text or description based on fontSize
          const isMainText = asset.fontSize === 42;
          const layoutKey = isMainText ? 'mainText' : 'descriptionText';
          
          return {
            ...asset,
            position: { x: newLayout[layoutKey].x, y: newLayout[layoutKey].y },
            textAlign: newMirrorState ? 'right' : 'left'
          };
        } else if (asset.type === 'cta') {
          return {
            ...asset,
            position: { x: newLayout.ctaButton.x, y: newLayout.ctaButton.y }
          };
        }
        return asset;
      }),
      lastModified: new Date()
    }));
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
  }, [isMirroredLayout]);

  // Handle exit with automatic save
  const handleExit = useCallback(async () => {
    if (hasUnsavedChanges) {
      console.log('💾 Auto-saving composition before exit...');
      try {
        await saveComposition();
        console.log('✅ Composition saved successfully before exit');
        if (onExit) onExit();
      } catch (error) {
        console.error('❌ Failed to save before exit:', error);
        // Still allow exit even if save fails, but warn user
        toast({
          title: "Advertencia",
          description: "No se pudieron guardar todos los cambios. ¿Continuar saliendo?",
          variant: "destructive",
        });
        if (onExit) onExit();
      }
    } else {
      if (onExit) onExit();
    }
  }, [hasUnsavedChanges, saveComposition, onExit]);

  // Text editing functions
  const startTextEditing = (assetId: string) => {
    const asset = composition.assets.find(a => a.id === assetId);
    if (asset && (asset.type === 'text' || asset.type === 'cta')) {
      setEditingText(assetId);
      setTextEditValue(asset.text || '');
      setTimeout(() => textInputRef.current?.focus(), 0);
    }
  };

  const finishTextEditing = () => {
    if (editingText) {
      updateAsset(editingText, { text: textEditValue });
      setEditingText(null);
      setTextEditValue('');
    }
  };

  // Helper function to draw elegant gradient backdrop effect for product images
  const drawProductBackdrop = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.max(width, height) * 1.2; // Larger radius for better fade
    
    ctx.save();
    
    // Create perfect gradient fade with extended radius for smooth edge transitions
    const gradientBackdrop = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    
    // Extended gradient with more color stops for ultra-smooth fade to edges
    gradientBackdrop.addColorStop(0, 'rgba(255, 255, 255, 0.25)');      // Soft center
    gradientBackdrop.addColorStop(0.08, 'rgba(255, 255, 255, 0.22)');   // Inner glow
    gradientBackdrop.addColorStop(0.18, 'rgba(255, 255, 255, 0.16)');   // Strong fade
    gradientBackdrop.addColorStop(0.32, 'rgba(255, 255, 255, 0.11)');   // Medium fade  
    gradientBackdrop.addColorStop(0.48, 'rgba(255, 255, 255, 0.07)');   // Gentle transition
    gradientBackdrop.addColorStop(0.65, 'rgba(255, 255, 255, 0.04)');   // Subtle fade
    gradientBackdrop.addColorStop(0.78, 'rgba(255, 255, 255, 0.02)');   // Almost gone
    gradientBackdrop.addColorStop(0.88, 'rgba(255, 255, 255, 0.01)');   // Nearly transparent
    gradientBackdrop.addColorStop(0.95, 'rgba(255, 255, 255, 0.005)');  // Super subtle
    gradientBackdrop.addColorStop(1, 'rgba(255, 255, 255, 0)');         // Completely transparent
    
    // Draw extended circular gradient that fades beyond the product bounds
    ctx.fillStyle = gradientBackdrop;
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add very subtle depth shadow
    const depthShadow = ctx.createRadialGradient(centerX, centerY + 8, 0, centerX, centerY + 8, maxRadius * 0.4);
    depthShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
    depthShadow.addColorStop(0.4, 'rgba(0, 0, 0, 0.03)');
    depthShadow.addColorStop(0.7, 'rgba(0, 0, 0, 0.02)');
    depthShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = depthShadow;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 8, width * 0.4, height * 0.25, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.restore();
  };

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    console.log('🎨 renderCanvas called with:', {
      assetsCount: composition.assets?.length ?? 0,
      assets: composition.assets?.map(a => ({
        id: a.id,
        type: a.type,
        text: a.text,
        position: a.position,
        size: a.size,
        color: a.color
      })) ?? [],
      backgroundImage: !!backgroundImage,
      productImage: !!productImage,
      logoImage: !!logoImage
    });

    // Wait for background image to load
    if (!backgroundImage) {
      console.log('Background image not loaded yet, skipping render');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size - use consistent dimensions
    canvas.width = composition.canvasSize.width;
    canvas.height = composition.canvasSize.height;

    // Clear and fill with white background first
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background image (layer 1)
    try {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      console.log('Background image drawn successfully');
    } catch (error) {
      console.error('Error drawing background image:', error);
      // Fallback: draw gray background
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Product image is now drawn as an asset in the asset loop below

    // Draw all assets
    composition.assets?.forEach(asset => {
      if (editingText === asset.id) return;

      ctx.save();
      ctx.translate(asset.position.x + asset.size.width / 2, asset.position.y + asset.size.height / 2);
      ctx.rotate((asset.rotation * Math.PI) / 180);
      ctx.translate(-asset.size.width / 2, -asset.size.height / 2);

      if (asset.type === 'text' && asset.text) {
        ctx.font = `${asset.fontWeight} ${asset.fontSize}px ${asset.fontFamily}`;
        ctx.fillStyle = asset.color || '#000000';
        ctx.textAlign = asset.textAlign as CanvasTextAlign || 'left';
        ctx.textBaseline = 'middle';
        
        // Respect manual line breaks only, no automatic breaking
        const lines = asset.text.split('\n');
        const lineHeight = asset.fontSize! * 1.2;
        
        lines.forEach((line, index) => {
          const y = (asset.size.height / 2) + (index - (lines.length - 1) / 2) * lineHeight;
          let x = 0;
          
          switch (asset.textAlign) {
            case 'center': x = asset.size.width / 2; break;
            case 'right': x = asset.size.width; break;
            default: x = 0;
          }
          
          ctx.fillText(line, x, y);
        });
      } else if (asset.type === 'cta' && asset.text) {
        // Draw CTA button with subtle background effects
        const borderRadius = asset.borderRadius || 12;
        
        // Save context for effects
        ctx.save();
        
        // Add subtle drop shadow to CTA
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;
        ctx.shadowBlur = 8;
        
        // Helper function to draw rounded rectangle
        const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + width - radius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
          ctx.lineTo(x + width, y + height - radius);
          ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
          ctx.lineTo(x + radius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
        };

        // Draw button background with shadow
        if (asset.backgroundColor) {
          ctx.fillStyle = asset.backgroundColor;
          drawRoundedRect(0, 0, asset.size.width, asset.size.height, borderRadius);
          ctx.fill();
        }
        
        // Reset shadow for text
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;

        // Draw button border if specified
        if (asset.borderColor) {
          ctx.strokeStyle = asset.borderColor;
          ctx.lineWidth = asset.borderWidth || 2;
          drawRoundedRect(0, 0, asset.size.width, asset.size.height, borderRadius);
          ctx.stroke();
        }

        // Draw button text
        ctx.font = `${asset.fontWeight} ${asset.fontSize}px ${asset.fontFamily}`;
        ctx.fillStyle = asset.color || '#000000';
        ctx.textAlign = asset.textAlign as CanvasTextAlign || 'center';
        ctx.textBaseline = 'middle';
        
        // Respect manual line breaks only for CTA text
        const lines = asset.text.split('\n');
        const lineHeight = asset.fontSize! * 1.2;
        
        lines.forEach((line, index) => {
          const y = (asset.size.height / 2) + (index - (lines.length - 1) / 2) * lineHeight;
          let x = 0;
          
          switch (asset.textAlign) {
            case 'center': x = asset.size.width / 2; break;
            case 'right': x = asset.size.width; break;
            default: x = 0;
          }
          
          ctx.fillText(line, x, y);
        });
        
        // Restore context
        ctx.restore();
      } else if (asset.type === 'logo' && logoImage) {
        // Draw logo image with subtle background effect
        try {
          const borderRadius = 12; // Rounded corner radius
          const x = 0;
          const y = 0;
          const width = asset.size.width;
          const height = asset.size.height;
          
          // Save context for effects
          ctx.save();
          
          // Add stronger drop shadow for better visibility
          ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 4;
          ctx.shadowBlur = 12;
          
          // Create more visible background with slight gradient effect
          const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          gradient.addColorStop(1, 'rgba(248, 250, 252, 0.92)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(x + borderRadius, y);
          ctx.lineTo(x + width - borderRadius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius);
          ctx.lineTo(x + width, y + height - borderRadius);
          ctx.quadraticCurveTo(x + width, y + height, x + width - borderRadius, y + height);
          ctx.lineTo(x + borderRadius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius);
          ctx.lineTo(x, y + borderRadius);
          ctx.quadraticCurveTo(x, y, x + borderRadius, y);
          ctx.closePath();
          ctx.fill();
          
          // Reset shadow for logo image
          ctx.shadowColor = 'transparent';
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.shadowBlur = 0;
          
          // Create clipping path for logo
          ctx.beginPath();
          ctx.moveTo(x + borderRadius, y);
          ctx.lineTo(x + width - borderRadius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius);
          ctx.lineTo(x + width, y + height - borderRadius);
          ctx.quadraticCurveTo(x + width, y + height, x + width - borderRadius, y + height);
          ctx.lineTo(x + borderRadius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius);
          ctx.lineTo(x, y + borderRadius);
          ctx.quadraticCurveTo(x, y, x + borderRadius, y);
          ctx.closePath();
          ctx.clip();
          
          // Draw the logo image within the clipped area
          ctx.drawImage(logoImage, x, y, width, height);
          
          // Restore context
          ctx.restore();
        } catch (error) {
          console.error('Error drawing logo image:', error);
          // Fallback to placeholder with rounded corners
          const borderRadius = 12;
          const x = 0;
          const y = 0;
          const width = asset.size.width;
          const height = asset.size.height;
          
          // Draw rounded placeholder
          ctx.beginPath();
          ctx.moveTo(x + borderRadius, y);
          ctx.lineTo(x + width - borderRadius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius);
          ctx.lineTo(x + width, y + height - borderRadius);
          ctx.quadraticCurveTo(x + width, y + height, x + width - borderRadius, y + height);
          ctx.lineTo(x + borderRadius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius);
          ctx.lineTo(x, y + borderRadius);
          ctx.quadraticCurveTo(x, y, x + borderRadius, y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.fill();
          ctx.strokeStyle = '#ccc';
          ctx.stroke();
          
          ctx.fillStyle = '#666';
          ctx.font = '14px Inter';
          ctx.textAlign = 'center';
          ctx.fillText('LOGO', width / 2, height / 2);
        }
      } else if (asset.type === 'logo') {
        // Draw logo placeholder with rounded corners
        const borderRadius = 12;
        const x = 0;
        const y = 0;
        const width = asset.size.width;
        const height = asset.size.height;
        
        // Draw rounded placeholder
        ctx.beginPath();
        ctx.moveTo(x + borderRadius, y);
        ctx.lineTo(x + width - borderRadius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius);
        ctx.lineTo(x + width, y + height - borderRadius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - borderRadius, y + height);
        ctx.lineTo(x + borderRadius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius);
        ctx.lineTo(x, y + borderRadius);
        ctx.quadraticCurveTo(x, y, x + borderRadius, y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fill();
        ctx.strokeStyle = '#ccc';
        ctx.stroke();
        
        ctx.fillStyle = '#666';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('LOGO', width / 2, height / 2);
      } else if (asset.type === 'product' && productImage) {
        // Draw subtle backdrop effect behind product
        drawProductBackdrop(ctx, asset.size.width, asset.size.height);
        
        // Draw product image
        try {
          ctx.drawImage(productImage, 0, 0, asset.size.width, asset.size.height);
          console.log('✅ Product image drawn as asset:', { width: asset.size.width, height: asset.size.height });
        } catch (error) {
          console.error('❌ Error drawing product image asset:', error);
          // Fallback to placeholder
          ctx.fillStyle = 'rgba(0,150,0,0.1)';
          ctx.fillRect(0, 0, asset.size.width, asset.size.height);
          ctx.strokeStyle = '#4CAF50';
          ctx.strokeRect(0, 0, asset.size.width, asset.size.height);
          ctx.fillStyle = '#2E7D2E';
          ctx.font = '14px Inter';
          ctx.textAlign = 'center';
          ctx.fillText('PRODUCTO', asset.size.width / 2, asset.size.height / 2);
        }
      } else if (asset.type === 'product') {
        // Draw product placeholder
        console.log('⚠️ Product asset found but no productImage state - showing placeholder');
        console.log('Product asset details:', {
          id: asset.id,
          imageUrl: asset.imageUrl,
          hasProductImageState: !!productImage,
          actualProductImageUrl: actualProductImageUrl
        });
        
        ctx.fillStyle = 'rgba(0,150,0,0.1)';
        ctx.fillRect(0, 0, asset.size.width, asset.size.height);
        ctx.strokeStyle = '#4CAF50';
        ctx.strokeRect(0, 0, asset.size.width, asset.size.height);
        ctx.fillStyle = '#2E7D2E';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('PRODUCTO', asset.size.width / 2, asset.size.height / 2);
      }

      ctx.restore();

      // Selection highlight
      if (editorState.selectedAssetId === asset.id) {
        ctx.save();
        ctx.translate(asset.position.x, asset.position.y);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(-2, -2, asset.size.width + 4, asset.size.height + 4);
        ctx.restore();
      }
    });

    // Draw alignment guides
    if (alignmentGuides.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      alignmentGuides.forEach(guide => {
        if (guide.type === 'vertical') {
          ctx.beginPath();
          ctx.moveTo(guide.position, guide.start);
          ctx.lineTo(guide.position, guide.end);
          ctx.stroke();
        } else if (guide.type === 'horizontal') {
          ctx.beginPath();
          ctx.moveTo(guide.start, guide.position);
          ctx.lineTo(guide.end, guide.position);
          ctx.stroke();
        }
      });
      
      ctx.restore();
    }
  }, [composition, backgroundImage, logoImage, productImage, editorState.selectedAssetId, editingText, alignmentGuides]);

  // Force re-render when background or product images change
  useEffect(() => {
    console.log('Images changed, triggering render');
    renderCanvas();
  }, [renderCanvas, backgroundImage, productImage]);

  // Force re-render when composition assets change (especially important for loaded compositions)
  useEffect(() => {
    console.log('🎨 Composition assets changed, triggering render:', {
      assetsCount: composition.assets?.length ?? 0,
      assetTypes: composition.assets?.map(a => `${a.type}(${a.text || 'no-text'})`) ?? [],
      hasLoaded: hasAttemptedLoad
    });
    renderCanvas();
  }, [renderCanvas, composition.assets, hasAttemptedLoad]);

  // Load images with smart CORS handling
  useEffect(() => {
    if (actualBackgroundImageUrl) {
      console.log('Loading background image:', actualBackgroundImageUrl);
      
      // Check if this is a Supabase storage URL (our own storage)
      const isSupabaseStorage = actualBackgroundImageUrl.includes('supabase') || 
                               actualBackgroundImageUrl.includes(window.location.hostname);
      
      // Check if this is an external service that likely has CORS restrictions
      const isExternalService = actualBackgroundImageUrl.includes('bfl.ai') || 
                               actualBackgroundImageUrl.includes('delivery-us1') ||
                               actualBackgroundImageUrl.includes('openai.com');
      
      console.log('Image source analysis:', {
        url: actualBackgroundImageUrl,
        isSupabaseStorage,
        isExternalService
      });
      
      // Show helpful notification for external service URLs
      if (isExternalService) {
        setTimeout(() => {
          toast({
            title: "💡 Banner con imagen externa",
            description: "Este banner usa una imagen externa que puede expirar. Para descargas futuras, considera generar un nuevo banner.",
            variant: "default"
          });
        }, 2000);
      }
      
      // Load background image with appropriate method based on source
      console.log('Loading background image with appropriate method...');
      
      if (isSupabaseStorage) {
        // For Supabase storage URLs, try different loading methods
        console.log('Loading Supabase storage image...');
        
        // First try: Load without CORS (might work for public buckets)
        const img = document.createElement('img');
        
        img.onload = () => {
          console.log('✅ Supabase storage image loaded successfully (no CORS)');
          setBackgroundImage(img);
        };
        
        img.onerror = (error) => {
          console.warn('Failed to load without CORS, trying with CORS...', error);
          
          // Second try: Load with CORS
          const corsImg = document.createElement('img');
          corsImg.crossOrigin = 'anonymous';
          
          corsImg.onload = () => {
            console.log('✅ Supabase storage image loaded successfully (with CORS)');
            setBackgroundImage(corsImg);
          };
          
          corsImg.onerror = (corsError) => {
            console.error('❌ Failed to load Supabase storage image with both methods:', corsError);
            console.error('URL:', actualBackgroundImageUrl);
            console.error('This might indicate a bucket permissions issue or CORS configuration problem.');
            
            // Test direct URL access
            fetch(actualBackgroundImageUrl, { method: 'HEAD' })
              .then(response => {
                console.log('🔍 Background Direct fetch test result:', {
                  status: response.status,
                  statusText: response.statusText,
                  ok: response.ok,
                  contentType: response.headers.get('content-type'),
                  headers: Object.fromEntries(response.headers.entries())
                });
                
                if (response.ok) {
                  console.log('✅ Background URL is accessible! Issue is with image loading method.');
                  // Try alternative loading method
                  console.log('🔄 Trying alternative background image loading...');
                  const img = document.createElement('img');
                  img.crossOrigin = 'anonymous';
                  img.onload = () => {
                    console.log('✅ Alternative background loading successful!');
                    setBackgroundImage(img);
                  };
                  img.onerror = (altError) => {
                    console.error('❌ Alternative background loading also failed:', altError);
                  };
                  img.src = actualBackgroundImageUrl + '?t=' + Date.now(); // Cache bust
                } else {
                  console.error('❌ Background URL not accessible:', response.status, response.statusText);
                }
              })
              .catch(fetchError => {
                console.error('🔍 Background Direct fetch test failed:', fetchError);
              });
            
            // Show user-friendly error
            toast({
              title: "Error al cargar imagen",
              description: "No se pudo cargar la imagen del banner. Verifica la configuración de Supabase Storage.",
              variant: "destructive"
            });
          };
          
          corsImg.src = actualBackgroundImageUrl;
        };
        
        img.src = actualBackgroundImageUrl;
      } else if (isExternalService) {
        // For external services, use the proxy method
        console.log('Loading external service image via proxy...');
        const img = document.createElement('img');
        
        img.onload = () => {
          console.log('✅ External service image loaded via proxy');
          setBackgroundImage(img);
        };
        
        img.onerror = (error) => {
          console.error('❌ Failed to load external service image via proxy:', error);
          console.error('URL:', actualBackgroundImageUrl);
        };
        
        // Use proxy for external services
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(actualBackgroundImageUrl)}`;
        img.src = proxyUrl;
      } else {
        // For other URLs (local development, etc.), use simple loading
        console.log('Loading local/other image directly...');
        const img = document.createElement('img');
        
        img.onload = () => {
          console.log('✅ Local/other image loaded successfully');
          setBackgroundImage(img);
        };
        
        img.onerror = (error) => {
          console.error('❌ Failed to load local/other image:', error);
          console.error('URL:', actualBackgroundImageUrl);
        };
        
        img.src = actualBackgroundImageUrl;
      }
      
      // Update composition with actual background image URL
      setComposition(prev => ({
        ...prev,
        backgroundImageUrl: actualBackgroundImageUrl
      }));
    }
  }, [actualBackgroundImageUrl]);

  // Load product image with smart CORS handling and create asset
  useEffect(() => {
    console.log('🔳 Product image useEffect triggered, actualProductImageUrl:', actualProductImageUrl);
    
    if (actualProductImageUrl) {
      console.log('🔳 Loading product image:', actualProductImageUrl);
      
      const isSupabaseStorage = actualProductImageUrl.includes('supabase.co/storage');
      const isExternalService = actualProductImageUrl.includes('delivery-eu1.bfl.ai') || 
                               actualProductImageUrl.includes('delivery-us1.bfl.ai') || 
                               actualProductImageUrl.includes('bfl.ai') || 
                               actualProductImageUrl.includes('openai.com');
      
      const handleImageLoad = (img: HTMLImageElement) => {
        console.log('✅ Product image loaded successfully, creating asset');
        setProductImage(img);
        
        // Calculate product image size and position - center it but make it an asset
        const canvasWidth = composition.canvasSize.width;
        const canvasHeight = composition.canvasSize.height;
        
        // Calculate optimal size (35% of banner width, maintaining aspect ratio)
        const productMaxWidth = canvasWidth * 0.35;
        const productMaxHeight = canvasHeight * 0.8;
        
        const productAspectRatio = img.width / img.height;
        let productWidth = productMaxWidth;
        let productHeight = productMaxWidth / productAspectRatio;
        
        if (productHeight > productMaxHeight) {
          productHeight = productMaxHeight;
          productWidth = productMaxHeight * productAspectRatio;
        }
        
        // Position in center
        const productX = (canvasWidth - productWidth) / 2;
        const productY = (canvasHeight - productHeight) / 2;
        
        // Create product asset
        const productAsset: BannerAsset = {
          id: `product_${Date.now()}`,
          type: 'product',
          position: { x: productX, y: productY },
          size: { width: productWidth, height: productHeight },
          rotation: 0,
          imageUrl: actualProductImageUrl
        };
        
        console.log('🔳 Creating product asset:', {
          id: productAsset.id,
          position: productAsset.position,
          size: productAsset.size,
          imageUrl: productAsset.imageUrl?.substring(0, 50) + '...',
          canvasSize: composition.canvasSize
        });
        
        // Add product asset to composition (or update if exists)
        setComposition(prev => {
          const existingProductIndex = prev.assets.findIndex(asset => asset.type === 'product');
          let newAssets;
          
          if (existingProductIndex >= 0) {
            // Update existing product asset - preserve position and size if they exist
            const existingAsset = prev.assets[existingProductIndex];
            console.log('🔄 Updating existing product asset, preserving position/size:', {
              existingPosition: existingAsset.position,
              existingSize: existingAsset.size,
              newImageUrl: productAsset.imageUrl?.substring(0, 50) + '...'
            });
            
            newAssets = prev.assets.map((asset, index) => 
              index === existingProductIndex ? {
                ...productAsset,
                id: existingAsset.id, // Keep existing ID
                position: existingAsset.position, // Preserve saved position
                size: existingAsset.size // Preserve saved size
              } : asset
            );
          } else {
            // Add new product asset with calculated position and size
            console.log('➕ Adding new product asset with calculated position/size');
            newAssets = [...prev.assets, productAsset];
          }
          
          return {
            ...prev,
            assets: newAssets,
            lastModified: new Date()
          };
        });
        
        console.log('Product asset created:', { productWidth, productHeight, productX, productY });
      };
      
      if (isSupabaseStorage) {
        // For Supabase storage URLs, try different loading methods
        console.log('Loading Supabase storage product image...');
        
        // First try: Load without CORS (might work for public buckets)
        const img = document.createElement('img');
        
        img.onload = () => {
          console.log('✅ Supabase storage product image loaded successfully (no CORS)');
          handleImageLoad(img);
        };
        
        img.onerror = (error) => {
          console.warn('Failed to load product image without CORS, trying with CORS...', error);
          
          // Second try: Load with CORS
          const corsImg = document.createElement('img');
          corsImg.crossOrigin = 'anonymous';
          
          corsImg.onload = () => {
            console.log('✅ Supabase storage product image loaded successfully (with CORS)');
            handleImageLoad(corsImg);
          };
          
          corsImg.onerror = (corsError) => {
            console.error('❌ Failed to load Supabase storage product image with both methods:', corsError);
            console.error('URL:', actualProductImageUrl);
            
            // Test direct URL access
            fetch(actualProductImageUrl, { method: 'HEAD' })
              .then(response => {
                console.log('🔍 Product direct fetch test result:', {
                  status: response.status,
                  statusText: response.statusText,
                  ok: response.ok,
                  contentType: response.headers.get('content-type'),
                  headers: Object.fromEntries(response.headers.entries())
                });
                
                if (response.ok) {
                  console.log('✅ Product URL is accessible! Issue is with image loading method.');
                  // Try alternative loading method
                  console.log('🔄 Trying alternative product image loading...');
                  const img = document.createElement('img');
                  img.crossOrigin = 'anonymous';
                  img.onload = () => {
                    console.log('✅ Alternative product loading successful!');
                    handleImageLoad(img);
                  };
                  img.onerror = (altError) => {
                    console.error('❌ Alternative product loading also failed:', altError);
                  };
                  img.src = actualProductImageUrl + '?t=' + Date.now(); // Cache bust
                } else {
                  console.error('❌ Product URL not accessible:', response.status, response.statusText);
                }
              })
              .catch(fetchError => {
                console.error('🔍 Product direct fetch test failed:', fetchError);
              });
              
            // Show user-friendly error
            toast({
              title: "Error al cargar imagen del producto",
              description: "No se pudo cargar la imagen del producto. Verifica la configuración de Supabase Storage.",
              variant: "destructive"
            });
          };
          
          corsImg.src = actualProductImageUrl;
        };
        
        img.src = actualProductImageUrl;
      } else if (isExternalService) {
        // For external services, use the proxy method
        console.log('Loading external service product image via proxy...');
        const img = document.createElement('img');
        
        img.onload = () => {
          console.log('✅ External service product image loaded via proxy');
          handleImageLoad(img);
        };
        
        img.onerror = (error) => {
          console.error('❌ Failed to load external service product image via proxy:', error);
          console.error('URL:', actualProductImageUrl);
        };
        
        // Use proxy for external services
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(actualProductImageUrl)}`;
        img.src = proxyUrl;
      } else {
        // For other URLs (local development, etc.), use simple loading
        console.log('Loading local/other product image directly...');
        const img = document.createElement('img');
        
        img.onload = () => {
          console.log('✅ Local/other product image loaded successfully');
          handleImageLoad(img);
        };
        
        img.onerror = (error) => {
          console.error('❌ Failed to load local/other product image:', error);
          console.error('URL:', actualProductImageUrl);
        };
        
        img.src = actualProductImageUrl;
      }
    }
  }, [actualProductImageUrl, composition.canvasSize]);

  useEffect(() => {
    if (actualPartnerLogoUrl) {
      console.log('Loading logo image:', actualPartnerLogoUrl);
      
      // Check if this is a Supabase storage URL (our own storage)
      const isSupabaseStorage = actualPartnerLogoUrl.includes('supabase') || 
                               actualPartnerLogoUrl.includes(window.location.hostname);
      
      // Check if this is an external service that likely has CORS restrictions
      const isExternalService = actualPartnerLogoUrl.includes('bfl.ai') || 
                               actualPartnerLogoUrl.includes('delivery-us1') ||
                               actualPartnerLogoUrl.includes('openai.com');
      
      console.log('Logo source analysis:', {
        url: actualPartnerLogoUrl,
        isSupabaseStorage,
        isExternalService
      });
      
      // Load logo image optimized for export - try to avoid CORS tainting
      console.log('Loading logo image optimized for export...');
      const img = document.createElement('img');
      
      // First try: Load without CORS to avoid tainting
      img.onload = () => {
        console.log('✅ Logo image loaded without CORS - canvas export will work perfectly');
        setLogoImage(img);
      };
      
      img.onerror = (error) => {
        console.warn('Logo image failed without CORS, trying with crossOrigin...');
        // Second try: Use crossOrigin (might work if server supports CORS)
        const corsImg = document.createElement('img');
        corsImg.crossOrigin = 'anonymous';
        
        corsImg.onload = () => {
          console.log('✅ Logo image loaded with CORS - canvas export should work');
          setLogoImage(corsImg);
        };
        
        corsImg.onerror = (corsError) => {
          console.warn('Logo image failed with CORS too. Trying as display-only...');
          // Third try: Load for display only (will taint canvas but shows image)
          const displayImg = document.createElement('img');
          displayImg.onload = () => {
            console.log('⚠️ Logo image loaded for display only - canvas may be tainted');
            setLogoImage(displayImg);
          };
          displayImg.onerror = (finalError) => {
            console.error('❌ All logo image loading methods failed:', finalError);
          };
          displayImg.src = actualPartnerLogoUrl;
        };
        
        corsImg.src = actualPartnerLogoUrl;
      };
      
      img.src = actualPartnerLogoUrl;
    }
  }, [actualPartnerLogoUrl]);

  // Update logo asset size to proper dimensions when logo loads (maintain aspect ratio, no 1:1 forcing)
  useEffect(() => {
    if (logoImage) {
      const logoAsset = composition.assets?.find(asset => asset.type === 'logo');
      if (logoAsset) {
        console.log('Updating logo to proper proportional size from natural dimensions:', logoImage.naturalWidth, 'x', logoImage.naturalHeight);
        
        // Use proper proportional sizing - never force to 1:1 aspect ratio
        const { width: logoWidth, height: logoHeight } = calculateLogoSize(logoImage.naturalWidth, logoImage.naturalHeight);
        
        // Only update if the size has actually changed to prevent infinite loops
        const sizeChanged = Math.abs(logoAsset.size.width - logoWidth) > 1 || Math.abs(logoAsset.size.height - logoHeight) > 1;
        if (sizeChanged) {
          setComposition(prev => ({
            ...prev,
            assets: prev.assets.map(asset => 
              asset.id === logoAsset.id 
                ? { ...asset, size: { width: logoWidth, height: logoHeight } }
                : asset
            ),
            lastModified: new Date()
          }));
          console.log(`✅ Logo resized to maintain proportions: ${logoWidth.toFixed(1)}x${logoHeight.toFixed(1)}`);
        }
      }
    }
  }, [logoImage]); // Removed composition.assets from dependency array to prevent infinite loop

  // Handle resize
  // DIRECT resize function that works immediately
  const handleCornerResize = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log(`🔄 Resize started: ${handle} handle clicked`);
    
    if (!editorState.selectedAssetId) {
      console.log('❌ No selected asset');
      return;
    }

    const selectedAsset = composition.assets.find(a => a.id === editorState.selectedAssetId);
    if (!selectedAsset) {
      console.log('❌ Selected asset not found');
      return;
    }

    console.log(`✅ Starting resize: ${handle} handle on ${selectedAsset.type} asset (${selectedAsset.size.width}x${selectedAsset.size.height})`);

    // Set resize state to prevent dragging
    setIsResizing(true);
    setResizeHandle(handle);
    setInitialResizeData({
      startX: e.clientX,
      startY: e.clientY,
      startWidth: selectedAsset.size.width,
      startHeight: selectedAsset.size.height,
      startPosX: selectedAsset.position.x,
      startPosY: selectedAsset.position.y,
      isLogo: selectedAsset.type === 'logo',
      isProduct: selectedAsset.type === 'product'
    });
    
    // Update editor state to indicate resizing
    setEditorState(prev => ({
      ...prev,
      isResizing: true,
      isDragging: false // Make sure dragging is disabled during resize
    }));
    
    console.log(`🎯 Resize initialized: startMouse=(${e.clientX}, ${e.clientY}), startSize=${selectedAsset.size.width}x${selectedAsset.size.height}`);
  };



  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (editingText) {
      finishTextEditing();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const clickedAsset = [...composition.assets].reverse().find(asset => 
      x >= asset.position.x && x <= asset.position.x + asset.size.width &&
      y >= asset.position.y && y <= asset.position.y + asset.size.height
    );

    if (clickedAsset) {
      const now = Date.now();
      const isDoubleClick = now - lastClickTime < 300;
      setLastClickTime(now);

      if (isDoubleClick && (clickedAsset.type === 'text' || clickedAsset.type === 'cta')) {
        startTextEditing(clickedAsset.id);
        return;
      }

      // Just select the asset, don't start dragging immediately
      setEditorState(prev => ({
        ...prev,
        selectedAssetId: clickedAsset.id,
        isDragging: false, // Don't start dragging on click
        dragOffset: { x: x - clickedAsset.position.x, y: y - clickedAsset.position.y }
      }));
      
      // Save initial mouse position for drag threshold
      setDragStartPosition({ x: e.clientX, y: e.clientY });
      setIsDragReady(true);
      
      // Update mini toolbar position
      const canvasRect = canvas.getBoundingClientRect();
      setMiniToolbarPosition({
        x: canvasRect.left + (clickedAsset.position.x + clickedAsset.size.width + 10) * (canvasRect.width / canvas.width),
        y: canvasRect.top + (clickedAsset.position.y + clickedAsset.size.height / 2) * (canvasRect.height / canvas.height)
      });
      
      console.log(`Asset selected: ${clickedAsset.type}, starting drag mode`);
    } else {
      // Clicking on empty space clears selection
      setEditorState(prev => ({ ...prev, selectedAssetId: null, isDragging: false }));
      setMiniToolbarPosition(null);
      setDragStartPosition(null);
      setIsDragReady(false);
    }
  };

  // Global mouse event handlers
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      // Handle resizing - prioritize resize over drag
      if (isResizing && editorState.selectedAssetId && initialResizeData && resizeHandle) {
        const deltaX = e.clientX - initialResizeData.startX;
        const deltaY = e.clientY - initialResizeData.startY;
        
        console.log(`🔄 Resizing: handle=${resizeHandle}, delta=(${deltaX}, ${deltaY})`);

        let newWidth = initialResizeData.startWidth;
        let newHeight = initialResizeData.startHeight;
        let newX = initialResizeData.startPosX;
        let newY = initialResizeData.startPosY;

        // Get selected asset info
        const selectedAsset = composition.assets.find(a => a.id === editorState.selectedAssetId);
        const isLogo = selectedAsset?.type === 'logo';
        const isProduct = selectedAsset?.type === 'product';
        
        // Calculate new dimensions based on handle
        switch (resizeHandle) {
          case 'se': // Southeast - grow from top-left
            newWidth = Math.max(20, initialResizeData.startWidth + deltaX);
            newHeight = Math.max(20, initialResizeData.startHeight + deltaY);
            break;
          case 'sw': // Southwest - grow from top-right
            newWidth = Math.max(20, initialResizeData.startWidth - deltaX);
            newHeight = Math.max(20, initialResizeData.startHeight + deltaY);
            newX = initialResizeData.startPosX + (initialResizeData.startWidth - newWidth);
            break;
          case 'ne': // Northeast - grow from bottom-left
            newWidth = Math.max(20, initialResizeData.startWidth + deltaX);
            newHeight = Math.max(20, initialResizeData.startHeight - deltaY);
            newY = initialResizeData.startPosY + (initialResizeData.startHeight - newHeight);
            break;
          case 'nw': // Northwest - grow from bottom-right
            newWidth = Math.max(20, initialResizeData.startWidth - deltaX);
            newHeight = Math.max(20, initialResizeData.startHeight - deltaY);
            newX = initialResizeData.startPosX + (initialResizeData.startWidth - newWidth);
            newY = initialResizeData.startPosY + (initialResizeData.startHeight - newHeight);
            break;
        }

        // For logos and product images, maintain aspect ratio
        if (isLogo || isProduct) {
          const originalAspectRatio = initialResizeData.startWidth / initialResizeData.startHeight;
          
          // Use the scale factor based on the dimension that changed more
          const widthScale = Math.abs((newWidth - initialResizeData.startWidth) / initialResizeData.startWidth);
          const heightScale = Math.abs((newHeight - initialResizeData.startHeight) / initialResizeData.startHeight);
          
          let scale;
          if (widthScale > heightScale) {
            // Width changed more, use width scale
            scale = newWidth / initialResizeData.startWidth;
            newHeight = Math.max(20, initialResizeData.startHeight * scale);
          } else {
            // Height changed more, use height scale
            scale = newHeight / initialResizeData.startHeight;
            newWidth = Math.max(20, initialResizeData.startWidth * scale);
          }
          
          // Adjust position based on resize handle to maintain proper anchoring
          if (resizeHandle === 'ne' || resizeHandle === 'nw') {
            newY = initialResizeData.startPosY + (initialResizeData.startHeight - newHeight);
          }
          if (resizeHandle === 'nw' || resizeHandle === 'sw') {
            newX = initialResizeData.startPosX + (initialResizeData.startWidth - newWidth);
          }
          
          // Verify aspect ratio is maintained
          const newAspectRatio = newWidth / newHeight;
          const aspectRatioDiff = Math.abs(originalAspectRatio - newAspectRatio);
          
          const assetType = isLogo ? 'Logo' : 'Product';
          console.log(`📐 ${assetType} proportional resize: scale=${scale.toFixed(3)}, newSize=${Math.round(newWidth)}x${Math.round(newHeight)}, ratio=${newAspectRatio.toFixed(3)} (original: ${originalAspectRatio.toFixed(3)})`);
          
          if (aspectRatioDiff > 0.01) {
            console.warn(`⚠️  ${assetType} aspect ratio drift detected: ${aspectRatioDiff.toFixed(4)}`);
          }
        }

        // Apply the resize
        updateComposition(prev => ({
      ...prev,
          assets: prev.assets.map(asset => 
            asset.id === editorState.selectedAssetId
              ? {
                  ...asset,
                  size: { width: newWidth, height: newHeight },
                  position: { x: newX, y: newY }
                }
              : asset
          ),
          lastModified: new Date()
        }));
        
        return; // Don't handle dragging when resizing
      }

      // Handle drag threshold - only start dragging if mouse moves enough
      if (isDragReady && dragStartPosition && editorState.selectedAssetId && !isResizing) {
        const dragDistance = Math.sqrt(
          Math.pow(e.clientX - dragStartPosition.x, 2) + 
          Math.pow(e.clientY - dragStartPosition.y, 2)
        );
        
        // Start dragging only if mouse moves more than 5 pixels
        if (dragDistance > 5 && !editorState.isDragging) {
          setEditorState(prev => ({
            ...prev,
            isDragging: true
          }));
          setIsDragReady(false); // Clear drag ready state
        }
      }

      // Handle dragging (only if not resizing)
      if (editorState.isDragging && editorState.selectedAssetId && !isResizing) {
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Calculate raw position
        const rawX = x - editorState.dragOffset.x;
        const rawY = y - editorState.dragOffset.y;

        // Find the dragged asset to calculate alignment guides
        const draggedAsset = composition.assets.find(a => a.id === editorState.selectedAssetId);
        if (draggedAsset) {
          // Calculate alignment guides and snapped position
          const { guides, snappedX, snappedY } = calculateAlignmentGuides(draggedAsset, rawX, rawY);
          
          // Update alignment guides state
          setAlignmentGuides(guides);
          
          // Apply canvas bounds constraints to snapped position
          const constrainedX = Math.max(0, Math.min(composition.canvasSize.width - draggedAsset.size.width, snappedX));
          const constrainedY = Math.max(0, Math.min(composition.canvasSize.height - draggedAsset.size.height, snappedY));

          updateComposition(prev => ({
            ...prev,
            assets: prev.assets.map(asset => 
              asset.id === editorState.selectedAssetId
                ? {
                    ...asset,
                    position: {
                      x: constrainedX,
                      y: constrainedY
                    }
                  }
                : asset
            ),
            lastModified: new Date()
          }));

          // Update mini toolbar position
          setMiniToolbarPosition({
            x: rect.left + (constrainedX + draggedAsset.size.width / 2) * (rect.width / canvas.width),
            y: rect.top + (constrainedY - 50) * (rect.height / canvas.height)
          });
        }
      }
    };

    const handleGlobalMouseUp = () => {
      console.log(`🔚 Mouse up - was dragging: ${editorState.isDragging}, was resizing: ${isResizing}`);
      
      if (isResizing) {
        console.log(`✅ Resize completed`);
      }
      
      // Clear all interaction states
      setEditorState(prev => ({ ...prev, isDragging: false, isResizing: false }));
      setIsResizing(false);
      setResizeHandle(null);
      setInitialResizeData(null);
      setDragStartPosition(null);
      setIsDragReady(false);
      
      // Clear alignment guides
      setAlignmentGuides([]);
    };

    if (editorState.isDragging || isResizing || isDragReady) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [editorState.isDragging, editorState.selectedAssetId, editorState.dragOffset, isResizing, resizeHandle, initialResizeData, isDragReady, dragStartPosition, updateComposition, composition.assets]);

  // Asset management
  const updateAsset = (assetId: string, updates: Partial<BannerAsset>) => {
    updateComposition(prev => ({
      ...prev,
      assets: prev.assets.map(asset => 
        asset.id === assetId ? { ...asset, ...updates } : asset
      ),
      lastModified: new Date()
    }));
  };

  const deleteAsset = (assetId: string) => {
    updateComposition(prev => ({
      ...prev,
      assets: prev.assets.filter(asset => asset.id !== assetId),
      lastModified: new Date()
    }));
    setEditorState(prev => ({ ...prev, selectedAssetId: null }));
    setMiniToolbarPosition(null);
  };

  const duplicateAsset = (assetId: string) => {
    const asset = composition.assets.find(a => a.id === assetId);
    if (!asset) return;

    const newAsset = {
      ...asset,
      id: `${asset.type}_${Date.now()}`,
      position: { x: asset.position.x + 20, y: asset.position.y + 20 }
    };

    updateComposition(prev => ({
      ...prev,
      assets: [...prev.assets, newAsset],
      lastModified: new Date()
    }));
  };

    const selectedAsset = composition.assets.find(asset => asset.id === editorState.selectedAssetId);
  const editingAsset = editingText ? composition.assets.find(asset => asset.id === editingText) : null;

  // Show loading state while banner data is being fetched
  if (isLoadingBanner) {
    return (
      <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del banner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative z-10">
        {/* Header */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Editor de Banner</h2>
          <p className="text-sm text-gray-600">{partnerName}</p>
          </div>
          {hasUnsavedChanges && (
            <p className="text-xs text-orange-600">• Sin guardar</p>
          )}
              </div>
                  </div>

            {/* Main Action Buttons */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => setEditorState(prev => ({ ...prev, zoom: Math.max(0.25, prev.zoom - 0.25) }))}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm w-14 text-center">{Math.round(editorState.zoom * 100)}%</span>
        <Button variant="outline" size="sm" onClick={() => setEditorState(prev => ({ ...prev, zoom: Math.min(2, prev.zoom + 0.25) }))}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEditorState(prev => ({ ...prev, zoom: 1 }))}>
          Ajustar
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <Button onClick={saveComposition} className="rounded-full" variant={hasUnsavedChanges ? "default" : "outline"}>
          <Save className="w-4 h-4 mr-2" />
          {hasUnsavedChanges ? "Guardar Cambios" : "Guardado"}
        </Button>
        
        <Button onClick={toggleMirrorLayout} variant="outline" className="rounded-full" title="Reorganizar elementos en espejo">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          {isMirroredLayout ? "Layout Normal" : "Layout Espejo"}
        </Button>
        {onExit && (
          <Button onClick={() => handleExit()} variant="outline" className="rounded-full">
            <X className="w-4 h-4 mr-2" />
            Salir
          </Button>
        )}
      </div>

      {/* Text Editing Toolbar */}
      {selectedAsset && selectedAsset.type === 'text' && (
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => startTextEditing(selectedAsset.id)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Editar Texto
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Select
            value={selectedAsset.fontFamily || brandGuidelines.fontPrimary}
            onValueChange={(value) => updateAsset(selectedAsset.id, { fontFamily: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* Partner Brand Fonts */}
              <SelectItem value={brandGuidelines.fontPrimary}>
                <div className="flex items-center">
                  <span className="text-violet-600 mr-2">★</span>
                  {brandGuidelines.fontPrimary} (Principal)
                </div>
              </SelectItem>
              <SelectItem value={brandGuidelines.fontSecondary}>
                <div className="flex items-center">
                  <span className="text-violet-600 mr-2">★</span>
                  {brandGuidelines.fontSecondary} (Secundaria)
                </div>
              </SelectItem>
              <Separator />
              {/* Other Fonts */}
              {fontOptions.filter(font => 
                font !== brandGuidelines.fontPrimary && 
                font !== brandGuidelines.fontSecondary
              ).map(font => (
                <SelectItem key={font} value={font}>{font}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => updateAsset(selectedAsset.id, { fontSize: Math.max(12, (selectedAsset.fontSize || 16) - 2) })}>
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-sm w-12 text-center">{selectedAsset.fontSize}</span>
          <Button variant="outline" size="sm" onClick={() => updateAsset(selectedAsset.id, { fontSize: Math.min(72, (selectedAsset.fontSize || 16) + 2) })}>
            <Plus className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant={selectedAsset.fontWeight === 'bold' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => updateAsset(selectedAsset.id, { fontWeight: selectedAsset.fontWeight === 'bold' ? 'normal' : 'bold' })}
          >
            <Bold className="w-4 h-4" />
          </Button>
          
          <Button 
            variant={selectedAsset.textAlign === 'left' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => updateAsset(selectedAsset.id, { textAlign: 'left' })}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant={selectedAsset.textAlign === 'center' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => updateAsset(selectedAsset.id, { textAlign: 'center' })}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button 
            variant={selectedAsset.textAlign === 'right' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => updateAsset(selectedAsset.id, { textAlign: 'right' })}
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Brand Colors */}
          <div className="flex items-center space-x-2">
            <Label className="text-sm font-medium">Color:</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateAsset(selectedAsset.id, { color: brandGuidelines.secondaryColor })}
              className="w-8 h-8 p-0 border-2"
              style={{ backgroundColor: brandGuidelines.secondaryColor }}
              title="Color Secundario (Texto Principal)"
            >
              <span className="sr-only">Secundario</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateAsset(selectedAsset.id, { color: brandGuidelines.mainColor })}
              className="w-8 h-8 p-0 border-2"
              style={{ backgroundColor: brandGuidelines.mainColor }}
              title="Color Principal"
            >
              <span className="sr-only">Principal</span>
            </Button>
          <Input
            type="color"
            value={selectedAsset.color || '#000000'}
            onChange={(e) => updateAsset(selectedAsset.id, { color: e.target.value })}
            className="w-12 h-8 p-1 rounded"
              title="Color personalizado"
          />
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
            💡 Salto automático cada 14 caracteres
          </span>
        </div>
      )}

      {/* CTA Button Editing Toolbar */}
      {selectedAsset && selectedAsset.type === 'cta' && (
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => startTextEditing(selectedAsset.id)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Editar Texto
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Select
            value={selectedAsset.fontFamily || 'Roboto'}
            onValueChange={(value) => updateAsset(selectedAsset.id, { fontFamily: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* Roboto as primary CTA font */}
              <SelectItem value="Roboto">
                <div className="flex items-center">
                  <span className="text-violet-600 mr-2">★</span>
                  Roboto (Recomendado)
                </div>
              </SelectItem>
              {/* Partner Brand Fonts */}
              {brandGuidelines.fontPrimary !== 'Roboto' && (
                <SelectItem value={brandGuidelines.fontPrimary}>
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-2">●</span>
                    {brandGuidelines.fontPrimary} (Principal)
                  </div>
                </SelectItem>
              )}
              {brandGuidelines.fontSecondary !== 'Roboto' && (
                <SelectItem value={brandGuidelines.fontSecondary}>
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-2">●</span>
                    {brandGuidelines.fontSecondary} (Secundaria)
                  </div>
                </SelectItem>
              )}
              <Separator />
              {/* Other Fonts */}
              {fontOptions.filter(font => 
                font !== 'Roboto' &&
                font !== brandGuidelines.fontPrimary && 
                font !== brandGuidelines.fontSecondary
              ).map(font => (
                <SelectItem key={font} value={font}>{font}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => updateAsset(selectedAsset.id, { fontSize: Math.max(12, (selectedAsset.fontSize || 16) - 2) })}>
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-sm w-12 text-center">{selectedAsset.fontSize}</span>
          <Button variant="outline" size="sm" onClick={() => updateAsset(selectedAsset.id, { fontSize: Math.min(72, (selectedAsset.fontSize || 16) + 2) })}>
            <Plus className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* CTA Button Colors */}
          <div className="flex items-center space-x-2">
            <Label className="text-sm font-medium">Texto:</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateAsset(selectedAsset.id, { color: brandGuidelines.mainColor })}
              className="w-8 h-8 p-0 border-2"
              style={{ backgroundColor: brandGuidelines.mainColor }}
              title="Color Principal (CTA)"
            >
              <span className="sr-only">Principal</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateAsset(selectedAsset.id, { color: '#ffffff' })}
              className="w-8 h-8 p-0 border-2"
              style={{ backgroundColor: '#ffffff' }}
              title="Blanco"
            >
              <span className="sr-only">Blanco</span>
            </Button>
            <Input
              type="color"
              value={selectedAsset.color || brandGuidelines.mainColor}
              onChange={(e) => updateAsset(selectedAsset.id, { color: e.target.value })}
              className="w-12 h-8 p-1 rounded"
              title="Color personalizado"
            />
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center space-x-2">
            <Label className="text-sm font-medium">Fondo:</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateAsset(selectedAsset.id, { backgroundColor: brandGuidelines.secondaryColor })}
              className="w-8 h-8 p-0 border-2"
              style={{ backgroundColor: brandGuidelines.secondaryColor }}
              title="Color Secundario (Fondo CTA)"
            >
              <span className="sr-only">Secundario</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateAsset(selectedAsset.id, { backgroundColor: brandGuidelines.mainColor })}
              className="w-8 h-8 p-0 border-2"
              style={{ backgroundColor: brandGuidelines.mainColor }}
              title="Color Principal"
            >
              <span className="sr-only">Principal</span>
            </Button>
            <Input
              type="color"
              value={selectedAsset.backgroundColor || brandGuidelines.secondaryColor}
              onChange={(e) => updateAsset(selectedAsset.id, { backgroundColor: e.target.value })}
              className="w-12 h-8 p-1 rounded"
              title="Color personalizado"
            />
          </div>
        </div>
      )}

      {/* Product Image Toolbar */}
      {selectedAsset && selectedAsset.type === 'product' && (
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
            <span className="text-sm font-medium text-gray-700">Imagen del Producto</span>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <span className="text-sm text-gray-600">
            Arrastra para mover • Redimensiona proporcionalmente • Alinea con otros elementos
          </span>
        </div>
      )}

      {/* Logo Upload Toolbar */}
      {selectedAsset && selectedAsset.type === 'logo' && (
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => logoInputRef.current?.click()}
            disabled={isUploadingLogo}
            className="flex items-center space-x-2"
          >
            {isUploadingLogo ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600"></div>
                <span>Subiendo...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Cambiar Logo</span>
              </>
            )}
          </Button>
          
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          
          <Separator orientation="vertical" className="h-6" />
          
          <span className="text-sm text-gray-600">
            Formatos: PNG, JPG, SVG • Máx. 5MB
          </span>
        </div>
      )}

      {/* Canvas Container */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden p-4">
        <div 
          className="relative"
          style={{ 
            transform: `scale(${editorState.zoom})`,
            transformOrigin: 'center center',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          <div className="bg-white rounded-lg shadow-xl relative" style={{ maxWidth: '100%', maxHeight: '100%' }}>
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
              className={`rounded-lg ${
                editorState.isDragging ? 'cursor-grabbing' : 
                isResizing ? 'cursor-auto' :
                'cursor-pointer'
              }`}
                style={{ 
                display: 'block',
                  maxWidth: '100%',
                  maxHeight: '100%',
                width: 'auto',
                height: 'auto'
              }}
            />

            
            {/* Text editing overlay */}
            {editingText && editingAsset && (
              <div
                className="absolute border-2 border-blue-500 bg-white shadow-md"
                style={{
                  left: editingAsset.position.x,
                  top: editingAsset.position.y,
                  width: editingAsset.size.width,
                  height: editingAsset.size.height,
                }}
              >
                <textarea
                  ref={textInputRef}
                  value={textEditValue}
                  onChange={(e) => setTextEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      finishTextEditing();
                    } else if (e.key === 'Enter' && e.shiftKey) {
                      // Allow Shift+Enter to create line breaks
                      // The default behavior will insert a newline
                    } else if (e.key === 'Escape') {
                      setEditingText(null);
                      setTextEditValue('');
                    }
                  }}
                  onBlur={finishTextEditing}
                  className="w-full h-full px-2 py-1 border-0 outline-none resize-none bg-white text-gray-900 placeholder-gray-500"
                  style={{
                    fontSize: `${editingAsset.fontSize}px`,
                    fontFamily: editingAsset.fontFamily,
                    fontWeight: editingAsset.fontWeight,
                    textAlign: editingAsset.textAlign as any
                  }}
                  placeholder="Escribe tu texto... Usa Shift+Enter para saltos de línea manuales o elimina los automáticos editando directamente"
                />
              </div>
            )}

            {/* Resize handles - positioned with proper scaling */}
            {selectedAsset && !editingText && (() => {
              const canvas = canvasRef.current;
              if (!canvas) {
                console.log('❌ Canvas not found for resize handles');
                return null;
              }
              
              const rect = canvas.getBoundingClientRect();
              const scaleX = rect.width / canvas.width;
              const scaleY = rect.height / canvas.height;
              
              // Convert canvas coordinates to display coordinates
              const displayX = selectedAsset.position.x * scaleX;
              const displayY = selectedAsset.position.y * scaleY;
              const displayWidth = selectedAsset.size.width * scaleX;
              const displayHeight = selectedAsset.size.height * scaleY;
              
              console.log(`🎯 Rendering resize handles for ${selectedAsset.type} at display pos (${displayX}, ${displayY}) size ${displayWidth}x${displayHeight}`);
              
              return (
                <>
                  {/* Northwest handle */}
                  <div 
                    className="absolute w-3 h-3 bg-blue-600 border border-white rounded-full cursor-nw-resize shadow-md z-20" 
                  style={{ 
                      left: displayX - 6, 
                      top: displayY - 6,
                      pointerEvents: 'all'
                    }}
                    onMouseDown={(e) => {
                      console.log('🟦 NW handle clicked!');
                      handleCornerResize(e, 'nw');
                    }}
                    title="Drag to resize"
                  />
                  {/* Northeast handle */}
                  <div 
                    className="absolute w-3 h-3 bg-blue-600 border border-white rounded-full cursor-ne-resize shadow-md z-20" 
                  style={{ 
                      left: displayX + displayWidth - 6, 
                      top: displayY - 6,
                      pointerEvents: 'all'
                    }}
                    onMouseDown={(e) => {
                      console.log('🟦 NE handle clicked!');
                      handleCornerResize(e, 'ne');
                    }}
                    title="Drag to resize"
                  />
                  {/* Southwest handle */}
                  <div 
                    className="absolute w-3 h-3 bg-blue-600 border border-white rounded-full cursor-sw-resize shadow-md z-20" 
                  style={{ 
                      left: displayX - 6, 
                      top: displayY + displayHeight - 6,
                      pointerEvents: 'all'
                    }}
                    onMouseDown={(e) => {
                      console.log('🟦 SW handle clicked!');
                      handleCornerResize(e, 'sw');
                    }}
                    title="Drag to resize"
                  />
                  {/* Southeast handle */}
                  <div 
                    className="absolute w-3 h-3 bg-blue-600 border border-white rounded-full cursor-se-resize shadow-md z-20" 
                  style={{ 
                      left: displayX + displayWidth - 6, 
                      top: displayY + displayHeight - 6,
                      pointerEvents: 'all'
                    }}
                    onMouseDown={(e) => {
                      console.log('🟦 SE handle clicked!');
                      handleCornerResize(e, 'se');
                    }}
                    title="Drag to resize"
                />
              </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Mini Toolbar - Positioned beside asset */}
      {miniToolbarPosition && selectedAsset && !editingText && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center space-x-1"
          style={{
            left: Math.max(10, Math.min(window.innerWidth - 160, miniToolbarPosition.x)),
            top: Math.max(10, Math.min(window.innerHeight - 50, miniToolbarPosition.y - 25))
          }}
        >
          {(selectedAsset.type === 'text' || selectedAsset.type === 'cta') && (
            <Button variant="ghost" size="sm" onClick={() => startTextEditing(selectedAsset.id)} title="Editar texto (doble click)">
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => duplicateAsset(selectedAsset.id)} title="Duplicar">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deleteAsset(selectedAsset.id)} title="Eliminar">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Usage Instructions - Show when asset is selected */}
      {selectedAsset && !editingText && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-black bg-opacity-80 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 border border-white rounded-full mr-2"></div>
              {(selectedAsset.type === 'logo' || selectedAsset.type === 'product')
                ? 'Arrastra las esquinas azules para redimensionar proporcionalmente' 
                : 'Arrastra las esquinas azules para redimensionar'}
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center">
              <div className="w-4 h-2 border-2 border-blue-500 mr-2"></div>
              Arrastra el elemento para mover
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerEditor;