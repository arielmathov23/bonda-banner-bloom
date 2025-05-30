
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
  ctaCopy: string;
  setCtaCopy: (value: string) => void;
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

  const isFormValid = selectedPartnerId && bannerType && bannerCopy && ctaCopy && selectedStyle && selectedFlavor && 
    (bannerType !== 'promotion' || promotionDiscount);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Crear Banner</h2>
              <p className="text-gray-600">Diseña tu banner perfecto en minutos</p>
            </div>
          </div>
        </div>

        {/* Form Content - Single Column */}
        <div className="p-8">
          <div className="space-y-8">
            {/* Partner Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">Elegir Socio</Label>
              {partnersLoading ? (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <p className="text-gray-600">Cargando socios...</p>
                </div>
              ) : partners.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <p className="text-amber-800 font-medium">No hay socios disponibles</p>
                  <p className="text-amber-700 text-sm mt-1">Crea un socio primero para comenzar</p>
                </div>
              ) : (
                <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                  <SelectTrigger className="bg-white border-gray-200 rounded-xl h-14 px-4 hover:border-gray-300 transition-colors text-base">
                    <SelectValue placeholder="Selecciona un socio" />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-lg border border-gray-200 rounded-xl z-50">
                    {partners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id} className="rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">{partner.name[0]}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 text-base">{partner.name}</span>
                            <span className="text-sm text-gray-500 ml-2">
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
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">Tipo de Banner</Label>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <RadioGroup value={bannerType} onValueChange={setBannerType} className="space-y-6">
                  <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-white transition-colors">
                    <RadioGroupItem value="general" id="general" className="border-2 mt-1" />
                    <Label htmlFor="general" className="cursor-pointer flex-1 text-gray-700">
                      <div className="font-medium text-base">Banner General</div>
                      <div className="text-sm text-gray-500 mt-1">Perfecto para conocimiento de marca y promociones generales</div>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-white transition-colors">
                    <RadioGroupItem value="promotion" id="promotion" className="border-2 mt-1" />
                    <Label htmlFor="promotion" className="cursor-pointer flex-1 text-gray-700">
                      <div className="font-medium text-base">Banner Promocional</div>
                      <div className="text-sm text-gray-500 mt-1">Destaca ofertas especiales y descuentos</div>
                    </Label>
                  </div>
                </RadioGroup>
                
                {bannerType === 'promotion' && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <Label className="text-base font-medium text-gray-700 mb-4 block">Porcentaje de Descuento</Label>
                    <div className="relative max-w-xs">
                      <Input
                        type="number"
                        placeholder="20"
                        value={promotionDiscount}
                        onChange={(e) => setPromotionDiscount(e.target.value)}
                        className="h-14 rounded-xl border-gray-200 pr-12 text-base"
                        min="1"
                        max="100"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base">%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Banner Copy */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">Texto del Banner</Label>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <Textarea
                  value={bannerCopy}
                  onChange={(e) => setBannerCopy(e.target.value)}
                  placeholder="Ingresa tu mensaje atractivo para el banner..."
                  className="resize-none border-0 p-0 focus-visible:ring-0 bg-transparent text-gray-700 placeholder:text-gray-400 text-base min-h-[120px]"
                  maxLength={100}
                />
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-500">Manténlo conciso e impactante</span>
                  <span className="text-sm font-medium text-gray-600">
                    {bannerCopy.length}/100
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Copy */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">Texto del CTA</Label>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <Input
                  value={ctaCopy}
                  onChange={(e) => setCtaCopy(e.target.value)}
                  placeholder="Ej: Compra Ahora, Ver Más, Obtener Descuento..."
                  className="border-0 p-0 h-14 focus-visible:ring-0 bg-transparent text-gray-700 placeholder:text-gray-400 text-base"
                  maxLength={30}
                />
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-500">Acción que quieres que realice el usuario</span>
                  <span className="text-sm font-medium text-gray-600">
                    {ctaCopy.length}/30
                  </span>
                </div>
              </div>
            </div>

            {/* Style Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">Estilo de Diseño</Label>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle} className="space-y-4">
                  {bannerStyles.map((style) => (
                    <div key={style.id} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-white transition-colors">
                      <RadioGroupItem value={style.id} id={style.id} className="border-2" />
                      <Label htmlFor={style.id} className="cursor-pointer text-gray-700 font-medium text-base">{style.name}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Image Type Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">Estilo de Imagen</Label>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <RadioGroup value={selectedFlavor} onValueChange={setSelectedFlavor} className="space-y-4">
                  {bannerFlavors.map((flavor) => (
                    <div key={flavor.id} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-white transition-colors">
                      <RadioGroupItem value={flavor.id} id={flavor.id} className="border-2" />
                      <Label htmlFor={flavor.id} className="cursor-pointer text-gray-700 font-medium text-base">{flavor.name}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Selected Partner Preview */}
            {selectedPartner && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{selectedPartner.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-blue-800 text-lg">{selectedPartner.name}</div>
                    <div className="text-blue-600 text-sm mt-1">
                      {formatRegions(selectedPartner.regions)} • {selectedPartner.status}
                    </div>
                    {selectedPartner.description && (
                      <div className="text-blue-600 text-sm mt-2">{selectedPartner.description}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Generation Progress */}
            {isGenerating && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600 mr-3 animate-pulse" />
                  <span className="text-purple-700 font-semibold text-lg">Creando tu banner...</span>
                </div>
                <Progress value={progress} className="h-3 bg-purple-100" />
                <p className="text-purple-600 text-sm mt-3">Esto usualmente toma unos segundos</p>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="p-8 pt-0">
          <Button
            onClick={onGenerate}
            disabled={isGenerating || !isFormValid || partnersLoading}
            className="w-full h-16 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            {isGenerating ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Generando Banner...
              </div>
            ) : (
              <>
                <Wand2 className="w-6 h-6 mr-3" />
                Generar Banner
              </>
            )}
          </Button>
          {!isFormValid && !isGenerating && (
            <p className="text-sm text-gray-500 text-center mt-4">
              Por favor completa todos los campos requeridos para generar tu banner
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BannerFormInputs;
