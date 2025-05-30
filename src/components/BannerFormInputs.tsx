
import React from 'react';
import { Wand2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Partner } from '@/hooks/usePartners';

interface BannerFormInputsProps {
  selectedPartnerId: string;
  setSelectedPartnerId: (value: string) => void;
  bannerType: string;
  setBannerType: (value: string) => void;
  promotionDiscount: string;
  setPromotionDiscount: (value: string) => void;
  bannerCopy: string;
  setBannerCopy: (value: string) => void;
  selectedStyle: string;
  setSelectedStyle: (value: string) => void;
  selectedFlavor: string;
  setSelectedFlavor: (value: string) => void;
  partners: Partner[];
  partnersLoading: boolean;
  selectedPartner: Partner | undefined;
  isGenerating: boolean;
  progress: number;
  onGenerate: () => void;
}

const BannerFormInputs = ({
  selectedPartnerId,
  setSelectedPartnerId,
  bannerType,
  setBannerType,
  promotionDiscount,
  setPromotionDiscount,
  bannerCopy,
  setBannerCopy,
  selectedStyle,
  setSelectedStyle,
  selectedFlavor,
  setSelectedFlavor,
  partners,
  partnersLoading,
  selectedPartner,
  isGenerating,
  progress,
  onGenerate
}: BannerFormInputsProps) => {
  const bannerStyles = [
    { id: 'bold-dynamic', name: 'Audaz y Dinámico' },
    { id: 'minimal', name: 'Minimalista' },
    { id: 'vibrant', name: 'Vibrante' }
  ];

  const bannerFlavors = [
    { id: 'contextual', name: 'Contextual' },
    { id: 'product-photo', name: 'Foto de Producto' }
  ];

  const formatRegions = (regions: string[]) => {
    const regionLabels: Record<string, string> = {
      'argentina-uruguay': 'Argentina y Uruguay',
      'latam': 'LATAM',
    };
    return regions.map(region => regionLabels[region] || region).join(', ');
  };

  const isFormValid = selectedPartnerId && bannerType && bannerCopy && selectedStyle && selectedFlavor && 
    (bannerType !== 'promotion' || promotionDiscount);

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-700">Crear Banner</h2>
            <p className="text-sm text-gray-500">Diseña tu banner perfecto en minutos</p>
          </div>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto px-8">
        <div className="py-6 space-y-8">
          {/* Partner Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Elegir Socio</Label>
            {partnersLoading ? (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-gray-600 text-sm">Cargando socios...</p>
              </div>
            ) : partners.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-800 text-sm font-medium">No hay socios disponibles</p>
                <p className="text-amber-700 text-xs mt-1">Crea un socio primero para comenzar</p>
              </div>
            ) : (
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger className="bg-white border-gray-200 rounded-xl h-12 px-4 hover:border-gray-300 transition-colors">
                  <SelectValue placeholder="Selecciona un socio" />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-lg border border-gray-200 rounded-xl z-50">
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id} className="rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{partner.name[0]}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">{partner.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({formatRegions(partner.regions)})
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Banner Type */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Tipo de Banner</Label>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <RadioGroup value={bannerType} onValueChange={setBannerType} className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors">
                  <RadioGroupItem value="general" id="general" className="border-2" />
                  <Label htmlFor="general" className="text-sm font-medium cursor-pointer flex-1 text-gray-700">
                    Banner General
                    <span className="block text-xs text-gray-500 mt-1">Perfecto para conocimiento de marca y promociones generales</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors">
                  <RadioGroupItem value="promotion" id="promotion" className="border-2" />
                  <Label htmlFor="promotion" className="text-sm font-medium cursor-pointer flex-1 text-gray-700">
                    Banner Promocional
                    <span className="block text-xs text-gray-500 mt-1">Destaca ofertas especiales y descuentos</span>
                  </Label>
                </div>
              </RadioGroup>
              
              {bannerType === 'promotion' && (
                <div className="mt-5 pt-5 border-t border-gray-200">
                  <Label className="text-sm font-medium text-gray-600 mb-3 block">Porcentaje de Descuento</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="20"
                      value={promotionDiscount}
                      onChange={(e) => setPromotionDiscount(e.target.value)}
                      className="h-12 rounded-xl border-gray-200 pr-8 text-gray-700"
                      min="1"
                      max="100"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Banner Copy */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Texto del Banner</Label>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <Textarea
                value={bannerCopy}
                onChange={(e) => setBannerCopy(e.target.value)}
                placeholder="Ingresa tu mensaje atractivo para el banner..."
                className="resize-none border-0 p-0 focus-visible:ring-0 bg-transparent text-gray-700 placeholder:text-gray-400"
                rows={4}
                maxLength={100}
              />
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500">Manténlo conciso e impactante</span>
                <span className="text-xs font-medium text-gray-600">
                  {bannerCopy.length}/100
                </span>
              </div>
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Estilo de Diseño</Label>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle} className="space-y-3">
                {bannerStyles.map((style) => (
                  <div key={style.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors">
                    <RadioGroupItem value={style.id} id={style.id} className="border-2" />
                    <Label htmlFor={style.id} className="text-sm font-medium cursor-pointer text-gray-700">{style.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Image Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Estilo de Imagen</Label>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <RadioGroup value={selectedFlavor} onValueChange={setSelectedFlavor} className="space-y-3">
                {bannerFlavors.map((flavor) => (
                  <div key={flavor.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors">
                    <RadioGroupItem value={flavor.id} id={flavor.id} className="border-2" />
                    <Label htmlFor={flavor.id} className="text-sm font-medium cursor-pointer text-gray-700">{flavor.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Selected Partner Preview */}
          {selectedPartner && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">{selectedPartner.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-blue-800 text-sm">{selectedPartner.name}</div>
                  <div className="text-blue-600 text-xs mt-1">
                    {formatRegions(selectedPartner.regions)} • {selectedPartner.status}
                  </div>
                  {selectedPartner.description && (
                    <div className="text-blue-600 text-xs mt-2 line-clamp-2">{selectedPartner.description}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
              <div className="flex items-center mb-3">
                <Sparkles className="w-5 h-5 text-purple-600 mr-3 animate-pulse" />
                <span className="text-purple-700 font-semibold text-sm">Creando tu banner...</span>
              </div>
              <Progress value={progress} className="h-2 bg-purple-100" />
              <p className="text-purple-600 text-xs mt-2">Esto usualmente toma unos segundos</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Generate Button */}
      <div className="flex-shrink-0 p-8 border-t border-gray-100 bg-white rounded-b-2xl">
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !isFormValid || partnersLoading}
          className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          {isGenerating ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Generando Banner...
            </div>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-3" />
              Generar Banner
            </>
          )}
        </Button>
        {!isFormValid && !isGenerating && (
          <p className="text-xs text-gray-500 text-center mt-3">
            Por favor completa todos los campos requeridos para generar tu banner
          </p>
        )}
      </div>
    </div>
  );
};

export default BannerFormInputs;
