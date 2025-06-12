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
  partners: Partner[];
  partnersLoading: boolean;
  selectedPartner?: Partner;
  isGenerating: boolean;
  progress: number;
  onGenerate: () => void;
}

const defaultStyleReferences = {
  'audaz-y-dinamico': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
  'minimalista': 'https://images.unsplash.com/photo-1483058712412-4245e9b90334',
  'vibrante': 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07'
};

const defaultFlavorReferences = {
  'contextual': [
    {
      id: 'contextual-1',
      url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d',
      title: 'Tienda moderna'
    },
    {
      id: 'contextual-2', 
      url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
      title: 'Ambiente comercial'
    },
    {
      id: 'contextual-3',
      url: 'https://images.unsplash.com/photo-1555529902-6d31ec0be7a9',
      title: 'Espacio de compras'
    }
  ],
  'foto-de-producto': [
    {
      id: 'product-1',
      url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      title: 'Producto destacado'
    },
    {
      id: 'product-2',
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      title: 'Producto premium'
    },
    {
      id: 'product-3',
      url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f',
      title: 'Producto elegante'
    }
  ]
};

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
  partners,
  partnersLoading,
  selectedPartner,
  isGenerating,
  progress,
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
      return defaultFlavorReferences['foto-de-producto'] || [];
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
        {bannerType && bannerType.toLowerCase().includes('descuento') && (
            <div className="max-w-xs">
            <Label htmlFor="discount" className="text-sm font-medium text-gray-700">Porcentaje de Descuento *</Label>
              <div className="relative mt-2">
            <Input
              id="discount"
              type="number"
              min="1"
              max="99"
              value={promotionDiscount}
              onChange={(e) => setPromotionDiscount(e.target.value)}
                  placeholder="25"
                  className="h-11 border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-200 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
              </div>
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
            placeholder="ej. Descubre los mejores productos para tu hogar"
            maxLength={150}
                className="min-h-[80px] resize-none border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
          />
          <div className="text-xs text-gray-500 text-right">{bannerCopy.length}/150</div>
        </div>

        {/* CTA Copy */}
            <div className="space-y-2">
          <Label htmlFor="ctaCopy" className="text-sm font-medium text-gray-700">Texto del Botón (CTA) *</Label>
          <Input
            id="ctaCopy"
            value={ctaCopy}
            onChange={(e) => setCtaCopy(e.target.value)}
            placeholder="ej. Comprar Ahora"
            maxLength={25}
                className="h-11 border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
          />
          <div className="text-xs text-gray-500 text-right">{ctaCopy.length}/25</div>
            </div>
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
                  onClick={() => setSelectedStyle(banner.id)}
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
                  onClick={() => setSelectedFlavor(image.id)}
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
        {isGenerating && (
          <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
            <div className="flex items-center gap-3 mb-3">
              <Loader className="w-5 h-5 animate-spin text-violet-600" />
              <span className="font-medium text-violet-900">Generando tu banner personalizado...</span>
            </div>
            <Progress value={progress} className="w-full h-3 mb-2" />
            <p className="text-sm text-violet-700">Esto puede tomar unos segundos. ¡Tu banner estará listo pronto!</p>
          </div>
        )}

        {/* Generate Button */}
        <div className="pt-4 border-t border-gray-100">
        <Button
          onClick={onGenerate}
            disabled={isGenerating || !selectedPartnerId || !bannerType || !bannerCopy || !ctaCopy || !selectedStyle || !selectedFlavor}
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
