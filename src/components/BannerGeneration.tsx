import React, { useState } from 'react';
import { Wand2, Download, ChevronLeft, ChevronRight, RefreshCw, Sparkles, Menu } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { usePartners } from '@/hooks/usePartners';
import BannerFormInputs from '@/components/BannerFormInputs';

interface BannerOption {
  id: string;
  desktopUrl: string;
  mobileUrl: string;
  style: string;
  copy: string;
  bannerType: string;
  flavor: string;
}

interface GeneratedBanner {
  id: string;
  partnerId: string;
  partnerName: string;
  selectedOption: BannerOption;
  customCopy: string;
  createdAt: string;
}

const BannerGeneration = () => {
  // Form state
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [bannerType, setBannerType] = useState('');
  const [promotionDiscount, setPromotionDiscount] = useState('');
  const [bannerCopy, setBannerCopy] = useState('');
  const [ctaCopy, setCtaCopy] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedOptions, setGeneratedOptions] = useState<BannerOption[]>([]);
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  // Layout state
  const [savedBanners, setSavedBanners] = useState<GeneratedBanner[]>([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const { partners, isLoading: partnersLoading } = usePartners();
  const selectedPartner = partners.find(p => p.id === selectedPartnerId);
  const currentOption = generatedOptions[currentOptionIndex];

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
    if (!currentOption) return;
    
    const url = size === 'desktop' ? currentOption.desktopUrl : currentOption.mobileUrl;
    const dimensions = size === 'desktop' ? '1440x338' : '984x450';
    
    toast({
      title: "Descarga iniciada",
      description: `Descargando banner ${size === 'desktop' ? 'escritorio' : 'móvil'} (${dimensions}px)`,
    });
  };

  const saveBanner = () => {
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

  const resetForm = () => {
    setSelectedPartnerId('');
    setBannerType('');
    setPromotionDiscount('');
    setBannerCopy('');
    setCtaCopy('');
    setSelectedStyle('');
    setSelectedFlavor('');
    setGeneratedOptions([]);
    setHasGenerated(false);
    setCurrentOptionIndex(0);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-8 p-8 bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Menu Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSidebarExpanded(!sidebarExpanded)}
        className="fixed top-20 left-4 z-50 bg-white shadow-lg border-gray-200 hover:bg-gray-50"
      >
        <Menu className="w-4 h-4" />
      </Button>

      {/* Left Column - Configuration (when generated) or Full Form (when not generated) */}
      <div className={`transition-all duration-300 ${hasGenerated ? (sidebarExpanded ? 'w-80' : 'w-0 opacity-0') : 'w-full max-w-4xl mx-auto'} flex-shrink-0 ${hasGenerated && !sidebarExpanded ? 'hidden' : ''}`}>
        {hasGenerated ? (
          <div className="space-y-4">
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
                      <span className="font-semibold text-gray-600">Tipo</span>
                      <p className="text-gray-800 font-medium">
                        {bannerType === 'promotion' ? 'Promocional' : 'General'}
                        {bannerType === 'promotion' && ` (${promotionDiscount}% desc)`}
                      </p>
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
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
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
        )}
      </div>

      {/* Right Column - Generated Banners (only when generated) OR Placeholder */}
      {hasGenerated ? (
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Banner Preview with Tabs */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl flex-1">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Wand2 className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-700">Banner Generado</CardTitle>
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
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">1440×338px</span>
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
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">984×450px</span>
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
                  onClick={saveBanner}
                  className="bg-purple-600 hover:bg-purple-700 rounded-xl"
                  size="lg"
                >
                  Guardar Proyecto
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Banner Placeholder Preview */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl flex-1">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-700">Vista Previa del Banner</CardTitle>
              </div>
              <CardDescription className="text-gray-500">
                Completa el formulario y genera tu banner para ver el resultado aquí
              </CardDescription>
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
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">1440×338px</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex-1 flex items-center justify-center">
                      <img
                        src="/lovable-uploads/9de34faa-a26b-487a-b40b-31f1abdf5636.png"
                        alt="Placeholder Banner Escritorio"
                        className="w-full rounded-lg border border-gray-200 shadow-sm max-h-full object-contain"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="mobile" className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-600">Versión Móvil</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">984×450px</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex-1 flex items-center justify-center">
                      <img
                        src="/lovable-uploads/9de34faa-a26b-487a-b40b-31f1abdf5636.png"
                        alt="Placeholder Banner Móvil"
                        className="w-full max-w-sm rounded-lg border border-gray-200 shadow-sm max-h-full object-contain"
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BannerGeneration;
