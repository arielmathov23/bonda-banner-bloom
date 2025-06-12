import React, { useState } from 'react';
import { Wand2, Download, ChevronLeft, ChevronRight, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { usePartners } from '@/hooks/usePartners';
import BannerFormInputs from '@/components/BannerFormInputs';
import { generateBannerImage, extractBrandColors, isOpenAIConfigured, getAPIKeyStatus, type BannerGenerationRequest, type GeneratedBanner } from '@/lib/openai';

interface BannerOption {
  id: string;
  desktopUrl: string;
  mobileUrl: string;
  style: string;
  copy: string;
  bannerType: string;
  flavor: string;
  prompt?: string;
}

interface SavedBanner {
  id: string;
  partnerId: string;
  partnerName: string;
  selectedOption: BannerOption;
  customCopy: string;
  createdAt: string;
}

interface BannerGenerationProps {
  preSelectedPartnerId?: string;
}

const BannerGeneration = ({ preSelectedPartnerId }: BannerGenerationProps) => {
  // Form state
  const [selectedPartnerId, setSelectedPartnerId] = useState(preSelectedPartnerId || '');
  const [bannerType, setBannerType] = useState('');
  const [promotionDiscount, setPromotionDiscount] = useState('');
  const [bannerCopy, setBannerCopy] = useState('');
  const [ctaCopy, setCtaCopy] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedOptions, setGeneratedOptions] = useState<BannerOption[]>([]);
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState<string>('');
  
  // Layout state
  const [savedBanners, setSavedBanners] = useState<SavedBanner[]>([]);

  const { partners, isLoading: partnersLoading } = usePartners();
  const selectedPartner = partners.find(p => p.id === selectedPartnerId);
  const currentOption = generatedOptions[currentOptionIndex];

  // Check if OpenAI API key is configured
  const openAIConfigured = isOpenAIConfigured();
  const apiKeyStatus = getAPIKeyStatus();

  const generateBannerOptions = async () => {
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

    if (!openAIConfigured) {
      console.log('API Key Status:', apiKeyStatus);
      toast({
        title: "Configuración faltante",
        description: apiKeyStatus.placeholder 
          ? "Reemplaza 'your_openai_api_key_here' con tu API key real de OpenAI"
          : "OpenAI API key no está configurada. Agrega tu API key al archivo .env.local",
        variant: "destructive"
      });
      return;
    }

    console.log('Starting banner generation with OpenAI API key:', apiKeyStatus.keyPreview);

    setIsGenerating(true);
    setProgress(0);
    setGenerationError(null);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      // Extract brand colors from partner URL
      let brandColors = {};
      if (selectedPartner?.partner_url) {
        try {
          brandColors = await extractBrandColors(selectedPartner.partner_url);
        } catch (error) {
          console.warn('Failed to extract brand colors, using defaults');
        }
      }

      // Prepare reference images
      const referenceImages: string[] = [];
      
      // Add partner logo
      if (selectedPartner?.logo_url) {
        referenceImages.push(selectedPartner.logo_url);
        console.log('Added partner logo:', selectedPartner.logo_url);
      }
      
      // Add reference banners based on selected style
      if (selectedStyle) {
        // If style is a partner banner ID
        if (selectedStyle.startsWith('partner-banner-') && selectedPartner?.reference_banners_urls) {
          const bannerIndex = parseInt(selectedStyle.replace('partner-banner-', ''));
          if (selectedPartner.reference_banners_urls[bannerIndex]) {
            referenceImages.push(selectedPartner.reference_banners_urls[bannerIndex]);
            console.log('Added selected partner banner:', selectedPartner.reference_banners_urls[bannerIndex]);
          }
        }
        // If style is a default style, add all partner reference banners
        else if (selectedPartner?.reference_banners_urls && selectedPartner.reference_banners_urls.length > 0) {
          referenceImages.push(...selectedPartner.reference_banners_urls.slice(0, 2));
          console.log('Added partner reference banners:', selectedPartner.reference_banners_urls.slice(0, 2));
        }
      }
      
      // Add product photos based on flavor selection
      if (selectedFlavor) {
        // If flavor is a partner product photo ID
        if (selectedFlavor.startsWith('partner-image-') && selectedPartner?.product_photos_urls) {
          const imageIndex = parseInt(selectedFlavor.replace('partner-image-', ''));
          if (selectedPartner.product_photos_urls[imageIndex]) {
            referenceImages.push(selectedPartner.product_photos_urls[imageIndex]);
            console.log('Added selected partner product photo:', selectedPartner.product_photos_urls[imageIndex]);
          }
        }
        // If flavor contains 'product' and we have partner product photos, add them
        else if (selectedFlavor.includes('product') && selectedPartner?.product_photos_urls && selectedPartner.product_photos_urls.length > 0) {
          referenceImages.push(...selectedPartner.product_photos_urls.slice(0, 2));
          console.log('Added partner product photos:', selectedPartner.product_photos_urls.slice(0, 2));
        }
      }

      console.log('Total reference images collected:', referenceImages.length, referenceImages);

      // Prepare benefits list
      const benefits = selectedPartner?.benefits_description 
        ? selectedPartner.benefits_description.split('; ').filter(b => b.trim())
        : [];

      // Create generation request with enhanced context
      const generationRequest: BannerGenerationRequest = {
        partnerName: selectedPartner?.name || '',
        partnerUrl: selectedPartner?.partner_url,
        benefits,
        promotionalText: bannerCopy,
        ctaText: ctaCopy,
        customPrompt: customPrompt,
        promotionDiscount: bannerType === 'promotion' ? promotionDiscount : undefined, // Include discount only for promotion banners
        brandColors,
        referenceImages,
        style: selectedStyle,
        aspectRatio: '3:2',
        // Enhanced context for comprehensive prompt generation
        partnerDescription: selectedPartner?.description,
        selectedBenefit: bannerType, // This is the selected benefit from the form
        hasLogo: !!selectedPartner?.logo_url,
        hasReferenceBanners: !!(selectedPartner?.reference_banners_urls && selectedPartner.reference_banners_urls.length > 0),
        hasProductPhotos: !!(selectedPartner?.product_photos_urls && selectedPartner.product_photos_urls.length > 0),
        referenceImageCount: referenceImages.length
      };

      console.log('Generating banner with request:', generationRequest);

      // Generate banner using OpenAI
      const result = await generateBannerImage(generationRequest);

      // Create banner option from result
      const bannerOption: BannerOption = {
        id: Date.now().toString(),
        desktopUrl: result.imageUrl,
        mobileUrl: result.imageUrl, // Same image for both, could be resized differently in future
        style: selectedStyle,
        copy: bannerCopy,
        bannerType: bannerType,
        flavor: selectedFlavor,
        prompt: result.prompt
      };

      setGeneratedOptions([bannerOption]);
      setCurrentOptionIndex(0);
      setHasGenerated(true);
      setProgress(100);
      setLastGeneratedPrompt(result.prompt || '');

      // Automatically save the banner
      const newBanner: SavedBanner = {
        id: bannerOption.id,
        partnerId: selectedPartner.id,
        partnerName: selectedPartner.name,
        selectedOption: bannerOption,
        customCopy: bannerCopy,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage
      try {
        const existingSaved = localStorage.getItem('savedBanners');
        const savedBannersArray = existingSaved ? JSON.parse(existingSaved) : [];
        const updatedBanners = [newBanner, ...savedBannersArray];
        localStorage.setItem('savedBanners', JSON.stringify(updatedBanners));
        setSavedBanners(prev => [newBanner, ...prev]);
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('bannerSaved'));
      } catch (error) {
        console.error('Failed to auto-save banner to localStorage:', error);
      }

      toast({
        title: "¡Banner generado y guardado!",
        description: `Banner para ${selectedPartner?.name} creado y guardado automáticamente`,
      });

    } catch (error) {
      console.error('Banner generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setGenerationError(errorMessage);
      
      toast({
        title: "Error al generar banner",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      clearInterval(progressInterval);
      setTimeout(() => setProgress(0), 2000); // Reset progress after delay
    }
  };

  const downloadBanner = (size: 'desktop' | 'mobile') => {
    if (!currentOption) return;
    
    const url = size === 'desktop' ? currentOption.desktopUrl : currentOption.mobileUrl;
    const dimensions = size === 'desktop' ? '1536x1024' : '1536x1024'; // 3:2 landscape format
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedPartner?.name || 'banner'}-${size}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Descarga iniciada",
      description: `Descargando banner ${size === 'desktop' ? 'escritorio' : 'móvil'} (${dimensions}px)`,
    });
  };

  const saveBanner = () => {
    if (!currentOption || !selectedPartner) return;

    const newBanner: SavedBanner = {
      id: Date.now().toString(),
      partnerId: selectedPartner.id,
      partnerName: selectedPartner.name,
      selectedOption: currentOption,
      customCopy: bannerCopy,
      createdAt: new Date().toISOString()
    };

    // Save to localStorage
    try {
      const existingSaved = localStorage.getItem('savedBanners');
      const savedBannersArray = existingSaved ? JSON.parse(existingSaved) : [];
      const updatedBanners = [newBanner, ...savedBannersArray];
      localStorage.setItem('savedBanners', JSON.stringify(updatedBanners));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('bannerSaved'));
    } catch (error) {
      console.error('Failed to save banner to localStorage:', error);
    }

    setSavedBanners(prev => [newBanner, ...prev]);

    toast({
      title: "¡Banner guardado!",
      description: `Banner para ${selectedPartner.name} ha sido guardado en tus proyectos`,
    });
  };

  const resetForm = () => {
    setSelectedPartnerId('');
    setBannerType('');
    setPromotionDiscount('');
    setBannerCopy('');
    setCtaCopy('');
    setCustomPrompt('');
    setSelectedStyle('');
    setSelectedFlavor('');
    setGeneratedOptions([]);
    setHasGenerated(false);
    setCurrentOptionIndex(0);
    setGenerationError(null);
    setLastGeneratedPrompt('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 bg-gray-50">
      {/* API Configuration Warning */}
      {!openAIConfigured && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Configuración requerida</AlertTitle>
            <AlertDescription>
              {apiKeyStatus.placeholder ? (
                <>
                  Reemplaza el placeholder en .env.local con tu API key real:
                  <br />
                  <code className="text-xs bg-red-100 px-1 py-0.5 rounded mt-1 block">
                    VITE_OPENAI_API_KEY=sk-tu_api_key_real_aqui
                  </code>
                </>
              ) : (
                <>
                  Para usar la generación de banners AI, agrega tu OpenAI API key en el archivo .env.local:
                  <br />
                  <code className="text-xs bg-red-100 px-1 py-0.5 rounded mt-1 block">
                    VITE_OPENAI_API_KEY=sk-tu_api_key_aqui
                  </code>
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Debug Info for Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50 max-w-md">
          <Alert>
            <AlertTitle>Debug Info</AlertTitle>
            <AlertDescription className="text-xs max-h-40 overflow-y-auto">
              API Key: {apiKeyStatus.configured ? (apiKeyStatus.placeholder ? '❌ Placeholder' : '✅ Configured') : '❌ Missing'}
              <br />
              Preview: {apiKeyStatus.keyPreview || 'N/A'}
              {selectedPartner && (
                <>
                  <br />
                  Partner: {selectedPartner.name}
                  <br />
                  Logo: {selectedPartner.logo_url ? '✅' : '❌'}
                  <br />
                  Ref Banners: {selectedPartner.reference_banners_urls?.length || 0}
                  <br />
                  Product Photos: {selectedPartner.product_photos_urls?.length || 0}
                  <br />
                  Style: {selectedStyle || 'None'}
                  <br />
                  Flavor: {selectedFlavor || 'None'}
                  <br />
                  Custom Prompt: {customPrompt ? '✅' : '❌'}
                </>
              )}
              {hasGenerated && currentOption && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    View Generated Prompt
                  </summary>
                  <div className="mt-1 p-2 bg-gray-100 rounded text-xs max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {/* Show the prompt that was used for generation */}
                    {lastGeneratedPrompt}
                  </div>
                </details>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Generation Error Alert */}
      {generationError && (
        <div className="fixed top-20 right-4 z-50 max-w-md">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error de generación</AlertTitle>
            <AlertDescription>{generationError}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Left Column - Configuration (when generated) or Full Form (when not generated) */}
      <div className={`transition-all duration-300 ${hasGenerated ? 'w-80' : 'w-full'} flex-shrink-0`}>
        {hasGenerated ? (
          <div className="space-y-4 h-full overflow-y-auto">
            {/* Banner Configuration - Made smaller */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-gray-700">Configuración</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetForm} className="rounded-lg border-gray-200 hover:bg-gray-50 text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Nuevo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-3 space-y-3 text-xs">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="font-semibold text-gray-600">Socio</span>
                      <p className="text-gray-800 font-medium">{selectedPartner?.name}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-gray-600">Beneficio</span>
                      <p className="text-gray-800 font-medium">{bannerType}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-gray-600">Estilo</span>
                      <p className="text-gray-800 font-medium">{selectedStyle}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <span className="font-semibold text-gray-600">Texto del Banner</span>
                    <p className="text-gray-800 font-medium mt-1">"{bannerCopy}"</p>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <span className="font-semibold text-gray-600">CTA</span>
                    <p className="text-gray-800 font-medium mt-1">"{ctaCopy}"</p>
                  </div>
                  {customPrompt && (
                    <div className="border-t border-gray-200 pt-3">
                      <span className="font-semibold text-gray-600">Instrucciones Adicionales</span>
                      <p className="text-gray-800 font-medium mt-1">"{customPrompt}"</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full">
          <BannerFormInputs
            selectedPartnerId={selectedPartnerId}
            setSelectedPartnerId={setSelectedPartnerId}
            bannerType={bannerType}
            setBannerType={setBannerType}
            promotionDiscount={promotionDiscount}
            setPromotionDiscount={setPromotionDiscount}
            bannerCopy={bannerCopy}
            setBannerCopy={setBannerCopy}
            ctaCopy={ctaCopy}
            setCtaCopy={setCtaCopy}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
            selectedStyle={selectedStyle}
            setSelectedStyle={setSelectedStyle}
            selectedFlavor={selectedFlavor}
            setSelectedFlavor={setSelectedFlavor}
            partners={partners}
            partnersLoading={partnersLoading}
            selectedPartner={selectedPartner}
            isGenerating={isGenerating}
            progress={progress}
            onGenerate={generateBannerOptions}
          />
          </div>
        )}
      </div>

      {/* Right Column - Generated Banners (only when generated) */}
      {hasGenerated && (
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Banner Preview with Tabs */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl flex-1">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Wand2 className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-700">Banner Generado con AI</CardTitle>
                </div>
                {generatedOptions.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentOptionIndex(Math.max(0, currentOptionIndex - 1))}
                      disabled={currentOptionIndex === 0}
                      className="rounded-lg"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium px-3 text-gray-600">
                      {currentOptionIndex + 1} de {generatedOptions.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentOptionIndex(Math.min(generatedOptions.length - 1, currentOptionIndex + 1))}
                      disabled={currentOptionIndex === generatedOptions.length - 1}
                      className="rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6 pt-0 flex-1">
              <Tabs defaultValue="desktop" className="w-full h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="desktop" className="text-gray-600">Escritorio</TabsTrigger>
                  <TabsTrigger value="mobile" className="text-gray-600">Móvil</TabsTrigger>
                </TabsList>
                
                <div className="flex-1 flex flex-col">
                  <TabsContent value="desktop" className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-600">Versión Escritorio</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">1536×1024px (3:2)</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex-1 flex items-center justify-center">
                      <img
                        src={currentOption?.desktopUrl}
                        alt="Banner Escritorio"
                        className="w-full rounded-lg border border-gray-200 shadow-sm max-h-full object-contain"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="mobile" className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-600">Versión Móvil</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">1536×1024px (3:2)</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex-1 flex items-center justify-center">
                      <img
                        src={currentOption?.mobileUrl}
                        alt="Banner Móvil"
                        className="w-full max-w-sm rounded-lg border border-gray-200 shadow-sm max-h-full object-contain"
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => downloadBanner('desktop')}
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl flex-1"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Escritorio
                </Button>
                <Button
                  onClick={() => downloadBanner('mobile')}
                  className="bg-green-600 hover:bg-green-700 rounded-xl flex-1"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Móvil
                </Button>
                <Button
                  onClick={() => toast({
                    title: "Banner ya guardado",
                    description: "Este banner se guardó automáticamente al generarse",
                  })}
                  className="bg-green-600 hover:bg-green-700 rounded-xl"
                  size="lg"
                  disabled={true}
                >
                  ✓ Guardado
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BannerGeneration;
