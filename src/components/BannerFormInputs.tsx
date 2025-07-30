import React from 'react';
import { Wand2, Loader } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Partner {
  id: string;
  name: string;
  partner_url?: string;
  benefits_description?: string;
  description?: string;
  reference_banners_urls?: string[];
  product_photos_urls?: string[];
  status: string;
}

interface BannerFormInputsProps {
  selectedPartnerId: string;
  setSelectedPartnerId: (value: string) => void;
  bannerType: string;
  setBannerType: (value: string) => void;
  promotionDiscount: string;
  setPromotionDiscount: (value: string) => void;
  bannerCopy: string;
  setBannerCopy: (value: string) => void;
  ctaCopy: string;
  setCtaCopy: (value: string) => void;
  customPrompt: string;
  setCustomPrompt: (value: string) => void;
  selectedStyle: string;
  setSelectedStyle: (value: string) => void;
  selectedFlavor: string;
  setSelectedFlavor: (value: string) => void;
  aiService: 'openai' | 'flux';
  setAiService: (value: 'openai' | 'flux') => void;
  partners: Partner[];
  partnersLoading: boolean;
  selectedPartner?: Partner;
  isGenerating: boolean;
  isFraming?: boolean;
  progress: number;
  progressStatus?: string;
  onGenerate: () => void;
}

const defaultStyleReferences = {
  'audaz-y-dinamico': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
  'minimalista': 'https://images.unsplash.com/photo-1483058712412-4245e9b90334',
  'vibrante': 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07'
};

const defaultProductImages = [
  {
    id: 'product-1',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
    title: 'Producto 1'
  },
  {
    id: 'product-2',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
    title: 'Producto 2'
  },
  {
    id: 'product-3',
    url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f',
    title: 'Producto 3'
  }
];

