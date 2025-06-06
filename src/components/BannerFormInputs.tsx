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
    if (!selectedPartner?.reference_banners_urls || selectedPartner.reference_banners_urls.length === 0) {
      return [];
    }
    
    return selectedPartner.reference_banners_urls.map((url, index) => ({
      id: `partner-image-${index}`,
      url,
      title: `Referencia ${index + 1}`
    }));
  };

  const partnerBenefits = getPartnerBenefits();
  const partnerReferenceBanners = getPartnerReferenceBanners();
  const partnerReferenceImages = getPartnerReferenceImages();

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-xl max-w-xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-gray-700">Crear Banner Personalizado</CardTitle>
            <CardDescription className="text-sm text-gray-600">Configura tu banner con IA generativa</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 p-4 pt-0">
        
        {/* Partner Selection */}
        <div className="space-y-1.5">
          <Label htmlFor="partner" className="text-sm font-medium text-gray-700">Seleccionar Partner *</Label>
          <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
            <SelectTrigger className="rounded-lg border-gray-200 focus:border-brand-300 h-9 w-full">
              <SelectValue placeholder={partnersLoading ? "Cargando partners..." : "Elige un partner comercial"} />
            </SelectTrigger>
            <SelectContent>
              {partners.map((partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-500" />
                    {partner.name}
                    <Badge variant="secondary" className="text-xs">
                      {partner.status === 'active' ? 'Activo' : partner.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPartner && (
            <div className="text-xs text-gray-500 mt-1">
              Estado: {selectedPartner.status === 'active' ? 'Activo' : selectedPartner.status}
            </div>
          )}
        </div>

        {/* Select Benefit (replaces Banner Type) */}
        {selectedPartnerId && (
          <div className="space-y-1.5">
            <Label htmlFor="benefit" className="text-sm font-medium text-gray-700">Seleccionar el Beneficio *</Label>
            {partnerBenefits.length > 0 ? (
              <Select value={bannerType} onValueChange={setBannerType}>
                <SelectTrigger className="rounded-lg border-gray-200 focus:border-brand-300 h-auto min-h-[36px] w-full">
                  <SelectValue placeholder="Selecciona el beneficio a destacar" />
                </SelectTrigger>
                <SelectContent className="max-w-[520px]">
                  {partnerBenefits.map((benefit, index) => (
                    <SelectItem key={index} value={benefit} className="whitespace-normal text-wrap max-w-full">
                      <div className="py-1 leading-5 break-words">
                        {benefit}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">Este partner no tiene beneficios configurados. Puedes editarlo para agregar beneficios.</p>
              </div>
            )}
          </div>
        )}

        {/* Promotion Discount (conditional) */}
        {bannerType && bannerType.toLowerCase().includes('descuento') && (
          <div className="space-y-1.5">
            <Label htmlFor="discount" className="text-sm font-medium text-gray-700">Porcentaje de Descuento *</Label>
            <Input
              id="discount"
              type="number"
              min="1"
              max="99"
              value={promotionDiscount}
              onChange={(e) => setPromotionDiscount(e.target.value)}
              placeholder="ej. 25"
              className="rounded-lg border-gray-200 focus:border-brand-300 h-9"
            />
          </div>
        )}

        {/* Banner Copy */}
        <div className="space-y-1.5">
          <Label htmlFor="bannerCopy" className="text-sm font-medium text-gray-700">Texto del Banner *</Label>
          <Textarea
            id="bannerCopy"
            value={bannerCopy}
            onChange={(e) => setBannerCopy(e.target.value)}
            placeholder="ej. Descubre los mejores productos para tu hogar"
            maxLength={150}
            className="rounded-lg border-gray-200 focus:border-brand-300 min-h-[60px] resize-none text-sm"
          />
          <div className="text-xs text-gray-500 text-right">{bannerCopy.length}/150</div>
        </div>

        {/* CTA Copy */}
        <div className="space-y-1.5">
          <Label htmlFor="ctaCopy" className="text-sm font-medium text-gray-700">Texto del Botón (CTA) *</Label>
          <Input
            id="ctaCopy"
            value={ctaCopy}
            onChange={(e) => setCtaCopy(e.target.value)}
            placeholder="ej. Comprar Ahora"
            maxLength={25}
            className="rounded-lg border-gray-200 focus:border-brand-300 h-9"
          />
          <div className="text-xs text-gray-500 text-right">{ctaCopy.length}/25</div>
        </div>

        {/* Style Selection with Partner Reference Banners */}
        {selectedPartnerId && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Estilo Visual *</Label>
            <div className="grid grid-cols-3 gap-2">
              {partnerReferenceBanners.map((banner) => (
                <div
                  key={banner.id}
                  className={`cursor-pointer rounded-lg border-2 transition-all ${
                    selectedStyle === banner.id 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedStyle(banner.id)}
                >
                  <div className="aspect-video rounded-md overflow-hidden">
                    <img 
                      src={banner.url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-center text-gray-600 py-1">{banner.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Type Selection with Partner Reference Images */}
        {selectedPartnerId && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Tipo de Imagen *</Label>
            {partnerReferenceImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {partnerReferenceImages.map((image) => (
                  <div
                    key={image.id}
                    className={`cursor-pointer rounded-lg border-2 transition-all ${
                      selectedFlavor === image.id 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedFlavor(image.id)}
                  >
                    <div className="aspect-video rounded-md overflow-hidden">
                      <img 
                        src={image.url}
                        alt={image.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-center text-gray-600 py-1">{image.title}</p>
                  </div>
                ))}
              </div>
            ) : (
              <Select value={selectedFlavor} onValueChange={(value) => {
                setSelectedFlavor(value);
                setSelectedReferenceImage('');
              }}>
                <SelectTrigger className="rounded-lg border-gray-200 focus:border-brand-300 h-9">
                  <SelectValue placeholder="Selecciona el tipo de imagen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contextual">🏪 Contextual</SelectItem>
                  <SelectItem value="foto-de-producto">📦 Foto de Producto</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Reference Images for Flavor Selection (only if using default options) */}
        {selectedFlavor && !partnerReferenceImages.length && defaultFlavorReferences[selectedFlavor as keyof typeof defaultFlavorReferences] && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Imagen de Referencia *</Label>
            <div className="grid grid-cols-3 gap-2">
              {defaultFlavorReferences[selectedFlavor as keyof typeof defaultFlavorReferences].map((ref) => (
                <div
                  key={ref.id}
                  className={`cursor-pointer rounded-lg border-2 transition-all ${
                    selectedReferenceImage === ref.id 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedReferenceImage(ref.id)}
                >
                  <div className="aspect-video rounded-md overflow-hidden">
                    <img 
                      src={ref.url}
                      alt={ref.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-center text-gray-600 py-1">{ref.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        
        {/* Generation Progress */}
        {isGenerating && (
          <div className="space-y-2 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Generando tu banner...</span>
            </div>
            <Progress value={progress} className="w-full h-2" />
            <p className="text-xs text-blue-600">Esto puede tomar unos segundos</p>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 mt-4 h-10"
          size="sm"
        >
          {isGenerating ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generar Banner con IA
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BannerFormInputs;
