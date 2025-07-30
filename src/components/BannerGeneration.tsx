import React, { useState, useEffect } from 'react';
import { Wand2, Upload, AlertTriangle, Image as ImageIcon, CheckCircle2, X, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { usePartners } from '@/hooks/usePartners';
import { createEnhancedBanner, isEnhancedBannerCreationAvailable, BannerCreationRequest, getPerformanceInfo, isWebGPUSupported } from '@/lib/enhanced-banner-service';
import { uploadProductPhoto, getPartnerProductPhotos, removeProductPhoto, ProductPhoto } from '@/lib/product-photos-service';
import BannerEditor from '@/components/BannerEditor';

interface BannerGenerationProps {
  preSelectedPartnerId?: string;
}

const BannerGeneration = ({ preSelectedPartnerId }: BannerGenerationProps) => {
  // Form state
  const [selectedPartnerId, setSelectedPartnerId] = useState(preSelectedPartnerId || '');
  const [mainText, setMainText] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [ctaText, setCtaText] = useState('');

  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [selectedExistingPhotoUrl, setSelectedExistingPhotoUrl] = useState<string | null>(null);

  // Product photos state
  const [partnerProductPhotos, setPartnerProductPhotos] = useState<ProductPhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAddNewPhoto, setShowAddNewPhoto] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editorBannerId, setEditorBannerId] = useState<string | null>(null);

  const { partners, isLoading: partnersLoading } = usePartners();
  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  // Check if enhanced banner creation is available
  const enhancedBannerAvailable = isEnhancedBannerCreationAvailable();

  // Update selectedPartnerId when preSelectedPartnerId changes
  useEffect(() => {
    if (preSelectedPartnerId && preSelectedPartnerId !== selectedPartnerId) {
      setSelectedPartnerId(preSelectedPartnerId);
    }
  }, [preSelectedPartnerId]);

  // Load product photos when partner is selected
  useEffect(() => {
    const loadPartnerPhotos = async () => {
      if (selectedPartnerId) {
        setIsLoadingPhotos(true);
        try {
          const photos = await getPartnerProductPhotos(selectedPartnerId);
          setPartnerProductPhotos(photos);
          console.log('Loaded partner product photos:', photos);
        } catch (error) {
          console.error('Error loading partner photos:', error);
        } finally {
          setIsLoadingPhotos(false);
        }
      } else {
        setPartnerProductPhotos([]);
        setSelectedExistingPhotoUrl(null);
      }
    };

    loadPartnerPhotos();
  }, [selectedPartnerId]);

  // Handle product image selection
  const handleProductImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProductImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProductImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove product image
  const removeProductImage = () => {
    setProductImageFile(null);
    setProductImagePreview(null);
    setSelectedExistingPhotoUrl(null);
  };

  // Handle selecting an existing product photo
  const handleSelectExistingPhoto = (photoUrl: string) => {
    setSelectedExistingPhotoUrl(photoUrl);
    setProductImageFile(null);
    setProductImagePreview(null);
    setShowAddNewPhoto(false);
  };

  // Handle uploading a new product photo
  const handleUploadNewPhoto = async (file: File) => {
    if (!selectedPartnerId) return;

    setIsUploadingPhoto(true);
    setUploadProgress(0);

    try {
      const photoUrl = await uploadProductPhoto(selectedPartnerId, file, (progress) => {
        setUploadProgress(progress);
      });

      if (photoUrl) {
        // Refresh the partner photos list
        const updatedPhotos = await getPartnerProductPhotos(selectedPartnerId);
        setPartnerProductPhotos(updatedPhotos);
        
        // Select the newly uploaded photo
        setSelectedExistingPhotoUrl(photoUrl);
        setProductImageFile(null);
        setProductImagePreview(null);
        setShowAddNewPhoto(false);

        toast({
          title: "Foto subida exitosamente",
          description: "La foto del producto ha sido agregada a la colección del partner",
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgress(0);
    }
  };

  // Handle removing a product photo
  const handleRemovePhoto = async (photoUrl: string) => {
    if (!selectedPartnerId) return;

    try {
      const success = await removeProductPhoto(selectedPartnerId, photoUrl);
      if (success) {
        // Refresh the partner photos list
        const updatedPhotos = await getPartnerProductPhotos(selectedPartnerId);
        setPartnerProductPhotos(updatedPhotos);
        
        // Clear selection if removed photo was selected
        if (selectedExistingPhotoUrl === photoUrl) {
          setSelectedExistingPhotoUrl(null);
        }

        toast({
          title: "Foto eliminada",
          description: "La foto del producto ha sido eliminada de la colección",
        });
      }
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setProductImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProductImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!selectedPartnerId) {
      toast({
        title: "Partner requerido",
        description: "Por favor selecciona un partner",
        variant: "destructive"
      });
      return false;
    }

    if (!productImageFile && !selectedExistingPhotoUrl) {
      toast({
        title: "Foto de producto requerida",
        description: "Por favor selecciona una foto del producto o sube una nueva",
        variant: "destructive"
      });
      return false;
    }

    if (!mainText.trim()) {
      toast({
        title: "Título principal requerido",
        description: "Por favor ingresa el título principal del banner",
        variant: "destructive"
      });
      return false;
    }

    if (mainText.length > 28) {
      toast({
        title: "Título muy largo",
        description: "El título debe tener máximo 28 caracteres",
        variant: "destructive"
      });
      return false;
    }

    if (!descriptionText.trim()) {
      toast({
        title: "Descripción requerida",
        description: "Por favor ingresa una descripción del banner",
        variant: "destructive"
      });
      return false;
    }

    if (descriptionText.length > 28) {
      toast({
        title: "Descripción muy larga",
        description: "La descripción debe tener máximo 28 caracteres",
        variant: "destructive"
      });
      return false;
    }

    if (!ctaText.trim()) {
      toast({
        title: "CTA requerido",
        description: "Por favor ingresa el texto del call-to-action",
        variant: "destructive"
      });
      return false;
    }

    if (ctaText.length > 14) {
      toast({
        title: "CTA muy largo",
        description: "El CTA debe tener máximo 14 caracteres",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  // Generate banner with enhanced workflow
  const generateBanner = async () => {
    if (!validateForm()) return;

    if (!enhancedBannerAvailable) {
      toast({
        title: "Configuración incompleta",
        description: "Se requiere configurar las API keys de OpenAI y Flux para usar esta funcionalidad",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressStatus('');
    setGenerationError(null);

    try {
      // Determine the product image source
      let finalProductImageFile: File;
      
      if (productImageFile) {
        // Use the uploaded file directly
        finalProductImageFile = productImageFile;
        console.log('Using uploaded file:', finalProductImageFile.name, finalProductImageFile.type);
      } else if (selectedExistingPhotoUrl) {
        setProgress(12);
        setProgressStatus('Preparando imagen del producto...');
        
        try {
          // Convert existing photo URL to File object with better error handling
          console.log('Fetching existing photo:', selectedExistingPhotoUrl);
          
          const response = await fetch(selectedExistingPhotoUrl, {
            method: 'GET',
            headers: {
              'Accept': 'image/*',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          console.log('Fetched blob:', blob.type, blob.size);
          
          // Validate blob
          if (!blob.type.startsWith('image/')) {
            throw new Error(`Invalid image type: ${blob.type}`);
          }
          
          if (blob.size === 0) {
            throw new Error('Empty image file');
          }
          
          if (blob.size > 10 * 1024 * 1024) { // 10MB limit
            throw new Error('Image file too large (max 10MB)');
          }
          
          // Create file with proper type
          const fileName = selectedExistingPhotoUrl.split('/').pop()?.split('?')[0] || 'product-photo.jpg';
          const fileType = blob.type || 'image/jpeg';
          
          finalProductImageFile = new File([blob], fileName, { 
            type: fileType,
            lastModified: Date.now()
          });
          
          console.log('Created file object:', finalProductImageFile.name, finalProductImageFile.type, finalProductImageFile.size);
          
        } catch (fetchError) {
          console.error('Error processing existing photo:', fetchError);
          throw new Error(`No se pudo procesar la foto seleccionada: ${fetchError}`);
        }
      } else {
        throw new Error('No product image selected');
      }

      const request: BannerCreationRequest = {
        partnerId: selectedPartnerId,
        partnerName: selectedPartner?.name || '',
        productImageFile: finalProductImageFile,
        mainText,
        descriptionText,
        ctaText,

        styleAnalysis: selectedPartner?.reference_style_analysis
      };

      console.log('Starting enhanced banner creation...');
      const result = await createEnhancedBanner(request, (progress, status) => {
          setProgress(progress);
          setProgressStatus(status);
        });

      console.log('Banner created successfully:', result);
      
      // Open editor with the generated banner
      setEditorBannerId(result.bannerId);
        setShowEditor(true);
        
      // Reset form
      resetForm();

    } catch (error) {
      console.error('Error generating banner:', error);
      setGenerationError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedPartnerId(preSelectedPartnerId || '');
    setMainText('');
    setDescriptionText('');
    setCtaText('');

    setProductImageFile(null);
    setProductImagePreview(null);
    setSelectedExistingPhotoUrl(null);
    setShowAddNewPhoto(false);
    setProgress(0);
    setProgressStatus('');
    setGenerationError(null);
  };

  // Close editor
  const closeEditor = () => {
    setShowEditor(false);
    setEditorBannerId(null);
  };

     if (showEditor && editorBannerId) {
    return (
      <BannerEditor
                 backgroundImageUrl=""
        partnerId={selectedPartnerId}
        partnerName={selectedPartner?.name || ''}
        partnerLogoUrl={selectedPartner?.logo_url}
        bannerText={mainText}
        descriptionText={descriptionText}
        ctaText={ctaText}
        bannerId={editorBannerId}
        onExit={closeEditor}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Crear Banner Personalizado
          </CardTitle>
          <CardDescription>
            Crea banners personalizados con análisis automático del producto y estilo de marca
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Configuration Alert */}
          {!enhancedBannerAvailable && (
            <Alert>
            <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuración requerida</AlertTitle>
            <AlertDescription>
                Para usar esta funcionalidad, necesitas configurar las API keys de OpenAI y Flux en tu archivo .env.local
            </AlertDescription>
          </Alert>
          )}

          {/* Partner Selection */}
          <div className="space-y-2">
            <Label htmlFor="partner-select">Partner</Label>
            <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un partner" />
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    <div className="flex items-center gap-2">
                      {partner.logo_url && (
                        <img 
                          src={partner.logo_url} 
                          alt={partner.name}
                          className="w-6 h-6 object-contain"
                        />
                      )}
                      <span>{partner.name}</span>
                      {partner.reference_style_analysis && (
                        <Badge variant="secondary" className="ml-2">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Estilo analizado
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Image Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="product-image">Foto de producto</Label>
              {selectedPartnerId && partnerProductPhotos.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {partnerProductPhotos.length} fotos disponibles
                </Badge>
              )}
            </div>

            {/* Show existing partner photos */}
            {selectedPartnerId && (
              <div className="space-y-4">
                {isLoadingPhotos ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Cargando fotos del partner...</p>
                  </div>
                ) : (
                  <>
                    {/* Existing Photos Grid */}
                    {partnerProductPhotos.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-3">Fotos existentes del partner:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {partnerProductPhotos.map((photo) => (
                            <div key={photo.id} className="relative group">
                              <div 
                                className={`border-2 rounded-lg p-2 cursor-pointer transition-all ${
                                  selectedExistingPhotoUrl === photo.url 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleSelectExistingPhoto(photo.url)}
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.fileName}
                                  className="w-full h-24 object-cover rounded"
                                />
                                {selectedExistingPhotoUrl === photo.url && (
                                  <div className="absolute top-1 right-1">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 bg-white rounded-full" />
                                  </div>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePhoto(photo.url);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add New Photo Section */}
                    <div className="border-t pt-4">
                      {!showAddNewPhoto ? (
                    <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddNewPhoto(true)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar nueva foto de producto
                    </Button>
                      ) : (
                        <div className="space-y-4">
                          {/* Upload Progress */}
                          {isUploadingPhoto && (
                            <div className="space-y-2">
                              <Progress value={uploadProgress} className="w-full" />
                              <p className="text-sm text-center text-gray-600">
                                Subiendo foto... {uploadProgress}%
                              </p>
                  </div>
                          )}

                          {/* New Photo Upload Area */}
                          {!productImageFile ? (
                            <div 
                              className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                              onDragOver={handleDragOver}
                              onDrop={handleDrop}
                              onClick={() => document.getElementById('file-input')?.click()}
                            >
                              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                                <Upload className="h-6 w-6 text-blue-600" />
                              </div>
                              <p className="text-sm font-semibold mb-2 text-gray-700">Agregar nueva foto</p>
                              <p className="text-xs text-gray-500 mb-4">
                                Arrastra y suelta una imagen aquí o haz clic para seleccionar
                              </p>
                              <div className="text-xs text-gray-400 space-y-1">
                                <div>PNG, JPG hasta 10MB</div>
                                <div className="flex items-center justify-center gap-2">
                                  {isWebGPUSupported() ? (
                                    <span className="text-green-600 font-medium">⚡ Aceleración GPU disponible</span>
                                  ) : (
                                    <span className="text-amber-600">🚀 Procesamiento optimizado</span>
                                  )}
                                </div>
                  </div>
                              <input
                                id="file-input"
                                type="file"
                                accept="image/*"
                                onChange={handleProductImageChange}
                                className="hidden"
                    />
                  </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Preview Section */}
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm font-medium text-gray-700 mb-3">Vista previa:</p>
                                <div className="relative inline-block">
                                  <img
                                    src={productImagePreview!}
                                    alt="Vista previa de nueva foto"
                                    className="max-w-full h-32 object-contain rounded-lg border border-gray-200"
                                  />
                    <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setProductImageFile(null);
                                      setProductImagePreview(null);
                                    }}
                                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-white border-2 border-gray-300 hover:border-red-300 hover:bg-red-50"
                                  >
                                    <X className="h-3 w-3" />
                    </Button>
                  </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3">
                                <Button
                                  type="button"
                                  onClick={() => handleUploadNewPhoto(productImageFile)}
                                  disabled={isUploadingPhoto}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                  {isUploadingPhoto ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                      Subiendo...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-4 w-4 mr-2" />
                                      Subir y usar esta foto
                                    </>
                                  )}
                                </Button>
                <Button
                                  type="button"
                  variant="outline"
                                  onClick={() => {
                                    setProductImageFile(null);
                                    setProductImagePreview(null);
                                  }}
                                  disabled={isUploadingPhoto}
                                  className="px-4"
                                >
                                  Cambiar
                </Button>
              </div>
                    </div>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowAddNewPhoto(false)}
                            className="w-full mt-3 text-gray-600 hover:text-gray-800"
                          >
                            Cancelar
                          </Button>
                      </div>
                    )}
                    </div>
                  </>
                )}
                    </div>
            )}

            {/* No partner selected message */}
            {!selectedPartnerId && (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-2">Selecciona un partner primero</p>
                <p className="text-sm text-gray-400">
                  Las fotos de productos se cargarán automáticamente
                </p>
                    </div>
                  )}

            {/* Selection indicator */}
            {(selectedExistingPhotoUrl || productImageFile) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">
                    Foto de producto seleccionada: {
                      productImageFile ? 'Nueva foto (pendiente de subir)' : 'Foto existente'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Main Text */}
          <div className="space-y-2">
            <Label htmlFor="main-text">Título principal</Label>
            <Textarea
              id="main-text"
              value={mainText}
              onChange={(e) => setMainText(e.target.value)}
              placeholder="Ingresa el título principal del banner"
              rows={2}
              maxLength={28}
              className={`resize-none ${
                mainText.length >= 28 ? 'border-red-500 focus:border-red-500' :
                mainText.length >= 24 ? 'border-orange-400 focus:border-orange-400' :
                'border-gray-300 focus:border-blue-500'
              }`}
            />
            <div className={`text-xs text-right flex items-center justify-between ${
              mainText.length >= 28 ? 'text-red-600' :
              mainText.length >= 24 ? 'text-orange-600' :
              'text-gray-500'
            }`}>
              {mainText.length >= 28 && (
                <span className="text-red-600 text-xs">⚠️ Límite alcanzado</span>
              )}
              {mainText.length >= 24 && mainText.length < 28 && (
                <span className="text-orange-600 text-xs">⚠️ Cerca del límite</span>
              )}
              <span>{mainText.length}/28</span>
            </div>
          </div>

          {/* Description Text */}
          <div className="space-y-2">
            <Label htmlFor="description-text">Descripción</Label>
            <Textarea
              id="description-text"
              value={descriptionText}
              onChange={(e) => setDescriptionText(e.target.value)}
              placeholder="Ingresa una descripción más detallada"
              rows={2}
              maxLength={28}
              className={`resize-none ${
                descriptionText.length >= 28 ? 'border-red-500 focus:border-red-500' :
                descriptionText.length >= 24 ? 'border-orange-400 focus:border-orange-400' :
                'border-gray-300 focus:border-blue-500'
              }`}
            />
            <div className={`text-xs text-right flex items-center justify-between ${
              descriptionText.length >= 28 ? 'text-red-600' :
              descriptionText.length >= 24 ? 'text-orange-600' :
              'text-gray-500'
            }`}>
              {descriptionText.length >= 28 && (
                <span className="text-red-600 text-xs">⚠️ Límite alcanzado</span>
              )}
              {descriptionText.length >= 24 && descriptionText.length < 28 && (
                <span className="text-orange-600 text-xs">⚠️ Cerca del límite</span>
              )}
              <span>{descriptionText.length}/28</span>
            </div>
          </div>

          {/* CTA Text */}
          <div className="space-y-2">
            <Label htmlFor="cta-text">Call-to-Action (CTA)</Label>
            <Input
              id="cta-text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Ej: Comprar ahora"
              maxLength={14}
              className={`${
                ctaText.length >= 14 ? 'border-red-500 focus:border-red-500' :
                ctaText.length >= 12 ? 'border-orange-400 focus:border-orange-400' :
                'border-gray-300 focus:border-blue-500'
              }`}
            />
            <div className={`text-xs text-right flex items-center justify-between ${
              ctaText.length >= 14 ? 'text-red-600' :
              ctaText.length >= 12 ? 'text-orange-600' :
              'text-gray-500'
            }`}>
              {ctaText.length >= 14 && (
                <span className="text-red-600 text-xs">⚠️ Límite alcanzado</span>
              )}
              {ctaText.length >= 12 && ctaText.length < 14 && (
                <span className="text-orange-600 text-xs">⚠️ Cerca del límite</span>
              )}
              <span>{ctaText.length}/14</span>
            </div>
          </div>



          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                {progressStatus || 'Generando banner...'}
              </p>
            </div>
          )}

          {/* Generation Error */}
          {generationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error en la generación</AlertTitle>
              <AlertDescription>{generationError}</AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateBanner}
            disabled={isGenerating || !enhancedBannerAvailable}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generando banner...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generar Banner
              </>
            )}
          </Button>
            </CardContent>
          </Card>
    </div>
  );
};

export default BannerGeneration;
