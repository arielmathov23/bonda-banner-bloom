
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { BannerOption, GeneratedBanner, Partner } from '@/components/banner/types';

export const useBannerGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedOptions, setGeneratedOptions] = useState<BannerOption[]>([]);
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [savedBanners, setSavedBanners] = useState<GeneratedBanner[]>([]);

  const generateBannerOptions = async (
    selectedPartnerId: string,
    bannerType: string,
    promotionDiscount: string,
    bannerCopy: string,
    ctaCopy: string,
    selectedStyle: string,
    selectedFlavor: string,
    selectedPartner: Partner | undefined
  ) => {
    if (!selectedPartnerId || !bannerType || !bannerCopy || !ctaCopy || !selectedStyle || !selectedFlavor) {
      toast({
        title: "Información faltante",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    if (bannerType === 'promotion' && !promotionDiscount) {
      toast({
        title: "Descuento faltante",
        description: "Por favor ingresa el porcentaje de descuento de la promoción",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 15;
      });
    }, 200);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const bannerStyles = ['Audaz y Dinámico', 'Minimalista', 'Vibrante'];
      const bannerFlavors = ['Contextual', 'Foto de Producto'];
      
      const styleDescription = bannerStyles.find(s => s.toLowerCase().replace(/\s+/g, '-').replace('&', '').replace(/--/g, '-') === selectedStyle) || selectedStyle;
      const flavorDescription = bannerFlavors.find(f => f.toLowerCase().replace(/\s+/g, '-') === selectedFlavor) || selectedFlavor;
      const typeDescription = bannerType === 'promotion' ? `promoción con ${promotionDiscount}% descuento` : 'general';
      
      console.log(`AI Prompt: Crear un banner ${styleDescription} para ${selectedPartner?.name} con imágenes ${flavorDescription}. Tipo de banner: ${typeDescription}. Texto: "${bannerCopy}" CTA: "${ctaCopy}"`);

      const option: BannerOption = {
        id: '1',
        desktopUrl: `https://via.placeholder.com/720x169/4A90E2/FFFFFF?text=${encodeURIComponent(`${selectedPartner?.name || ''} - ${styleDescription} - ${bannerCopy.substring(0, 20)}...`)}`,
        mobileUrl: `https://via.placeholder.com/492x225/4A90E2/FFFFFF?text=${encodeURIComponent(`${selectedPartner?.name || ''} - Mobile`)}`,
        style: styleDescription,
        copy: bannerCopy,
        bannerType: typeDescription,
        flavor: flavorDescription
      };

      setGeneratedOptions([option]);
      setCurrentOptionIndex(0);
      setHasGenerated(true);

      toast({
        title: "¡Banner generado!",
        description: `Banner creado para ${selectedPartner?.name} con tus especificaciones`,
      });

    } catch (error) {
      toast({
        title: "Falló la generación",
        description: "Por favor intenta nuevamente más tarde",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
      clearInterval(interval);
    }
  };

  const downloadBanner = (size: 'desktop' | 'mobile') => {
    const currentOption = generatedOptions[currentOptionIndex];
    if (!currentOption) return;
    
    const url = size === 'desktop' ? currentOption.desktopUrl : currentOption.mobileUrl;
    const dimensions = size === 'desktop' ? '1440x338' : '984x450';
    
    toast({
      title: "Descarga iniciada",
      description: `Descargando banner ${size === 'desktop' ? 'escritorio' : 'móvil'} (${dimensions}px)`,
    });
  };

  const saveBanner = (bannerCopy: string, selectedPartner: Partner | undefined) => {
    const currentOption = generatedOptions[currentOptionIndex];
    if (!currentOption || !selectedPartner) return;

    const newBanner: GeneratedBanner = {
      id: Date.now().toString(),
      partnerId: selectedPartner.id,
      partnerName: selectedPartner.name,
      selectedOption: currentOption,
      customCopy: bannerCopy,
      createdAt: new Date().toISOString()
    };

    setSavedBanners(prev => [newBanner, ...prev]);

    toast({
      title: "¡Banner guardado!",
      description: `Banner para ${selectedPartner.name} ha sido guardado en tus proyectos`,
    });
  };

  const nextOption = () => {
    setCurrentOptionIndex(Math.min(generatedOptions.length - 1, currentOptionIndex + 1));
  };

  const previousOption = () => {
    setCurrentOptionIndex(Math.max(0, currentOptionIndex - 1));
  };

  const resetForm = () => {
    setGeneratedOptions([]);
    setHasGenerated(false);
    setCurrentOptionIndex(0);
  };

  return {
    isGenerating,
    progress,
    generatedOptions,
    currentOptionIndex,
    hasGenerated,
    savedBanners,
    generateBannerOptions,
    downloadBanner,
    saveBanner,
    nextOption,
    previousOption,
    resetForm,
  };
};
