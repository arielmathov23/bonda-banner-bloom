import React, { useState, useEffect } from 'react';
import { Upload, Check, AlertCircle, Download, Plus, X, Palette, ArrowLeft, Trash2, Brain, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePartners, Partner, UpdatePartnerData } from '@/hooks/usePartners';
import { analyzeReferenceStyle, isStyleAnalysisAvailable, StyleAnalysis } from '@/lib/style-analysis';
import { toast } from '@/hooks/use-toast';

interface PartnerCreationFormProps {
  editingPartner?: Partner | null;
  onSuccess?: () => void;
}

const PartnerCreationForm = ({ editingPartner, onSuccess }: PartnerCreationFormProps) => {
  const { createPartner, updatePartner, isLoading } = usePartners();
  
  const [formData, setFormData] = useState({
    partnerName: '',
    regions: [] as string[],
    partnerURL: '',
    benefits: [] as string[],
    description: '',
  });
  
  const [logo, setLogo] = useState<File | null>(null);
  const [existingLogo, setExistingLogo] = useState<string | null>(null);
  const [brandManual, setBrandManual] = useState<File | null>(null);
  const [referenceBanners, setReferenceBanners] = useState<File[]>([]);
  const [existingReferenceBanners, setExistingReferenceBanners] = useState<string[]>([]);
  const [referencePhotos, setReferencePhotos] = useState<File[]>([]);
  const [existingReferencePhotos, setExistingReferencePhotos] = useState<string[]>([]);
  const [productPhotos, setProductPhotos] = useState<File[]>([]);
  const [existingProductPhotos, setExistingProductPhotos] = useState<string[]>([]);
  const [currentBenefit, setCurrentBenefit] = useState('');
  
  // New state for brand guidelines
  const [brandGuidelines, setBrandGuidelines] = useState({
    mainColor: '#8A47F5',
    secondaryColor: '#E9DEFF',
    fontPrimary: 'DM Sans',
    fontSecondary: 'Arial',
  });
  
  const [dragStates, setDragStates] = useState({
    logo: false,
    referenceBanners: false,
    referencePhotos: false,
    productPhotos: false,
  });

  // Style analysis state
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis | null>(null);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
  const [styleAnalysisProgress, setStyleAnalysisProgress] = useState('');

  // Track if reference banners have changed during editing
  const [referenceBannersChanged, setReferenceBannersChanged] = useState(false);

  // Load existing partner data when editing
  useEffect(() => {
    if (editingPartner) {
      setFormData({
        partnerName: editingPartner.name,
        regions: editingPartner.regions,
        partnerURL: editingPartner.partner_url || '',
        benefits: editingPartner.benefits_description ? editingPartner.benefits_description.split('; ').filter(b => b.trim()) : [],
        description: editingPartner.description || '',
      });

      // Set existing logo
      setExistingLogo(editingPartner.logo_url || null);
      
      // Set existing reference banners
      setExistingReferenceBanners(editingPartner.reference_banners_urls || []);
      
      // Set existing product photos
      setExistingProductPhotos(editingPartner.product_photos_urls || []);
      
      // Reset reference banners changed flag when loading partner for editing
      setReferenceBannersChanged(false);
      
      // Load brand guidelines from existing brand manual
      if (editingPartner.brand_manual_url) {
        loadBrandGuidelines(editingPartner.brand_manual_url);
      }
    }
  }, [editingPartner]);

  // Function to load and parse brand guidelines from CSV
  const loadBrandGuidelines = async (brandManualUrl: string) => {
    try {
      console.log('Loading brand guidelines from:', brandManualUrl);
      const response = await fetch(brandManualUrl);
      const csvText = await response.text();
      
      // Parse CSV
      const lines = csvText.split('\n');
      const brandData: Record<string, string> = {};
      
      lines.forEach(line => {
        if (line.trim() && !line.startsWith('Field,')) {
          const [field, value] = line.split(',');
          if (field && value) {
            brandData[field.trim()] = value.trim();
          }
        }
      });
      
      // Update brand guidelines state with parsed data
      const updatedGuidelines = {
        mainColor: brandData['Main Color'] || '#8A47F5',
        secondaryColor: brandData['Secondary Color'] || '#E9DEFF',
        fontPrimary: brandData['Font Primary'] || 'DM Sans',
        fontSecondary: brandData['Font Secondary'] || 'Arial',
      };
      
      console.log('Loaded brand guidelines:', updatedGuidelines);
      setBrandGuidelines(updatedGuidelines);
    } catch (error) {
      console.error('Error loading brand guidelines:', error);
      // Keep default values if loading fails
    }
  };

  const regions = [
    { id: 'argentina-uruguay', label: 'Argentina & Uruguay', description: 'Tono: Local, familiar' },
    { id: 'latam', label: 'LATAM', description: 'Tono: Español LATAM neutral' }
  ];

  // Font options for dropdowns
  const fontOptions = [
    'DM Sans',
    'Roboto',
    'Cerebi Sans',
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Verdana',
    'Tahoma',
    'Trebuchet MS',
    'Impact',
    'Comic Sans MS',
    'Courier New',
    'Lucida Console',
    'Palatino',
    'Garamond',
    'Bookman',
    'Arial Black',
    'Century Gothic',
    'Franklin Gothic Medium'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBrandGuidelineChange = (field: string, value: string) => {
    setBrandGuidelines(prev => ({ ...prev, [field]: value }));
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

  // Remove existing logo
  const removeExistingLogo = () => {
    setExistingLogo(null);
  };

  // Remove existing reference banner
  const removeExistingReferenceBanner = (url: string) => {
    setExistingReferenceBanners(prev => prev.filter(bannerUrl => bannerUrl !== url));
    
    // Mark that reference banners changed during editing
    if (editingPartner) {
      setReferenceBannersChanged(true);
    }
  };

  // Remove existing reference photo
  const removeExistingReferencePhoto = (url: string) => {
    setExistingReferencePhotos(prev => prev.filter(photoUrl => photoUrl !== url));
  };

  // Remove existing product photo
  const removeExistingProductPhoto = (url: string) => {
    setExistingProductPhotos(prev => prev.filter(photoUrl => photoUrl !== url));
  };

  // Create brand manual CSV from form data
  const generateBrandManualData = () => {
    const csvContent = `Field,Value,Instructions
Main Color,${brandGuidelines.mainColor},Primary brand color (hex format)
Secondary Color,${brandGuidelines.secondaryColor},Secondary brand color (hex format)
Font Primary,${brandGuidelines.fontPrimary},Primary font family
Font Secondary,${brandGuidelines.fontSecondary},Secondary font family`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return blob;
  };

  const handleDragOver = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [section]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [section]: false }));
  };

  const handleDrop = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [section]: false }));
    
    const files = Array.from(e.dataTransfer.files);
    
    switch (section) {
      case 'logo':
        const logoFile = files[0];
        if (logoFile && logoFile.type.includes('png') && logoFile.size <= 5 * 1024 * 1024) {
          setLogo(logoFile);
          setExistingLogo(null);
        }
        break;
      case 'referenceBanners':
        const bannerFiles = files.filter(file => 
          file.type.includes('image/') && file.size <= 10 * 1024 * 1024
        );
        setReferenceBanners(prev => [...prev, ...bannerFiles]);
        
        // Mark that reference banners changed during editing
        if (editingPartner) {
          setReferenceBannersChanged(true);
        }
        break;
      case 'productPhotos':
        const productFiles = files.filter(file => 
          file.type.includes('image/') && file.size <= 10 * 1024 * 1024
        );
        setProductPhotos(prev => [...prev, ...productFiles]);
        break;
    }
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
      // Clear existing logo when uploading new one
      setExistingLogo(null);
    }
  };

  const handleReferenceBannersUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter(file => 
        file.type.includes('image/') && file.size <= 10 * 1024 * 1024
      );
      
      setReferenceBanners(prev => [...prev, ...validFiles]);
      
      // Mark that reference banners changed during editing
      if (editingPartner) {
        setReferenceBannersChanged(true);
      }
    }
  };

  const removeReferenceBanner = (index: number) => {
    setReferenceBanners(prev => prev.filter((_, i) => i !== index));
    
    // Mark that reference banners changed during editing
    if (editingPartner) {
      setReferenceBannersChanged(true);
    }
  };

  const handleProductPhotosUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter(file => 
        file.type.includes('image/') && file.size <= 10 * 1024 * 1024
      );
      
      setProductPhotos(prev => [...prev, ...validFiles]);
    }
  };

  const removeProductPhoto = (index: number) => {
    setProductPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.partnerName || formData.regions.length === 0) {
      return;
    }

    let currentStyleAnalysis = styleAnalysis;

    // Perform style analysis if reference banners are provided and OpenAI is available
    // For new partners: analyze if banners are provided
    // For existing partners: analyze only if banners have changed during editing
    const shouldAnalyzeStyle = referenceBanners.length > 0 && isStyleAnalysisAvailable() && 
                               (!editingPartner || referenceBannersChanged);
    
    if (shouldAnalyzeStyle) {
      try {
        setIsAnalyzingStyle(true);
        setStyleAnalysisProgress('Analizando estilo de banners de referencia...');
        
        toast({
          title: "Analizando estilo",
          description: editingPartner 
            ? "OpenAI está regenerando el análisis de estilo con los nuevos banners de referencia."
            : "OpenAI está analizando tus banners de referencia para extraer el ADN visual de la marca.",
        });

        currentStyleAnalysis = await analyzeReferenceStyle(
          referenceBanners,
          formData.partnerName,
          formData.description,
          formData.regions
        );
        
        setStyleAnalysis(currentStyleAnalysis);
        setStyleAnalysisProgress('Análisis de estilo completado');
        
        toast({
          title: "Análisis completado",
          description: editingPartner 
            ? "Se ha regenerado exitosamente el análisis de estilo con los nuevos banners."
            : "Se ha extraído exitosamente el estilo visual de los banners de referencia.",
        });

      } catch (error) {
        console.error('Error analyzing style:', error);
        setStyleAnalysisProgress('Error en el análisis de estilo');
        
        toast({
          title: "Error en el análisis",
          description: editingPartner 
            ? "No se pudo regenerar el análisis de estilo. El partner se actualizará sin cambios en el análisis."
            : "No se pudo analizar el estilo de los banners. El partner se creará sin análisis de estilo.",
          variant: "destructive",
        });
        
        // Continue with partner creation even if style analysis fails
        currentStyleAnalysis = null;
      } finally {
        setIsAnalyzingStyle(false);
      }
    }

    // Generate brand manual file from form data
    const brandManualFile = generateBrandManualData();

    const partnerData = {
      name: formData.partnerName,
      regions: formData.regions,
      partner_url: formData.partnerURL || undefined,
      benefits_description: formData.benefits.join('; ') || undefined,
      description: formData.description || undefined,
      logo: logo || undefined,
      brand_manual: new File([brandManualFile], 'brand_manual.csv', { type: 'text/csv' }),
      reference_banners: referenceBanners.length > 0 ? referenceBanners : undefined,
      product_photos: productPhotos.length > 0 ? productPhotos : undefined,
      // Include style analysis if available
      reference_style_analysis: currentStyleAnalysis || undefined,
    };

    let success = false;

    if (editingPartner) {
      // Update existing partner
      const updateData: UpdatePartnerData = {
        id: editingPartner.id,
        ...partnerData,
        // Include existing file URLs that weren't removed
        existingLogo: existingLogo,
        existingReferenceBanners: existingReferenceBanners,
        existingProductPhotos: existingProductPhotos,
      };
      success = await updatePartner(updateData);
    } else {
      // Create new partner
      success = await createPartner(partnerData);
    }

    if (success) {
      // Reset form
      setFormData({
        partnerName: '',
        regions: [],
        partnerURL: '',
        benefits: [],
        description: '',
      });
      setBrandGuidelines({
        mainColor: '#8A47F5',
        secondaryColor: '#E9DEFF',
        fontPrimary: 'DM Sans',
        fontSecondary: 'Arial',
      });
      setLogo(null);
      setExistingLogo(null);
      setBrandManual(null);
      setReferenceBanners([]);
      setExistingReferenceBanners([]);
      setReferencePhotos([]);
      setExistingReferencePhotos([]);
      setProductPhotos([]);
      setExistingProductPhotos([]);
      setCurrentBenefit('');
      setStyleAnalysis(null);
      setStyleAnalysisProgress('');
      setReferenceBannersChanged(false);
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          {editingPartner && onSuccess && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSuccess}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              {editingPartner ? 'Editar Partner' : 'Crear Nuevo Partner'}
            </CardTitle>
            <CardDescription>
              {editingPartner 
                ? 'Modificar la información del partner existente' 
                : 'Agregar un nuevo partner a tu plataforma'
              }
            </CardDescription>
          </div>
        </div>
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
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Beneficios
              <span className="text-xs text-gray-500 ml-2">(usado para información de copy)</span>
            </Label>
            
            {/* Add Benefit Input */}
            <div className="space-y-3">
              <Textarea
                value={currentBenefit}
                onChange={(e) => setCurrentBenefit(e.target.value)}
                placeholder="ej. 20% de descuento, envío gratis..."
                className="bg-white/50 border-gray-200 focus:border-blue-500 transition-colors resize-none"
                rows={3}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addBenefit())}
              />
              <Button
                type="button"
                onClick={addBenefit}
                disabled={!currentBenefit.trim()}
                variant="outline"
                size="sm"
                className={`w-full transition-all duration-200 ${
                  currentBenefit.trim() 
                    ? 'bg-brand-500 text-white border-brand-500 hover:bg-brand-600 hover:border-brand-600 shadow-md' 
                    : 'bg-gray-100 text-gray-400 border-gray-200'
                }`}
              >
                Agregar Beneficio
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
            
            {/* Show existing logo if available */}
            {existingLogo && !logo && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={existingLogo} 
                      alt="Logo actual" 
                      className="w-16 h-16 object-contain bg-white rounded border"
                    />
                    <div>
                      <p className="text-sm font-medium text-blue-700">Logo actual</p>
                      <p className="text-xs text-blue-600">Elimina para subir uno nuevo</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeExistingLogo}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            )}
            
            {/* Show newly uploaded logo preview */}
            {logo && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-700 mb-3">Logo seleccionado para subir:</p>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img 
                      src={URL.createObjectURL(logo)} 
                      alt="Nuevo logo" 
                      className="w-20 h-20 object-contain rounded border bg-white p-2"
                      onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLogo(null)}
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 text-white hover:bg-red-600 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700">{logo.name}</p>
                    <p className="text-xs text-green-600">Listo para subir</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Only show drag and drop when no logo is defined */}
            {!existingLogo && !logo && (
              <div 
                className={`border-2 border-dashed rounded-lg p-4 bg-white/20 transition-all duration-200 ${
                  dragStates.logo 
                    ? 'border-brand-400 bg-brand-50/30' 
                    : 'border-gray-300 hover:border-blue-400'
                }`}
                onDragOver={(e) => handleDragOver(e, 'logo')}
                onDragLeave={(e) => handleDragLeave(e, 'logo')}
                onDrop={(e) => handleDrop(e, 'logo')}
              >
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Arrastra el logo aquí</p>
                  <p className="text-xs text-gray-500 mb-3">PNG, JPG, JPEG • Máx. 5MB</p>
                  <input
                    type="file"
                    id="logo"
                    className="hidden"
                    accept=".png,.jpg,.jpeg"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('logo')?.click()}
                    className="text-xs"
                  >
                    Elegir Logo
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Brand Guidelines */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-brand-500" />
              <Label className="text-sm font-medium text-gray-700">Manual de Marca</Label>
              {editingPartner && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  Re-configura las opciones de marca para este partner
                </span>
              )}
            </div>
            
            <div className="bg-white/50 rounded-lg border border-gray-200 p-4 space-y-4">
              {/* Colors Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Colores de Marca</h4>
                
                {/* Main Color */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mainColor" className="text-sm font-medium text-gray-600">
                      Color Principal *
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Input
                          type="color"
                          id="mainColor"
                          value={brandGuidelines.mainColor}
                          onChange={(e) => handleBrandGuidelineChange('mainColor', e.target.value)}
                          className="w-12 h-9 p-1 rounded border border-gray-200 cursor-pointer"
                        />
                      </div>
                      <Input
                        type="text"
                        value={brandGuidelines.mainColor}
                        onChange={(e) => handleBrandGuidelineChange('mainColor', e.target.value)}
                        placeholder="#8A47F5"
                        className="flex-1 h-9 text-sm font-mono"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>
                  
                  {/* Secondary Color */}
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor" className="text-sm font-medium text-gray-600">
                      Color Secundario *
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Input
                          type="color"
                          id="secondaryColor"
                          value={brandGuidelines.secondaryColor}
                          onChange={(e) => handleBrandGuidelineChange('secondaryColor', e.target.value)}
                          className="w-12 h-9 p-1 rounded border border-gray-200 cursor-pointer"
                        />
                      </div>
                      <Input
                        type="text"
                        value={brandGuidelines.secondaryColor}
                        onChange={(e) => handleBrandGuidelineChange('secondaryColor', e.target.value)}
                        placeholder="#E9DEFF"
                        className="flex-1 h-9 text-sm font-mono"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Color Preview */}
                <div className="flex gap-2 mt-3">
                  <div className="flex-1">
                    <div 
                      className="h-12 rounded-lg border border-gray-200 flex items-center justify-center text-white text-xs font-medium shadow-sm"
                      style={{ backgroundColor: brandGuidelines.mainColor }}
                    >
                      Principal
                    </div>
                  </div>
                  <div className="flex-1">
                    <div 
                      className="h-12 rounded-lg border border-gray-200 flex items-center justify-center text-gray-700 text-xs font-medium shadow-sm"
                      style={{ backgroundColor: brandGuidelines.secondaryColor }}
                    >
                      Secundario
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Tipografía</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary Font */}
                  <div className="space-y-2">
                    <Label htmlFor="fontPrimary" className="text-sm font-medium text-gray-600">
                      Fuente Principal *
                    </Label>
                    <Select value={brandGuidelines.fontPrimary} onValueChange={(value) => handleBrandGuidelineChange('fontPrimary', value)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecciona fuente principal" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map((font) => (
                          <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Secondary Font */}
                  <div className="space-y-2">
                    <Label htmlFor="fontSecondary" className="text-sm font-medium text-gray-600">
                      Fuente Secundaria *
                    </Label>
                    <Select value={brandGuidelines.fontSecondary} onValueChange={(value) => handleBrandGuidelineChange('fontSecondary', value)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecciona fuente secundaria" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map((font) => (
                          <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Font Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p 
                      className="text-sm text-gray-700 font-medium"
                      style={{ fontFamily: brandGuidelines.fontPrimary }}
                    >
                      Fuente Principal: {brandGuidelines.fontPrimary}
                    </p>
                    <p 
                      className="text-xs text-gray-500 mt-1"
                      style={{ fontFamily: brandGuidelines.fontPrimary }}
                    >
                      Lorem ipsum dolor sit amet
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p 
                      className="text-sm text-gray-700 font-medium"
                      style={{ fontFamily: brandGuidelines.fontSecondary }}
                    >
                      Fuente Secundaria: {brandGuidelines.fontSecondary}
                    </p>
                    <p 
                      className="text-xs text-gray-500 mt-1"
                      style={{ fontFamily: brandGuidelines.fontSecondary }}
                    >
                      Lorem ipsum dolor sit amet
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Banners */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                Banners de Referencia (Opcional)
                <span className="text-xs text-gray-500 ml-2">(para contexto de IA y análisis de estilo)</span>
              </Label>
              
              {/* Style Analysis Status */}
              {isStyleAnalysisAvailable() && !editingPartner && (
                <div className="flex items-center gap-2 text-xs">
                  <Brain className="w-4 h-4 text-brand-500" />
                  <span className="text-brand-600 font-medium">
                    Análisis de estilo AI disponible
                  </span>
                </div>
              )}
            </div>
            
            {/* Style Analysis Progress */}
            {isAnalyzingStyle && (
              <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-500"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-brand-500" />
                      <span className="text-sm font-medium text-brand-700">
                        Análisis de estilo en progreso
                      </span>
                    </div>
                    <p className="text-xs text-brand-600 mt-1">
                      {styleAnalysisProgress}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Style Analysis Complete */}
            {styleAnalysis && !isAnalyzingStyle && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Análisis de estilo completado
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Se extrajo el ADN visual de la marca exitosamente
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show existing reference banners */}
            {existingReferenceBanners.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-700 mb-3">Banners de referencia actuales:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {existingReferenceBanners.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Banner ${index + 1}`} 
                        className="w-full h-20 object-cover rounded border bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeExistingReferenceBanner(url)}
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show newly uploaded reference banners preview */}
            {referenceBanners.length > 0 && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-700 mb-3">Banners seleccionados para subir:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {referenceBanners.map((file, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Nuevo banner ${index + 1}`} 
                        className="w-full h-20 object-cover rounded border bg-white"
                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeReferenceBanner(index)}
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show style analysis regeneration indicator */}
            {editingPartner && referenceBannersChanged && isStyleAnalysisAvailable() && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-700">
                    El análisis de estilo se regenerará con los nuevos banners
                  </p>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  Al actualizar el partner, OpenAI analizará los cambios en los banners de referencia
                </p>
              </div>
            )}
            
            <div 
              className={`border-2 border-dashed rounded-lg p-4 bg-white/20 transition-all duration-200 ${
                dragStates.referenceBanners 
                  ? 'border-brand-400 bg-brand-50/30' 
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              onDragOver={(e) => handleDragOver(e, 'referenceBanners')}
              onDragLeave={(e) => handleDragLeave(e, 'referenceBanners')}
              onDrop={(e) => handleDrop(e, 'referenceBanners')}
            >
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">Arrastra banners aquí</p>
                <p className="text-xs text-gray-500 mb-3">Imágenes • Máx. 10MB • Múltiples archivos</p>
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
                  size="sm"
                  onClick={() => document.getElementById('referenceBanners')?.click()}
                  className="text-xs"
                >
                  {existingReferenceBanners.length > 0 ? 'Agregar Más' : 'Elegir Banners de Referencia'}
                </Button>
              </div>
            </div>
          </div>

          {/* Product Photos */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Fotos del Producto (Opcional)
              <span className="text-xs text-gray-500 ml-2">(para contexto de IA)</span>
            </Label>
            
            {/* Show existing product photos */}
            {existingProductPhotos.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-700 mb-3">Fotos del producto actuales:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {existingProductPhotos.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Foto del producto ${index + 1}`} 
                        className="w-full h-20 object-cover rounded border bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeExistingProductPhoto(url)}
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show newly uploaded product photos preview */}
            {productPhotos.length > 0 && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-700 mb-3">Fotos seleccionadas para subir:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {productPhotos.map((file, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Nueva foto ${index + 1}`} 
                        className="w-full h-20 object-cover rounded border bg-white"
                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeProductPhoto(index)}
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div 
              className={`border-2 border-dashed rounded-lg p-4 bg-white/20 transition-all duration-200 ${
                dragStates.productPhotos 
                  ? 'border-brand-400 bg-brand-50/30' 
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              onDragOver={(e) => handleDragOver(e, 'productPhotos')}
              onDragLeave={(e) => handleDragLeave(e, 'productPhotos')}
              onDrop={(e) => handleDrop(e, 'productPhotos')}
            >
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">Arrastra fotos del producto aquí</p>
                <p className="text-xs text-gray-500 mb-3">Imágenes • Máx. 10MB • Múltiples archivos</p>
                <input
                  type="file"
                  id="productPhotos"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleProductPhotosUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('productPhotos')?.click()}
                  className="text-xs"
                >
                  {existingProductPhotos.length > 0 ? 'Agregar Más' : 'Elegir Fotos del Producto'}
                </Button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || isAnalyzingStyle || !formData.partnerName || formData.regions.length === 0}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isAnalyzingStyle ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analizando estilo con AI...
              </div>
            ) : isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {editingPartner ? 'Actualizando Partner...' : 'Creando Partner...'}
              </div>
            ) : (
              editingPartner ? 'Actualizar Partner' : 'Crear Partner'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PartnerCreationForm;


