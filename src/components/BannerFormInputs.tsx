
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
  description?: string;
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
  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-xl max-w-2xl mx-auto">
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
          <Label htmlFor="partner" className="text-sm font-medium text-gray-700">Seleccionar Socio *</Label>
          <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
            <SelectTrigger className="rounded-lg border-gray-200 focus:border-brand-300 h-9">
              <SelectValue placeholder={partnersLoading ? "Cargando socios..." : "Elige un socio comercial"} />
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

        {/* Banner Type */}
        <div className="space-y-1.5">
          <Label htmlFor="bannerType" className="text-sm font-medium text-gray-700">Tipo de Banner *</Label>
          <Select value={bannerType} onValueChange={setBannerType}>
            <SelectTrigger className="rounded-lg border-gray-200 focus:border-brand-300 h-9">
              <SelectValue placeholder="Selecciona el tipo de banner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="promotion">Promocional</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Promotion Discount (conditional) */}
        {bannerType === 'promotion' && (
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

        {/* Style Selection */}
        <div className="space-y-1.5">
          <Label htmlFor="style" className="text-sm font-medium text-gray-700">Estilo Visual *</Label>
          <Select value={selectedStyle} onValueChange={setSelectedStyle}>
            <SelectTrigger className="rounded-lg border-gray-200 focus:border-brand-300 h-9">
              <SelectValue placeholder="Elige el estilo del banner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="audaz-y-dinamico">🔥 Audaz y Dinámico</SelectItem>
              <SelectItem value="minimalista">✨ Minimalista</SelectItem>
              <SelectItem value="vibrante">🌈 Vibrante</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Flavor Selection */}
        <div className="space-y-1.5">
          <Label htmlFor="flavor" className="text-sm font-medium text-gray-700">Tipo de Imagen *</Label>
          <Select value={selectedFlavor} onValueChange={setSelectedFlavor}>
            <SelectTrigger className="rounded-lg border-gray-200 focus:border-brand-300 h-9">
              <SelectValue placeholder="Selecciona el tipo de imagen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contextual">🏪 Contextual</SelectItem>
              <SelectItem value="foto-de-producto">📦 Foto de Producto</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
