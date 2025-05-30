import React, { useState } from 'react';
import { Upload, Check, AlertCircle, Download } from 'lucide-react';
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
    benefitsDescription: '',
    description: '',
  });
  
  const [logo, setLogo] = useState<File | null>(null);
  const [brandManual, setBrandManual] = useState<File | null>(null);
  const [referenceBanners, setReferenceBanners] = useState<File[]>([]);

  const regions = [
    { id: 'argentina-uruguay', label: 'Argentina & Uruguay', description: 'Tone: Local, familiar' },
    { id: 'latam', label: 'LATAM', description: 'Tone: Spanish LATAM neutral' }
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

  const removeReferenceBanner = (index: number) => {
    setReferenceBanners(prev => prev.filter((_, i) => i !== index));
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
      benefits_description: formData.benefitsDescription || undefined,
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
        benefitsDescription: '',
        description: '',
      });
      setLogo(null);
      setBrandManual(null);
      setReferenceBanners([]);
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Create New Partner</CardTitle>
        <CardDescription>Add a new partner to your platform</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Partner Name */}
          <div className="space-y-2">
            <Label htmlFor="partnerName" className="text-sm font-medium text-gray-700">
              Partner Name *
            </Label>
            <Input
              id="partnerName"
              value={formData.partnerName}
              onChange={(e) => handleInputChange('partnerName', e.target.value)}
              placeholder="Enter partner name"
              className="bg-white/50 border-gray-200 focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* Regions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Regions * (Select all that apply)
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
              Partner URL
              <span className="text-xs text-gray-500 ml-2">(used for branding colors)</span>
            </Label>
            <Input
              id="partnerURL"
              type="url"
              value={formData.partnerURL}
              onChange={(e) => handleInputChange('partnerURL', e.target.value)}
              placeholder="https://www.partner-website.com"
              className="bg-white/50 border-gray-200 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Benefits Description */}
          <div className="space-y-2">
            <Label htmlFor="benefitsDescription" className="text-sm font-medium text-gray-700">
              Benefits Description
              <span className="text-xs text-gray-500 ml-2">(used for copy information)</span>
            </Label>
            <Textarea
              id="benefitsDescription"
              value={formData.benefitsDescription}
              onChange={(e) => handleInputChange('benefitsDescription', e.target.value)}
              placeholder="Describe the benefits users get with Bonda (e.g., 20% discount, free shipping...)"
              className="bg-white/50 border-gray-200 focus:border-blue-500 transition-colors resize-none"
              rows={3}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Additional Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the partner..."
              className="bg-white/50 border-gray-200 focus:border-blue-500 transition-colors resize-none"
              rows={3}
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Partner Logo (PNG)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white/30 hover:border-blue-400 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Upload partner logo (PNG format)</p>
                  <p className="text-xs text-gray-500">Maximum file size: 5MB</p>
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
                  Choose Logo
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
            <Label className="text-sm font-medium text-gray-700">Brand Manual (CSV)</Label>
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={downloadBrandManualTemplate}
                className="w-full justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </Button>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white/30 hover:border-blue-400 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Upload completed brand manual (CSV)</p>
                    <p className="text-xs text-gray-500">Fill out the template with brand colors and fonts</p>
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
                    Upload Brand Manual
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

          {/* Reference Banners (Optional) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Reference Banners (Optional)
              <span className="text-xs text-gray-500 ml-2">(for AI context)</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white/30 hover:border-blue-400 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Upload existing banners for reference</p>
                  <p className="text-xs text-gray-500">Images only, maximum 10MB each</p>
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
                  Choose Reference Banners
                </Button>
              </div>
              
              {referenceBanners.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Selected files:</p>
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
                        ×
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
                Creating Partner...
              </div>
            ) : (
              'Create Partner'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PartnerCreationForm;
