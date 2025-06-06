
import React, { useState } from 'react';
import { Upload, Check, AlertCircle, Download, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { usePartners } from '@/hooks/usePartners';

const PartnerCreationForm = () => {
  const { createPartner, isLoading } = usePartners();
  
  const [formData, setFormData] = useState({
    partnerName: '',
    regions: [] as string[],
    partnerURL: '',
    benefits: [] as string[],
    description: '',
  });
  
  const [logo, setLogo] = useState<File | null>(null);
  const [brandManual, setBrandManual] = useState<File | null>(null);
  const [referenceBanners, setReferenceBanners] = useState<File[]>([]);
  const [referencePhotos, setReferencePhotos] = useState<File[]>([]);
  const [currentBenefit, setCurrentBenefit] = useState('');

  const regions = [
    { id: 'argentina-uruguay', label: 'Argentina & Uruguay', description: 'Tono: Local, familiar' },
    { id: 'latam', label: 'LATAM', description: 'Tono: Español LATAM neutral' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegionChange = (regionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      regions: checked 
        ? [...prev.regions, regionId]
        : prev.regions.filter(r => r !== regionId)
    }));
  };

  const addBenefit = () => {
    if (currentBenefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, currentBenefit.trim()]
      }));
      setCurrentBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const downloadBrandManualTemplate = () => {
    const csvContent = "Field,Value,Instructions\nMain Color,#FFFFFF,Primary brand color (hex format)\nSecondary Color,#000000,Secondary brand color (hex format)\nAccent Color 1,#CCCCCC,Additional accent color if needed\nAccent Color 2,#999999,Additional accent color if needed\nFont Primary,Arial,Primary font family\nFont Secondary,Helvetica,Secondary font family";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'brand_manual_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.includes('png')) {
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        return;
      }
      
      setLogo(file);
    }
  };

  const handleBrandManualUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.includes('csv')) {
        return;
      }
      
      setBrandManual(file);
    }
  };

  const handleReferenceBannersUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter(file => 
        file.type.includes('image/') && file.size <= 10 * 1024 * 1024
      );
      
      setReferenceBanners(prev => [...prev, ...validFiles]);
    }
  };

  const handleReferencePhotosUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter(file => 
        file.type.includes('image/') && file.size <= 10 * 1024 * 1024
      );
      
      setReferencePhotos(prev => [...prev, ...validFiles]);
    }
  };

  const removeReferenceBanner = (index: number) => {
    setReferenceBanners(prev => prev.filter((_, i) => i !== index));
  };

  const removeReferencePhoto = (index: number) => {
    setReferencePhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.partnerName || formData.regions.length === 0) {
      return;
    }

    const success = await createPartner({
      name: formData.partnerName,
      regions: formData.regions,
      partner_url: formData.partnerURL || undefined,
      benefits_description: formData.benefits.join('; ') || undefined,
      description: formData.description || undefined,
      logo: logo || undefined,
      brand_manual: brandManual || undefined,
      reference_banners: referenceBanners.length > 0 ? referenceBanners : undefined,
    });

    if (success) {
      // Reset form
      setFormData({
        partnerName: '',
        regions: [],
        partnerURL: '',
        benefits: [],
        description: '',
      });
      setLogo(null);
      setBrandManual(null);
      setReferenceBanners([]);
      setReferencePhotos([]);
      setCurrentBenefit('');
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Crear Nuevo Partner</CardTitle>
        <CardDescription>Agregar un nuevo partner a tu plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Partner Name */}
          <div className="space-y-2">
            <Label htmlFor="partnerName" className="text-sm font-medium text-gray-700">
              Nombre del Partner *
            </Label>
            <Input
              id="partnerName"
              value={formData.partnerName}
              onChange={(e) => handleInputChange('partnerName', e.target.value)}
              placeholder="Ingresa el nombre del partner"
              className="bg-white/50 border-gray-200 focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* Regions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Regiones * (Selecciona todas las que apliquen)
            </Label>
            <div className="space-y-3">
              {regions.map((region) => (
                <div key={region.id} className="flex items-start space-x-3 p-3 bg-white/30 rounded-lg border border-gray-200">
                  <Checkbox
                    id={region.id}
                    checked={formData.regions.includes(region.id)}
                    onCheckedChange={(checked) => handleRegionChange(region.id, checked as boolean)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor={region.id} className="text-sm font-medium text-gray-700 cursor-pointer">
                      {region.label}
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">{region.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partner URL */}
          <div className="space-y-2">
            <Label htmlFor="partnerURL" className="text-sm font-medium text-gray-700">
              URL del Partner
              <span className="text-xs text-gray-500 ml-2">(usado para colores de marca)</span>
            </Label>
            <Input
              id="partnerURL"
              type="url"
              value={formData.partnerURL}
              onChange={(e) => handleInputChange('partnerURL', e.target.value)}
              placeholder="https://www.sitio-del-partner.com"
              className="bg-white/50 border-gray-200 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Benefits Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Beneficios
              <span className="text-xs text-gray-500 ml-2">(usado para información de copy)</span>
            </Label>
            
            {/* Add Benefit Input */}
            <div className="flex gap-2">
              <Input
                value={currentBenefit}
                onChange={(e) => setCurrentBenefit(e.target.value)}
                placeholder="ej. 20% de descuento, envío gratis..."
                className="bg-white/50 border-gray-200 focus:border-blue-500 transition-colors flex-1"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
              />
              <Button
                type="button"
                onClick={addBenefit}
                disabled={!currentBenefit.trim()}
                variant="outline"
                size="sm"
                className="px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Benefits List */}
            {formData.benefits.length > 0 && (
              <div className="space-y-2 mt-3">
                <p className="text-xs text-gray-600">Beneficios agregados:</p>
                <div className="space-y-1">
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                      <span className="text-sm text-green-700">{benefit}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBenefit(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Descripción Adicional
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Breve descripción del partner..."
              className="bg-white/50 border-gray-200 focus:border-blue-500 transition-colors resize-none"
              rows={3}
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Logo del Partner (PNG)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white/30 hover:border-blue-400 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Subir logo del partner (formato PNG)</p>
                  <p className="text-xs text-gray-500">Tamaño máximo: 5MB</p>
                </div>
                <input
                  type="file"
                  id="logo"
                  className="hidden"
                  accept=".png"
                  onChange={handleLogoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => document.getElementById('logo')?.click()}
                >
                  Elegir Logo
                </Button>
              </div>
              
              {logo && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm text-green-700">{logo.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Brand Manual */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Manual de Marca (CSV)</Label>
            <div className="space-y-3">
              <Button
                type="button"
                onClick={downloadBrandManualTemplate}
                className="w-full justify-center bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Plantilla CSV
              </Button>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white/30 hover:border-blue-400 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Subir manual de marca completado (CSV)</p>
                    <p className="text-xs text-gray-500">Completa la plantilla con colores y fuentes de marca</p>
                  </div>
                  <input
                    type="file"
                    id="brandManual"
                    className="hidden"
                    accept=".csv"
                    onChange={handleBrandManualUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => document.getElementById('brandManual')?.click()}
                  >
                    Subir Manual de Marca
                  </Button>
                </div>
                
                {brandManual && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm text-green-700">{brandManual.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reference Banners */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Banners de Referencia (Opcional)
              <span className="text-xs text-gray-500 ml-2">(para contexto de IA)</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white/30 hover:border-blue-400 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Subir banners existentes para referencia</p>
                  <p className="text-xs text-gray-500">Solo imágenes, máximo 10MB cada una. Puedes subir múltiples archivos</p>
                </div>
                <input
                  type="file"
                  id="referenceBanners"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleReferenceBannersUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => document.getElementById('referenceBanners')?.click()}
                >
                  Elegir Banners de Referencia
                </Button>
              </div>
              
              {referenceBanners.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Archivos seleccionados:</p>
                  {referenceBanners.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                      <span className="text-sm text-green-700">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeReferenceBanner(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reference Photos */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Fotos de Referencia (Opcional)
              <span className="text-xs text-gray-500 ml-2">(para estilo y contexto visual)</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white/30 hover:border-blue-400 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Subir fotos de referencia para el estilo visual</p>
                  <p className="text-xs text-gray-500">Solo imágenes, máximo 10MB cada una. Puedes subir múltiples archivos</p>
                </div>
                <input
                  type="file"
                  id="referencePhotos"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleReferencePhotosUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => document.getElementById('referencePhotos')?.click()}
                >
                  Elegir Fotos de Referencia
                </Button>
              </div>
              
              {referencePhotos.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Fotos seleccionadas:</p>
                  {referencePhotos.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                      <span className="text-sm text-green-700">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeReferencePhoto(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !formData.partnerName || formData.regions.length === 0}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando Partner...
              </div>
            ) : (
              'Crear Partner'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PartnerCreationForm;
