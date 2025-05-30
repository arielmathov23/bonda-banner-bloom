
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

  const referenceImages = {
    contextual: [
      { url: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=300&h=200&fit=crop', alt: 'Persona trabajando con laptop' },
      { url: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=200&fit=crop', alt: 'Laptop encendida' },
      { url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&h=200&fit=crop', alt: 'Persona usando MacBook' }
    ],
    'product-photo': [
      { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=200&fit=crop', alt: 'Circuito tecnológico' },
      { url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=200&fit=crop', alt: 'Monitor con código' },
      { url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&h=200&fit=crop', alt: 'Producto tecnológico' }
    ]
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Wand2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Crear Banner Personalizado</h1>
                <p className="text-purple-100 mt-2">Diseña tu banner perfecto paso a paso</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-10">
            {/* Partner Selection */}
            <div className="space-y-4">
              <Label className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Elegir Socio
              </Label>
              {partnersLoading ? (
                <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-100">
                  <p className="text-gray-600 text-center">Cargando socios...</p>
                </div>
              ) : partners.length === 0 ? (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8">
                  <p className="text-amber-800 font-semibold text-lg">No hay socios disponibles</p>
                  <p className="text-amber-700 mt-2">Crea un socio primero para comenzar</p>
                </div>
              ) : (
                <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                  <SelectTrigger className="bg-white border-2 border-gray-200 rounded-2xl h-16 px-6 hover:border-blue-300 transition-all duration-200 text-lg shadow-sm">
                    <SelectValue placeholder="Selecciona un socio para crear el banner" />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-xl border-2 border-gray-200 rounded-2xl">
                    {partners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id} className="rounded-xl p-4 margin-2">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">{partner.name[0]}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-800 text-lg">{partner.name}</span>
                            <span className="text-gray-500 ml-3">
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
              <Label className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                Tipo de Banner
              </Label>
              <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-100">
                <RadioGroup value={bannerType} onValueChange={setBannerType} className="space-y-6">
                  <div className="flex items-start space-x-6 p-6 rounded-xl hover:bg-white transition-all duration-200 border-2 border-transparent hover:border-blue-200">
                    <RadioGroupItem value="general" id="general" className="border-2 mt-2 w-5 h-5" />
                    <Label htmlFor="general" className="cursor-pointer flex-1 text-gray-700">
                      <div className="font-semibold text-lg">Banner General</div>
                      <div className="text-gray-500 mt-2">Perfecto para conocimiento de marca y promociones generales</div>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-6 p-6 rounded-xl hover:bg-white transition-all duration-200 border-2 border-transparent hover:border-blue-200">
                    <RadioGroupItem value="promotion" id="promotion" className="border-2 mt-2 w-5 h-5" />
                    <Label htmlFor="promotion" className="cursor-pointer flex-1 text-gray-700">
                      <div className="font-semibold text-lg">Banner Promocional</div>
                      <div className="text-gray-500 mt-2">Destaca ofertas especiales y descuentos</div>
                    </Label>
                  </div>
                </RadioGroup>
                
                {bannerType === 'promotion' && (
                  <div className="mt-8 pt-8 border-t-2 border-gray-200">
                    <Label className="text-lg font-semibold text-gray-700 mb-4 block">Porcentaje de Descuento</Label>
                    <div className="relative max-w-sm">
                      <Input
                        type="number"
                        placeholder="20"
                        value={promotionDiscount}
                        onChange={(e) => setPromotionDiscount(e.target.value)}
                        className="h-16 rounded-2xl border-2 border-gray-200 pr-16 text-lg font-medium"
                        min="1"
                        max="100"
                      />
                      <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg font-medium">%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Banner Copy */}
            <div className="space-y-4">
              <Label className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                Texto del Banner
              </Label>
              <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-100">
                <Textarea
                  value={bannerCopy}
                  onChange={(e) => setBannerCopy(e.target.value)}
                  placeholder="Escribe tu mensaje principal para el banner. Hazlo atractivo y memorable..."
                  className="resize-none border-0 p-0 focus-visible:ring-0 bg-transparent text-gray-700 placeholder:text-gray-400 text-lg min-h-[150px] font-medium"
                  maxLength={100}
                />
                <div className="flex justify-between items-center mt-6 pt-6 border-t-2 border-gray-200">
                  <span className="text-gray-500 font-medium">Manténlo conciso e impactante</span>
                  <span className="text-lg font-bold text-gray-600 bg-white px-4 py-2 rounded-xl border-2 border-gray-200">
                    {bannerCopy.length}/100
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Copy */}
            <div className="space-y-4">
              <Label className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                Texto del Botón (CTA)
              </Label>
              <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-100">
                <Input
                  value={ctaCopy}
                  onChange={(e) => setCtaCopy(e.target.value)}
                  placeholder="Ej: Compra Ahora, Ver Más, Obtener Descuento..."
                  className="border-0 p-0 h-16 focus-visible:ring-0 bg-transparent text-gray-700 placeholder:text-gray-400 text-lg font-medium"
                  maxLength={30}
                />
                <div className="flex justify-between items-center mt-6 pt-6 border-t-2 border-gray-200">
                  <span className="text-gray-500 font-medium">Acción que quieres que realice el usuario</span>
                  <span className="text-lg font-bold text-gray-600 bg-white px-4 py-2 rounded-xl border-2 border-gray-200">
                    {ctaCopy.length}/30
                  </span>
                </div>
              </div>
            </div>

            {/* Style Selection */}
            <div className="space-y-4">
              <Label className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-bold">5</span>
                Estilo de Diseño
              </Label>
              <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-100">
                <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle} className="space-y-6">
                  {bannerStyles.map((style) => (
                    <div key={style.id} className="flex items-center space-x-6 p-6 rounded-xl hover:bg-white transition-all duration-200 border-2 border-transparent hover:border-blue-200">
                      <RadioGroupItem value={style.id} id={style.id} className="border-2 w-5 h-5" />
                      <Label htmlFor={style.id} className="cursor-pointer text-gray-700 font-semibold text-lg">{style.name}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Image Style Selection */}
            <div className="space-y-4">
              <Label className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">6</span>
                Estilo de Imagen
              </Label>
              <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-100">
                <RadioGroup value={selectedFlavor} onValueChange={setSelectedFlavor} className="space-y-6">
                  {bannerFlavors.map((flavor) => (
                    <div key={flavor.id} className="flex items-center space-x-6 p-6 rounded-xl hover:bg-white transition-all duration-200 border-2 border-transparent hover:border-blue-200">
                      <RadioGroupItem value={flavor.id} id={flavor.id} className="border-2 w-5 h-5" />
                      <Label htmlFor={flavor.id} className="cursor-pointer text-gray-700 font-semibold text-lg">{flavor.name}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Reference Images */}
            {selectedFlavor && (
              <div className="space-y-4">
                <Label className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-bold">7</span>
                  Imágenes de Referencia
                </Label>
                <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-100">
                  <p className="text-gray-600 mb-6 text-lg">Estas imágenes te ayudan a visualizar el estilo seleccionado:</p>
                  <div className="grid grid-cols-3 gap-6">
                    {referenceImages[selectedFlavor as keyof typeof referenceImages]?.map((image, index) => (
                      <div key={index} className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-blue-300 transition-all duration-200">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <p className="text-sm text-gray-500 mt-3 text-center font-medium">{image.alt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Generation Progress */}
            {isGenerating && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  <Sparkles className="w-8 h-8 text-purple-600 mr-4 animate-pulse" />
                  <span className="text-purple-700 font-bold text-2xl">Creando tu banner...</span>
                </div>
                <Progress value={progress} className="h-4 bg-purple-100" />
                <p className="text-purple-600 mt-4 text-lg font-medium">Esto usualmente toma unos segundos</p>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="p-8 pt-0">
            <Button
              onClick={onGenerate}
              disabled={isGenerating || !isFormValid || partnersLoading}
              className="w-full h-20 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
              size="lg"
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-4"></div>
                  Generando tu Banner Personalizado...
                </div>
              ) : (
                <>
                  <Wand2 className="w-8 h-8 mr-4" />
                  Generar Banner Personalizado
                </>
              )}
            </Button>
            {!isFormValid && !isGenerating && (
              <p className="text-gray-500 text-center mt-6 text-lg">
                Por favor completa todos los pasos para generar tu banner personalizado
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerFormInputs;