const BannerFormInputs = ({
  selectedPartnerId,
  setSelectedPartnerId,
  bannerType,
  setBannerType,
  promotionDiscount,
  setPromotionDiscount,
  bannerCopy,
  setBannerCopy,
  ctaCopy,
  setCtaCopy,
  customPrompt,
  setCustomPrompt,
  selectedStyle,
  setSelectedStyle,
  selectedFlavor,
  setSelectedFlavor,
  aiService,
  setAiService,
  partners,
  partnersLoading,
  selectedPartner,
  isGenerating,
  isFraming = false,
  progress,
  progressStatus,
  onGenerate,
}: BannerFormInputsProps) => {
  const [selectedReferenceImage, setSelectedReferenceImage] = React.useState('');

  // Get partner benefits
  const getPartnerBenefits = () => {
    if (!selectedPartner?.benefits_description) return [];
    return selectedPartner.benefits_description.split('; ').filter(benefit => benefit.trim());
  };

  // Get partner reference banners for style selection
  const getPartnerReferenceBanners = () => {
    if (!selectedPartner?.reference_banners_urls || selectedPartner.reference_banners_urls.length === 0) {
      return Object.entries(defaultStyleReferences).map(([key, url]) => ({
        id: key,
        url,
        title: key === 'audaz-y-dinamico' ? '🔥 Audaz y Dinámico' : 
              key === 'minimalista' ? '✨ Minimalista' : 
              '🌈 Vibrante'
      }));
    }
    
    return selectedPartner.reference_banners_urls.map((url, index) => ({
      id: `partner-banner-${index}`,
      url,
      title: `Banner ${index + 1}`
    }));
  };

  // Get partner reference images for image type selection
  const getPartnerReferenceImages = () => {
    if (!selectedPartner?.product_photos_urls || selectedPartner.product_photos_urls.length === 0) {
      // Return default product photo options when no custom photos are available
      return defaultProductImages;
    }
    
    return selectedPartner.product_photos_urls.map((url, index) => ({
      id: `partner-image-${index}`,
      url,
      title: `Producto ${index + 1}`
    }));
  };

  const partnerBenefits = getPartnerBenefits();
  const partnerReferenceBanners = getPartnerReferenceBanners();
  const partnerReferenceImages = getPartnerReferenceImages();

  return (
    <Card className="bg-white border border-gray-200 shadow-sm max-w-4xl mx-auto">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-brand-500 rounded-xl flex items-center justify-center shadow-lg">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Crear Banner Personalizado</CardTitle>
            <CardDescription className="text-gray-600">Configura tu banner con IA generativa</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      {/* Form Content */}
      <CardContent className="space-y-8">
        
        {/* Step 1: Partner & Benefit Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
            <h2 className="text-lg font-semibold text-gray-900">Información Básica</h2>
          </div>
          
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Partner Selection */}
            <div className="space-y-2">
              <Label htmlFor="partner" className="text-sm font-medium text-gray-700">Partner *</Label>
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-200">
                  <SelectValue placeholder={partnersLoading ? "Cargando..." : "Selecciona un partner"} />
            </SelectTrigger>
            <SelectContent>
              {partners.map((partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                    {partner.name}
                        <Badge variant="secondary" className="text-xs ml-auto">
                      {partner.status === 'active' ? 'Activo' : partner.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

            {/* Benefit Selection */}
        {selectedPartnerId && (
              <div className="space-y-2">
                <Label htmlFor="benefit" className="text-sm font-medium text-gray-700">Beneficio a destacar *</Label>
            {partnerBenefits.length > 0 ? (
              <Select value={bannerType} onValueChange={setBannerType}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-200">
                      <SelectValue placeholder="Selecciona el beneficio" />
                </SelectTrigger>
                    <SelectContent className="max-w-[400px]">
                  {partnerBenefits.map((benefit, index) => (
                        <SelectItem key={index} value={benefit} className="whitespace-normal text-wrap">
                          <div className="py-1 leading-5 break-words max-w-[350px]">
                        {benefit}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">Este partner no tiene beneficios configurados.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Conditional Discount */}
          {bannerType === 'promotion' && (
            <div className="space-y-2">
              <Label htmlFor="discount" className="text-sm font-medium text-gray-700">
                Porcentaje de Descuento *
              </Label>
              <div className="relative">
            <Input
              id="discount"
              type="number"
                  min="0"
                  max="100"
              value={promotionDiscount}
              onChange={(e) => setPromotionDiscount(e.target.value)}
                  placeholder="ej. 20"
                  className="border-orange-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-orange-600 font-bold">%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">El descuento se mostrará prominentemente en el banner</p>
            </div>
          )}
        </div>

        {/* Step 2: Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
            <h2 className="text-lg font-semibold text-gray-900">Contenido del Banner</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Banner Copy */}
            <div className="space-y-2">
              <Label htmlFor="bannerCopy" className="text-sm font-medium text-gray-700">Texto Principal *</Label>
          <Textarea
            id="bannerCopy"
            value={bannerCopy}
            onChange={(e) => setBannerCopy(e.target.value)}
            placeholder="ej. Descubre productos para tu hogar"
            maxLength={28}
                className={`min-h-[80px] resize-none ${
                  bannerCopy.length >= 28 ? 'border-red-500 focus:border-red-500' :
                  bannerCopy.length >= 24 ? 'border-orange-400 focus:border-orange-400' :
                  'border-gray-200 focus:border-violet-400'
                } focus:ring-1 focus:ring-violet-200`}
          />
          <div className={`text-xs text-right flex items-center justify-between ${
            bannerCopy.length >= 28 ? 'text-red-600' :
            bannerCopy.length >= 24 ? 'text-orange-600' :
            'text-gray-500'
          }`}>
            {bannerCopy.length >= 28 && (
              <span className="text-red-600 text-xs">⚠️ Límite alcanzado</span>
            )}
            {bannerCopy.length >= 24 && bannerCopy.length < 28 && (
              <span className="text-orange-600 text-xs">⚠️ Cerca del límite</span>
            )}
            <span>{bannerCopy.length}/28</span>
          </div>
        </div>

        {/* CTA Copy */}
            <div className="space-y-2">
          <Label htmlFor="ctaCopy" className="text-sm font-medium text-gray-700">Texto del Botón (CTA) *</Label>
          <Input
            id="ctaCopy"
            value={ctaCopy}
            onChange={(e) => setCtaCopy(e.target.value)}
            placeholder="ej. Comprar Ahora"
            maxLength={14}
                className={`h-11 ${
                  ctaCopy.length >= 14 ? 'border-red-500 focus:border-red-500' :
                  ctaCopy.length >= 12 ? 'border-orange-400 focus:border-orange-400' :
                  'border-gray-200 focus:border-violet-400'
                } focus:ring-1 focus:ring-violet-200`}
          />
          <div className={`text-xs text-right flex items-center justify-between ${
            ctaCopy.length >= 14 ? 'text-red-600' :
            ctaCopy.length >= 12 ? 'text-orange-600' :
            'text-gray-500'
          }`}>
            {ctaCopy.length >= 14 && (
              <span className="text-red-600 text-xs">⚠️ Límite alcanzado</span>
            )}
            {ctaCopy.length >= 12 && ctaCopy.length < 14 && (
              <span className="text-orange-600 text-xs">⚠️ Cerca del límite</span>
            )}
            <span>{ctaCopy.length}/14</span>
          </div>
            </div>
          </div>

          {/* Discount Offer */}
          <div className="space-y-2">
            <Label htmlFor="discount" className="text-sm font-medium text-gray-700">
              Porcentaje de Descuento
            </Label>
            <div className="relative">
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={promotionDiscount}
                onChange={(e) => setPromotionDiscount(e.target.value)}
                placeholder="ej. 20"
                className="border-orange-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-orange-600 font-bold">%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">El descuento se mostrará prominentemente en el banner</p>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="customPrompt" className="text-sm font-medium text-gray-700">
              Instrucciones Adicionales <span className="text-xs font-normal text-gray-500">(opcional)</span>
            </Label>
            <Textarea
              id="customPrompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="ej. Hazlo más moderno, usa colores vibrantes, incluye elementos tech..."
              maxLength={200}
              className="min-h-[60px] resize-none border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Instrucciones específicas para personalizar el diseño</div>
              <div className="text-xs text-gray-500">{customPrompt.length}/200</div>
            </div>
          </div>
        </div>

        {/* Step 3: Visual Style */}
        {selectedPartnerId && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <h2 className="text-lg font-semibold text-gray-900">Estilo Visual</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {partnerReferenceBanners.map((banner) => (
                <div
                  key={banner.id}
                  className={`cursor-pointer rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                    selectedStyle === banner.id 
                      ? 'border-violet-500 ring-2 ring-violet-200 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedStyle(selectedStyle === banner.id ? '' : banner.id)}
                >
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={banner.url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-xs font-medium text-gray-700 text-center">{banner.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Image Type */}
        {selectedPartnerId && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
              <h2 className="text-lg font-semibold text-gray-900">Tipo de Imagen</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {partnerReferenceImages.map((image) => (
                <div
                  key={image.id}
                  className={`cursor-pointer rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                    selectedFlavor === image.id 
                      ? 'border-violet-500 ring-2 ring-violet-200 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedFlavor(selectedFlavor === image.id ? '' : image.id)}
                >
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-xs font-medium text-gray-700 text-center">{image.title}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {partnerReferenceImages.length === 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">Este partner no tiene fotos de producto. Se usarán imágenes por defecto.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Generation Progress */}
        {(isGenerating || isFraming) && (
          <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
            <div className="flex items-center gap-3 mb-3">
              <Loader className="w-5 h-5 animate-spin text-violet-600" />
              <span className="font-medium text-violet-900">
                {progressStatus || (isFraming ? 'Creando marco 4:1 con gradiente...' : `Generando tu banner con ${aiService.toUpperCase()}...`)}
              </span>
            </div>
            <Progress value={progress} className="w-full h-3 mb-2" />
            <p className="text-sm text-violet-700">
              {isFraming 
                ? 'Extrayendo colores dominantes y aplicando gradiente de extensión para formato 4:1...' 
                : (aiService === 'flux' 
                ? 'Flux está procesando tu banner. Esto puede tomar hasta 1 minuto...' 
                : 'Esto puede tomar unos segundos. ¡Tu banner estará listo pronto!'
                )
              }
            </p>
          </div>
        )}

        {/* AI Service Toggle */}
        <div className="pt-4 border-t border-gray-100">
          <div className="mb-6">
            <div className="text-center mb-4">
              <Label className="text-lg font-semibold text-gray-900">Selecciona el Motor de IA</Label>
              <p className="text-sm text-gray-600 mt-1">Elige qué servicio de inteligencia artificial usar para generar tu banner</p>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <div 
                onClick={() => setAiService('openai')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                  aiService === 'openai' 
                    ? 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200' 
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <div className="flex flex-col items-center gap-3 min-w-[140px]">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900">OpenAI GPT</h3>
                    <p className="text-xs text-gray-600 mt-1">Rápido y confiable</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Popular
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setAiService('flux')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                  aiService === 'flux' 
                    ? 'border-purple-500 bg-purple-50 shadow-lg ring-2 ring-purple-200' 
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="flex flex-col items-center gap-3 min-w-[140px]">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900">Flux Kontext Pro</h3>
                    <p className="text-xs text-gray-600 mt-1">Última generación</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        ⚡ Nuevo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={onGenerate}
            disabled={isGenerating || !selectedPartnerId || !bannerType || !bannerCopy || !ctaCopy}
            className="w-full bg-gradient-to-r from-violet-600 to-brand-600 hover:from-violet-700 hover:to-brand-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 h-12"
          >
            {isGenerating ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Generando Banner...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Generar Banner con IA
              </>
            )}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
};

export default BannerFormInputs;
