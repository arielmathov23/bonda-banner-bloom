import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, ZoomOut, Download, Save, Type, Image, Trash2, Copy, Move, 
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
import type { BannerComposition, BannerAsset, EditorState, ExportOptions } from '@/types/banner-editor';

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

// Fixed positioning layout for aligned elements
const FIXED_LAYOUT = {
  logo: { x: 1200, y: 60, width: 180, height: 108 }, // Logo on right side, bigger, aligned with title top
  mainText: { x: 60, y: 60, width: 400, height: 50 }, // Title at top left
  descriptionText: { x: 60, y: 120, width: 480, height: 40 }, // Description below title
  ctaButton: { x: 60, y: 170, width: 160, height: 45 }, // CTA button below description, vertically stacked
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
  const textInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [miniToolbarPosition, setMiniToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [textEditValue, setTextEditValue] = useState('');
  const [lastClickTime, setLastClickTime] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [initialResizeData, setInitialResizeData] = useState<any>(null);
  
  // Loading state for banner data
  const [isLoadingBanner, setIsLoadingBanner] = useState(false);
  const [bannerData, setBannerData] = useState<any>(null);
  const [actualBackgroundImageUrl, setActualBackgroundImageUrl] = useState(backgroundImageUrl);
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
      
      // Update or create logo asset
      const logoAsset = composition.assets.find(asset => asset.type === 'logo');
      if (logoAsset) {
        // Update existing logo
        updateAsset(logoAsset.id, { imageUrl: objectUrl });
      } else {
        // Create new logo asset
        const newLogoAsset: BannerAsset = {
          id: `logo_${Date.now()}`,
          type: 'logo',
          position: { x: FIXED_LAYOUT.logo.x, y: FIXED_LAYOUT.logo.y },
          size: { width: FIXED_LAYOUT.logo.width, height: FIXED_LAYOUT.logo.height },
          rotation: 0,
          imageUrl: objectUrl
        };
        
        updateComposition(prev => ({
          ...prev,
          assets: [...prev.assets, newLogoAsset],
          lastModified: new Date()
        }));
      }
      
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
          setActualBackgroundImageUrl(banner.image_url);
          setActualPartnerLogoUrl(banner.partners?.logo_url);
          setActualBannerText(banner.main_text || '');
          setActualDescriptionText(banner.description_text || '');
          setActualCtaText(banner.cta_text || '');
          
          console.log('Banner data loaded:', banner);
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

  // Initialize assets with fixed positioning and brand colors
  useEffect(() => {
    const initialAssets: BannerAsset[] = [];
    
    // Add logo with fixed position
    if (actualPartnerLogoUrl) {
      initialAssets.push({
        id: `logo_${Date.now()}`,
        type: 'logo',
        position: { x: FIXED_LAYOUT.logo.x, y: FIXED_LAYOUT.logo.y },
        size: { width: FIXED_LAYOUT.logo.width, height: FIXED_LAYOUT.logo.height },
        rotation: 0,
        imageUrl: actualPartnerLogoUrl
      });
    }
    
    // Add main text with fixed position and secondary color
    if (actualBannerText) {
      initialAssets.push({
        id: `text_${Date.now()}`,
        type: 'text',
        position: { x: FIXED_LAYOUT.mainText.x, y: FIXED_LAYOUT.mainText.y },
        size: { width: FIXED_LAYOUT.mainText.width, height: FIXED_LAYOUT.mainText.height },
        rotation: 0,
        text: actualBannerText,
        fontSize: 42, // Larger title font
        fontFamily: brandGuidelines.fontPrimary,
        color: brandGuidelines.secondaryColor,
        fontWeight: 'bold',
        textAlign: 'left'
      });
    }

    // Add description text with fixed position and same color as title
    if (actualDescriptionText) {
      initialAssets.push({
        id: `description_${Date.now()}`,
        type: 'text',
        position: { x: FIXED_LAYOUT.descriptionText.x, y: FIXED_LAYOUT.descriptionText.y },
        size: { width: FIXED_LAYOUT.descriptionText.width, height: FIXED_LAYOUT.descriptionText.height },
        rotation: 0,
        text: actualDescriptionText,
        fontSize: 20, // Smaller than title, good proportion
        fontFamily: brandGuidelines.fontPrimary,
        color: brandGuidelines.secondaryColor, // Same color as title
        fontWeight: 'normal',
        textAlign: 'left'
      });
    }

    // Add CTA button with fixed position and styling
    if (actualCtaText) {
      initialAssets.push({
        id: `cta_${Date.now()}`,
        type: 'cta',
        position: { x: FIXED_LAYOUT.ctaButton.x, y: FIXED_LAYOUT.ctaButton.y },
        size: { width: FIXED_LAYOUT.ctaButton.width, height: FIXED_LAYOUT.ctaButton.height },
        rotation: 0,
        text: actualCtaText,
        fontSize: 16, // Appropriate size for CTA button
        fontFamily: 'Roboto', // Use Roboto for CTA buttons
        color: brandGuidelines.mainColor,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: brandGuidelines.secondaryColor,
        borderRadius: 24 // Higher border radius for more rounded appearance
      });
    }

    setComposition(prev => ({
      ...prev,
      assets: initialAssets,
      lastModified: new Date()
    }));

    // Only load saved composition if we have one and it's different from current banner data
    const key = `banner_composition_${bannerId}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        const savedComposition = JSON.parse(saved);
        // Check if the saved composition has the same banner text as current
        const savedTextAsset = savedComposition.assets.find((a: any) => a.type === 'text');
        const savedCtaAsset = savedComposition.assets.find((a: any) => a.type === 'cta');
        
        // Only load if the saved composition has different text (indicating user edits)
        const savedDescriptionAsset = savedComposition.assets.find((a: any) => a.id.startsWith('description_'));
        
        if (savedTextAsset && savedTextAsset.text !== actualBannerText ||
            savedCtaAsset && savedCtaAsset.text !== actualCtaText ||
            savedDescriptionAsset && savedDescriptionAsset.text !== actualDescriptionText) {
          setComposition(savedComposition);
          setEditorState(prev => ({ ...prev, zoom: savedComposition.zoom || 1 }));
        }
      } catch (error) {
        console.error('Failed to load composition:', error);
      }
    }
  }, [bannerId, actualPartnerLogoUrl, actualBannerText, actualDescriptionText, actualCtaText, brandGuidelines]);

  // Save/Load composition
  const saveComposition = useCallback(() => {
    const key = `banner_composition_${bannerId}`;
    const compositionData = { ...composition, lastModified: new Date() };
    localStorage.setItem(key, JSON.stringify(compositionData));
    
    setHasUnsavedChanges(false);
    
    toast({
      title: "Composición guardada",
      description: "Los cambios se han guardado correctamente",
    });

    // Call onSave callback if provided and exit after save
    if (onSave) {
      onSave(compositionData);
    }
    
    // Auto-exit after successful save
    if (onExit) {
      setTimeout(() => {
        onExit();
      }, 500); // Small delay to show the toast
    }
  }, [composition, bannerId, onSave, onExit]);

  const loadComposition = useCallback(() => {
    const key = `banner_composition_${bannerId}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        const savedComposition = JSON.parse(saved);
        setComposition(savedComposition);
        setEditorState(prev => ({ ...prev, zoom: savedComposition.zoom || 1 }));
      } catch (error) {
        console.error('Failed to load composition:', error);
      }
    }
  }, [bannerId]);

  const updateComposition = useCallback((updater: (prev: BannerComposition) => BannerComposition) => {
    setComposition(updater);
    setHasUnsavedChanges(true);
  }, []);

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

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

    // Draw background image
    try {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      console.log('Background image drawn successfully');
    } catch (error) {
      console.error('Error drawing background image:', error);
      // Fallback: draw gray background
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw all assets
    composition.assets.forEach(asset => {
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
        // Draw CTA button with background and rounded corners
        const borderRadius = asset.borderRadius || 12;
        
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

        // Draw button background
        if (asset.backgroundColor) {
          ctx.fillStyle = asset.backgroundColor;
          drawRoundedRect(0, 0, asset.size.width, asset.size.height, borderRadius);
          ctx.fill();
        }

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
      } else if (asset.type === 'logo' && logoImage) {
        // Draw logo image if available
        try {
        ctx.drawImage(logoImage, 0, 0, asset.size.width, asset.size.height);
        } catch (error) {
          console.error('Error drawing logo image:', error);
          // Fallback to placeholder
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.fillRect(0, 0, asset.size.width, asset.size.height);
          ctx.strokeStyle = '#ccc';
          ctx.strokeRect(0, 0, asset.size.width, asset.size.height);
          ctx.fillStyle = '#666';
          ctx.font = '14px Inter';
          ctx.textAlign = 'center';
          ctx.fillText('LOGO', asset.size.width / 2, asset.size.height / 2);
        }
      } else if (asset.type === 'logo') {
        // Draw logo placeholder
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0, 0, asset.size.width, asset.size.height);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(0, 0, asset.size.width, asset.size.height);
        ctx.fillStyle = '#666';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('LOGO', asset.size.width / 2, asset.size.height / 2);
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
  }, [composition, backgroundImage, logoImage, editorState.selectedAssetId, editingText]);

  // Force re-render when background image changes
  useEffect(() => {
    console.log('Background image changed, triggering render');
    renderCanvas();
  }, [renderCanvas, backgroundImage]);

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
      
      if (isSupabaseStorage) {
        // For Supabase storage: load without CORS to avoid taint (we control this)
        console.log('Loading Supabase storage image without CORS for clean canvas export');
        const img = document.createElement('img');
        img.onload = () => {
          console.log('Supabase storage image loaded successfully (canvas export ready)');
          setBackgroundImage(img);
        };
        img.onerror = (error) => {
          console.error('Failed to load Supabase storage image:', error);
        };
        img.src = actualBackgroundImageUrl;
      } else if (isExternalService) {
        // For external services: try without CORS first, then with CORS as fallback
        console.log('Loading external service image - trying without CORS first');
        const img = document.createElement('img');
        img.onload = () => {
          console.log('External image loaded without CORS (canvas export ready)');
          setBackgroundImage(img);
        };
        img.onerror = (error) => {
          console.warn('External image failed without CORS, trying with CORS (will taint canvas)');
          // Try with crossOrigin as fallback (this will taint canvas but at least shows image)
          const corsImg = document.createElement('img');
          corsImg.crossOrigin = 'anonymous';
          corsImg.onload = () => {
            console.log('External image loaded with CORS (canvas will be tainted)');
            setBackgroundImage(corsImg);
          };
          corsImg.onerror = (corsError) => {
            console.error('Both image loading methods failed:', corsError);
          };
          corsImg.src = actualBackgroundImageUrl;
        };
        img.src = actualBackgroundImageUrl;
      } else {
        // For other URLs: try standard loading
        console.log('Loading standard image URL');
        const img = document.createElement('img');
        img.onload = () => {
          console.log('Standard image loaded successfully');
          setBackgroundImage(img);
        };
        img.onerror = (error) => {
          console.error('Failed to load standard image:', error);
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
      
      if (isSupabaseStorage) {
        // For Supabase storage: load without CORS to avoid taint
        console.log('Loading Supabase storage logo without CORS for clean canvas export');
        const img = document.createElement('img');
        img.onload = () => {
          console.log('Supabase storage logo loaded successfully (canvas export ready)');
          setLogoImage(img);
        };
        img.onerror = (error) => {
          console.error('Failed to load Supabase storage logo:', error);
        };
        img.src = actualPartnerLogoUrl;
      } else if (isExternalService) {
        // For external services: try without CORS first, then with CORS as fallback
        console.log('Loading external service logo - trying without CORS first');
        const img = document.createElement('img');
        img.onload = () => {
          console.log('External logo loaded without CORS (canvas export ready)');
          setLogoImage(img);
        };
        img.onerror = (error) => {
          console.warn('External logo failed without CORS, trying with CORS (will taint canvas)');
          // Try with crossOrigin as fallback
          const corsImg = document.createElement('img');
          corsImg.crossOrigin = 'anonymous';
          corsImg.onload = () => {
            console.log('External logo loaded with CORS (canvas will be tainted)');
            setLogoImage(corsImg);
          };
          corsImg.onerror = (corsError) => {
            console.error('Both logo loading methods failed:', corsError);
          };
          corsImg.src = actualPartnerLogoUrl;
        };
        img.src = actualPartnerLogoUrl;
      } else {
        // For other URLs: try standard loading
        console.log('Loading standard logo URL');
        const img = document.createElement('img');
        img.onload = () => {
          console.log('Standard logo loaded successfully');
          setLogoImage(img);
        };
        img.onerror = (error) => {
          console.error('Failed to load standard logo:', error);
        };
        img.src = actualPartnerLogoUrl;
      }
    }
  }, [actualPartnerLogoUrl]);

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    if (!editorState.selectedAssetId) return;

    const selectedAsset = composition.assets.find(a => a.id === editorState.selectedAssetId);
    if (!selectedAsset) return;

    setIsResizing(true);
    setResizeHandle(handle);
    setInitialResizeData({
      startX: e.clientX,
      startY: e.clientY,
      startWidth: selectedAsset.size.width,
      startHeight: selectedAsset.size.height,
      startPosX: selectedAsset.position.x,
      startPosY: selectedAsset.position.y
    });
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

      setEditorState(prev => ({
        ...prev,
        selectedAssetId: clickedAsset.id,
        isDragging: true,
        dragOffset: { x: x - clickedAsset.position.x, y: y - clickedAsset.position.y }
      }));
      
      // Update mini toolbar position - position it beside the selected asset
      const canvasRect = canvas.getBoundingClientRect();
      setMiniToolbarPosition({
        x: canvasRect.left + (clickedAsset.position.x + clickedAsset.size.width + 10) * (canvasRect.width / canvas.width),
        y: canvasRect.top + (clickedAsset.position.y + clickedAsset.size.height / 2) * (canvasRect.height / canvas.height)
      });
    } else {
      setEditorState(prev => ({ ...prev, selectedAssetId: null, isDragging: false }));
      setMiniToolbarPosition(null);
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

      if (editorState.isDragging && editorState.selectedAssetId) {
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        updateComposition(prev => ({
      ...prev,
      assets: prev.assets.map(asset => 
        asset.id === editorState.selectedAssetId
          ? {
              ...asset,
              position: {
                x: Math.max(0, Math.min(prev.canvasSize.width - asset.size.width, x - editorState.dragOffset.x)),
                y: Math.max(0, Math.min(prev.canvasSize.height - asset.size.height, y - editorState.dragOffset.y))
              }
            }
          : asset
      ),
      lastModified: new Date()
    }));

        // Update mini toolbar position
        const selectedAsset = composition.assets.find(a => a.id === editorState.selectedAssetId);
        if (selectedAsset) {
          setMiniToolbarPosition({
            x: rect.left + (selectedAsset.position.x + selectedAsset.size.width / 2) * (rect.width / canvas.width),
            y: rect.top + (selectedAsset.position.y - 50) * (rect.height / canvas.height)
          });
        }
      }

      if (isResizing && editorState.selectedAssetId && initialResizeData) {
        const deltaX = e.clientX - initialResizeData.startX;
        const deltaY = e.clientY - initialResizeData.startY;

        let newWidth = initialResizeData.startWidth;
        let newHeight = initialResizeData.startHeight;
        let newX = initialResizeData.startPosX;
        let newY = initialResizeData.startPosY;

        switch (resizeHandle) {
          case 'se':
            newWidth = Math.max(20, initialResizeData.startWidth + deltaX);
            newHeight = Math.max(20, initialResizeData.startHeight + deltaY);
            break;
          case 'sw':
            newWidth = Math.max(20, initialResizeData.startWidth - deltaX);
            newHeight = Math.max(20, initialResizeData.startHeight + deltaY);
            newX = initialResizeData.startPosX + deltaX;
            break;
          case 'ne':
            newWidth = Math.max(20, initialResizeData.startWidth + deltaX);
            newHeight = Math.max(20, initialResizeData.startHeight - deltaY);
            newY = initialResizeData.startPosY + deltaY;
            break;
          case 'nw':
            newWidth = Math.max(20, initialResizeData.startWidth - deltaX);
            newHeight = Math.max(20, initialResizeData.startHeight - deltaY);
            newX = initialResizeData.startPosX + deltaX;
            newY = initialResizeData.startPosY + deltaY;
            break;
        }

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
      }
    };

    const handleGlobalMouseUp = () => {
      setEditorState(prev => ({ ...prev, isDragging: false, isResizing: false }));
      setIsResizing(false);
      setResizeHandle(null);
      setInitialResizeData(null);
    };

    if (editorState.isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [editorState.isDragging, editorState.selectedAssetId, editorState.dragOffset, isResizing, resizeHandle, initialResizeData, updateComposition, composition.assets]);

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

    // Export functionality with CORS-safe approach
  const exportComposition = async (format: 'png' | 'jpg' = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast({
        title: "Error al exportar",
        description: "Canvas no disponible",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, ensure the canvas is fully rendered
      renderCanvas();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Always try direct export first (like right-click save)
      console.log('Attempting direct canvas export...');
      
      try {
        const success = await new Promise<boolean>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              console.log('Canvas export successful using toBlob - matches right-click save');
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `${partnerName}_banner_${Date.now()}.${format}`;
              link.href = url;
              
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              // Clean up the object URL
              URL.revokeObjectURL(url);

              toast({
                title: "Banner exportado",
                description: `Banner descargado como ${format.toUpperCase()} con fondo completo`,
              });
              resolve(true);
            } else {
              console.log('Canvas toBlob returned null');
              resolve(false);
            }
          }, `image/${format === 'jpg' ? 'jpeg' : 'png'}`, 0.95);
        });
        
        if (success) {
          return;
        }
      } catch (exportError) {
        console.warn('Direct canvas export failed (canvas is tainted):', exportError);
      }
      
      // If toBlob failed, fall back to clean canvas approach
      console.log('Creating clean export canvas with brand background');
      
      // Create a completely clean canvas with safe elements only
      const exportCanvas = document.createElement('canvas');
      const exportCtx = exportCanvas.getContext('2d');
      
      if (!exportCtx) {
        throw new Error('Could not create export canvas context');
      }

      // Set canvas dimensions
      exportCanvas.width = composition.canvasSize.width;
      exportCanvas.height = composition.canvasSize.height;

      // Create a professional gradient background using brand colors
      const gradient = exportCtx.createLinearGradient(0, 0, exportCanvas.width, exportCanvas.height);
      gradient.addColorStop(0, brandGuidelines.secondaryColor || '#E9DEFF');
      gradient.addColorStop(0.6, brandGuidelines.mainColor || '#8A47F5');
      gradient.addColorStop(1, '#4C1D95'); // Darker shade for depth
      exportCtx.fillStyle = gradient;
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Add subtle pattern overlay for visual interest
      exportCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let i = 0; i < exportCanvas.width; i += 40) {
        for (let j = 0; j < exportCanvas.height; j += 40) {
          exportCtx.fillRect(i, j, 20, 20);
        }
      }

      // Add a soft overlay to ensure text readability
      exportCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Draw all assets
      for (const asset of composition.assets) {
        if (editingText === asset.id) continue;

        exportCtx.save();
        exportCtx.translate(asset.position.x + asset.size.width / 2, asset.position.y + asset.size.height / 2);
        exportCtx.rotate((asset.rotation * Math.PI) / 180);
        exportCtx.translate(-asset.size.width / 2, -asset.size.height / 2);

        if (asset.type === 'text' && asset.text) {
          // Draw text
          exportCtx.font = `${asset.fontWeight} ${asset.fontSize}px ${asset.fontFamily}`;
          exportCtx.fillStyle = asset.color || '#000000';
          exportCtx.textAlign = asset.textAlign as CanvasTextAlign || 'left';
          exportCtx.textBaseline = 'middle';
          
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
            
            exportCtx.fillText(line, x, y);
          });
        } else if (asset.type === 'cta' && asset.text) {
          // Draw CTA button
          const borderRadius = asset.borderRadius || 24;
          
          const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
            exportCtx.beginPath();
            exportCtx.moveTo(x + radius, y);
            exportCtx.lineTo(x + width - radius, y);
            exportCtx.quadraticCurveTo(x + width, y, x + width, y + radius);
            exportCtx.lineTo(x + width, y + height - radius);
            exportCtx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            exportCtx.lineTo(x + radius, y + height);
            exportCtx.quadraticCurveTo(x, y + height, x, y + height - radius);
            exportCtx.lineTo(x, y + radius);
            exportCtx.quadraticCurveTo(x, y, x + radius, y);
            exportCtx.closePath();
          };

          // Draw button background
          if (asset.backgroundColor) {
            exportCtx.fillStyle = asset.backgroundColor;
            drawRoundedRect(0, 0, asset.size.width, asset.size.height, borderRadius);
            exportCtx.fill();
          }

          // Draw button border
          if (asset.borderColor) {
            exportCtx.strokeStyle = asset.borderColor;
            exportCtx.lineWidth = asset.borderWidth || 2;
            drawRoundedRect(0, 0, asset.size.width, asset.size.height, borderRadius);
            exportCtx.stroke();
          }

          // Draw button text
          exportCtx.font = `${asset.fontWeight} ${asset.fontSize}px ${asset.fontFamily}`;
          exportCtx.fillStyle = asset.color || '#000000';
          exportCtx.textAlign = 'center';
          exportCtx.textBaseline = 'middle';
          
          const lines = asset.text.split('\n');
          const lineHeight = asset.fontSize! * 1.2;
          
          lines.forEach((line, index) => {
            const y = (asset.size.height / 2) + (index - (lines.length - 1) / 2) * lineHeight;
            exportCtx.fillText(line, asset.size.width / 2, y);
          });
        } else if (asset.type === 'logo') {
          // Draw professional logo placeholder
          exportCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          exportCtx.fillRect(0, 0, asset.size.width, asset.size.height);
          
          // Add subtle border
          exportCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          exportCtx.lineWidth = 2;
          exportCtx.strokeRect(1, 1, asset.size.width - 2, asset.size.height - 2);
          
          // Draw logo text
          exportCtx.fillStyle = brandGuidelines.mainColor || '#8A47F5';
          exportCtx.font = 'bold 16px Arial';
          exportCtx.textAlign = 'center';
          exportCtx.textBaseline = 'middle';
          exportCtx.fillText(partnerName.toUpperCase(), asset.size.width / 2, asset.size.height / 2);
        }

        exportCtx.restore();
      }

      // Export the canvas
      const exportMimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const dataUrl = exportCanvas.toDataURL(exportMimeType, 0.95);
      
      if (dataUrl === 'data:,' || dataUrl.length < 100) {
        throw new Error('Canvas appears to be empty');
      }
      
      const link = document.createElement('a');
      link.download = `${partnerName}_banner_${Date.now()}.${format}`;
      link.href = dataUrl;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Banner exportado",
        description: `Banner descargado como ${format.toUpperCase()} con fondo de marca`,
      });

    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar el banner. Intenta de nuevo.",
        variant: "destructive"
      });
    }
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
    <div className="h-screen flex flex-col bg-gray-50">
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
        
        <Button onClick={() => exportComposition('png')} variant="outline" className="rounded-full">
          <Download className="w-4 h-4 mr-2" />
          Descargar PNG
        </Button>
        <Button onClick={() => exportComposition('jpg')} variant="outline" className="rounded-full">
          <Download className="w-4 h-4 mr-2" />
          Descargar JPG
        </Button>
        <Button onClick={saveComposition} className="rounded-full" variant={hasUnsavedChanges ? "default" : "outline"}>
          <Save className="w-4 h-4 mr-2" />
          {hasUnsavedChanges ? "Guardar Cambios" : "Guardado"}
        </Button>
        {onExit && (
          <Button onClick={onExit} variant="outline" className="rounded-full">
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
              <SelectItem value={brandGuidelines.fontPrimary}>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">●</span>
                  {brandGuidelines.fontPrimary} (Principal)
                </div>
              </SelectItem>
              <SelectItem value={brandGuidelines.fontSecondary}>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">●</span>
                  {brandGuidelines.fontSecondary} (Secundaria)
                </div>
              </SelectItem>
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
                editorState.isDragging ? 'cursor-grabbing' : 'cursor-pointer'
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
                <input
                  ref={textInputRef}
                  type="text"
                  value={textEditValue}
                  onChange={(e) => setTextEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      finishTextEditing();
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
                  placeholder="Escribe tu texto..."
                />
              </div>
            )}

                        {/* Resize handles - aligned with selection border */}
            {selectedAsset && !editingText && (
              <>
                <div 
                  className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize pointer-events-auto hover:bg-blue-50" 
                  style={{ 
                    left: selectedAsset.position.x - 2 - 6, 
                    top: selectedAsset.position.y - 2 - 6 
                  }}
                  onMouseDown={(e) => handleResizeStart(e, 'nw')}
                />
                <div 
                  className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize pointer-events-auto hover:bg-blue-50" 
                  style={{ 
                    left: selectedAsset.position.x + selectedAsset.size.width + 2 - 6, 
                    top: selectedAsset.position.y - 2 - 6 
                  }}
                  onMouseDown={(e) => handleResizeStart(e, 'ne')}
                />
                <div 
                  className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize pointer-events-auto hover:bg-blue-50" 
                  style={{ 
                    left: selectedAsset.position.x - 2 - 6, 
                    top: selectedAsset.position.y + selectedAsset.size.height + 2 - 6 
                  }}
                  onMouseDown={(e) => handleResizeStart(e, 'sw')}
                />
                <div 
                  className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize pointer-events-auto hover:bg-blue-50" 
                  style={{ 
                    left: selectedAsset.position.x + selectedAsset.size.width + 2 - 6, 
                    top: selectedAsset.position.y + selectedAsset.size.height + 2 - 6 
                  }}
                  onMouseDown={(e) => handleResizeStart(e, 'se')}
                />
              </>
            )}
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
    </div>
  );
};

export default BannerEditor;