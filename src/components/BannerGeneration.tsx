
import React, { useState } from 'react';
import { Wand2, Download, RefreshCw, Edit3, Copy, Type, Palette, Sparkles, Tag, Image } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { usePartners } from '@/hooks/usePartners';

interface BannerOption {
  id: string;
  desktopUrl: string;
  mobileUrl: string;
  style: string;
  copy: string;
  bannerType: string;
  flavor: string;
}

interface GeneratedBanner {
  id: string;
  partnerId: string;
  partnerName: string;
  selectedOption: BannerOption;
  customCopy: string;
  createdAt: string;
}

const BannerGeneration = () => {
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [bannerType, setBannerType] = useState('');
  const [promotionDiscount, setPromotionDiscount] = useState('');
  const [bannerCopy, setBannerCopy] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedOptions, setGeneratedOptions] = useState<BannerOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<BannerOption | null>(null);
  const [customCopy, setCustomCopy] = useState('');
  const [isInArtboard, setIsInArtboard] = useState(false);
  const [savedBanners, setSavedBanners] = useState<GeneratedBanner[]>([]);

  const { partners, isLoading: partnersLoading } = usePartners();

  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  const bannerStyles = [
    { id: 'bold', name: 'Bold & Dynamic', description: 'Strong colors and bold typography' },
    { id: 'minimal', name: 'Minimal', description: 'Clean and simple design' },
    { id: 'vibrant', name: 'Vibrant', description: 'Colorful and energetic design' }
  ];

  const bannerFlavors = [
    { id: 'contextual', name: 'Contextual', description: 'Lifestyle or situational imagery' },
    { id: 'product', name: 'Product Photo', description: 'Focus on product imagery' }
  ];

  const generateBannerOptions = async () => {
    if (!selectedPartnerId || !bannerType || !bannerCopy || !selectedStyle || !selectedFlavor) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (bannerType === 'promotion' && !promotionDiscount) {
      toast({
        title: "Missing discount",
        description: "Please enter the promotion discount percentage",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    // Simulate AI generation progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 15;
      });
    }, 200);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create AI prompt based on user inputs
      const styleDescription = bannerStyles.find(s => s.id === selectedStyle)?.name || selectedStyle;
      const flavorDescription = bannerFlavors.find(f => f.id === selectedFlavor)?.name || selectedFlavor;
      const typeDescription = bannerType === 'promotion' ? `promotion with ${promotionDiscount}% discount` : 'general';
      
      console.log(`AI Prompt: Create a ${styleDescription} banner for ${selectedPartner?.name} with ${flavorDescription} imagery. Banner type: ${typeDescription}. Copy: "${bannerCopy}"`);

      // Generate banner option based on user specifications
      const option: BannerOption = {
        id: '1',
        desktopUrl: `https://via.placeholder.com/720x169/4A90E2/FFFFFF?text=${encodeURIComponent(`${selectedPartner?.name || ''} - ${styleDescription} - ${bannerCopy.substring(0, 20)}...`)}`,
        mobileUrl: `https://via.placeholder.com/492x225/4A90E2/FFFFFF?text=${encodeURIComponent(`${selectedPartner?.name || ''} - Mobile`)}`,
        style: styleDescription,
        copy: bannerCopy,
        bannerType: typeDescription,
        flavor: flavorDescription
      };

      setGeneratedOptions([option]);
      setSelectedOption(option);
      setCustomCopy(bannerCopy);
      setIsInArtboard(true);

      toast({
        title: "Banner generated!",
        description: `Banner created for ${selectedPartner?.name} with your specifications`,
      });

    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
      clearInterval(interval);
    }
  };

  const selectOption = (option: BannerOption) => {
    setSelectedOption(option);
    setCustomCopy(option.copy);
    setIsInArtboard(true);
  };

  const downloadBanner = (size: 'desktop' | 'mobile') => {
    if (!selectedOption) return;
    
    const url = size === 'desktop' ? selectedOption.desktopUrl : selectedOption.mobileUrl;
    const dimensions = size === 'desktop' ? '1440x338' : '984x450';
    
    toast({
      title: "Download started",
      description: `Downloading ${size} banner (${dimensions}px)`,
    });
  };

  const saveBanner = () => {
    if (!selectedOption || !selectedPartner) return;

    const newBanner: GeneratedBanner = {
      id: Date.now().toString(),
      partnerId: selectedPartner.id,
      partnerName: selectedPartner.name,
      selectedOption: { ...selectedOption, copy: customCopy },
      customCopy,
      createdAt: new Date().toISOString()
    };

    setSavedBanners(prev => [newBanner, ...prev]);
    setIsInArtboard(false);
    setSelectedOption(null);
    setGeneratedOptions([]);
    setSelectedPartnerId('');
    setBannerType('');
    setPromotionDiscount('');
    setBannerCopy('');
    setSelectedStyle('');
    setSelectedFlavor('');
    setCustomCopy('');

    toast({
      title: "Banner saved!",
      description: `Banner for ${selectedPartner.name} has been saved to your projects`,
    });
  };

  const backToOptions = () => {
    setIsInArtboard(false);
    setSelectedOption(null);
  };

  const formatRegions = (regions: string[]) => {
    const regionLabels: Record<string, string> = {
      'argentina-uruguay': 'Argentina & Uruguay',
      'latam': 'LATAM',
    };
    return regions.map(region => regionLabels[region] || region).join(', ');
  };

  if (isInArtboard && selectedOption && selectedPartner) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <Edit3 className="w-6 h-6 mr-2 text-blue-600" />
                Banner Artboard - {selectedPartner.name}
              </CardTitle>
              <CardDescription>Customize your banner and download</CardDescription>
            </div>
            <Button variant="outline" onClick={backToOptions}>
              Back to Generate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Banner Preview */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Desktop Version (1440x338px)
              </Label>
              <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <img
                  src={selectedOption.desktopUrl}
                  alt="Desktop Banner"
                  className="w-full max-w-2xl mx-auto rounded-lg shadow-sm"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Mobile Version (984x450px)
              </Label>
              <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <img
                  src={selectedOption.mobileUrl}
                  alt="Mobile Banner"
                  className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Copy Editor */}
          <div className="space-y-3">
            <Label htmlFor="customCopy" className="text-sm font-medium text-gray-700 flex items-center">
              <Type className="w-4 h-4 mr-2" />
              Banner Copy
            </Label>
            <Textarea
              id="customCopy"
              value={customCopy}
              onChange={(e) => setCustomCopy(e.target.value)}
              placeholder="Enter your banner copy..."
              className="bg-white/50 border-gray-200 focus:border-blue-500 resize-none"
              rows={3}
              maxLength={100}
            />
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Characters: {customCopy.length}/100</span>
              <div className="flex space-x-2">
                <Badge variant="outline" className="text-xs">
                  {selectedOption.style}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {selectedOption.bannerType}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {selectedOption.flavor}
                </Badge>
              </div>
            </div>
          </div>

          {/* Partner Branding Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              Partner Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Regions:</span>
                <p className="text-sm font-medium text-gray-900">{formatRegions(selectedPartner.regions)}</p>
              </div>
              {selectedPartner.description && (
                <div>
                  <span className="text-sm text-gray-600">Description:</span>
                  <p className="text-sm font-medium text-gray-900">{selectedPartner.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => downloadBanner('desktop')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Desktop
            </Button>
            <Button
              onClick={() => downloadBanner('mobile')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Mobile
            </Button>
            <Button
              onClick={saveBanner}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Save to Projects
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Configuration Form */}
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <Wand2 className="w-6 h-6 mr-2 text-blue-600" />
            AI Banner Generation
          </CardTitle>
          <CardDescription>Configure your banner specifications for optimal AI generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Partner Selection */}
            <div>
              <Label htmlFor="partner">1. Select Partner *</Label>
              {partnersLoading ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                  <p className="text-blue-800 text-sm">Loading partners...</p>
                </div>
              ) : partners.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-2">
                  <p className="text-yellow-800 text-sm">
                    No partners available. Please create a partner first in the Partners tab.
                  </p>
                </div>
              ) : (
                <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                  <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 mt-2">
                    <SelectValue placeholder="Choose a partner from your database" />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-lg border border-gray-200 z-50">
                    {partners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-4 rounded bg-blue-500"></div>
                          <div>
                            <span className="font-medium">{partner.name}</span>
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
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                2. Banner Type *
              </Label>
              <RadioGroup value={bannerType} onValueChange={setBannerType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="general" id="general" />
                  <Label htmlFor="general">General Banner</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="promotion" id="promotion" />
                  <Label htmlFor="promotion">Promotion Banner (with discount)</Label>
                </div>
              </RadioGroup>
              
              {bannerType === 'promotion' && (
                <div className="mt-3">
                  <Label htmlFor="discount">Discount Percentage *</Label>
                  <Input
                    id="discount"
                    type="number"
                    placeholder="e.g., 20"
                    value={promotionDiscount}
                    onChange={(e) => setPromotionDiscount(e.target.value)}
                    className="bg-white/50 border-gray-200 focus:border-blue-500 mt-1"
                    min="1"
                    max="100"
                  />
                </div>
              )}
            </div>

            {/* Banner Copy */}
            <div>
              <Label htmlFor="bannerCopy" className="text-sm font-medium text-gray-700 mb-2 block flex items-center">
                <Type className="w-4 h-4 mr-2" />
                3. Banner Copy *
              </Label>
              <Textarea
                id="bannerCopy"
                value={bannerCopy}
                onChange={(e) => setBannerCopy(e.target.value)}
                placeholder="Enter the text that will appear on your banner..."
                className="bg-white/50 border-gray-200 focus:border-blue-500 resize-none"
                rows={3}
                maxLength={100}
              />
              <div className="text-sm text-gray-500 mt-1">
                Characters: {bannerCopy.length}/100
              </div>
            </div>

            {/* Style Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
                <Palette className="w-4 h-4 mr-2" />
                4. Banner Style *
              </Label>
              <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle}>
                {bannerStyles.map((style) => (
                  <div key={style.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={style.id} id={style.id} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={style.id} className="font-medium cursor-pointer">
                        {style.name}
                      </Label>
                      <p className="text-sm text-gray-600">{style.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Flavor Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
                <Image className="w-4 h-4 mr-2" />
                5. Banner Flavor *
              </Label>
              <RadioGroup value={selectedFlavor} onValueChange={setSelectedFlavor}>
                {bannerFlavors.map((flavor) => (
                  <div key={flavor.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={flavor.id} id={flavor.id} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={flavor.id} className="font-medium cursor-pointer">
                        {flavor.name}
                      </Label>
                      <p className="text-sm text-gray-600">{flavor.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Selected Partner Info */}
            {selectedPartner && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Selected Partner Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Regions:</span>
                    <span className="ml-2 font-medium">{formatRegions(selectedPartner.regions)}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Status:</span>
                    <span className="ml-2 font-medium capitalize">{selectedPartner.status}</span>
                  </div>
                  {selectedPartner.description && (
                    <div className="md:col-span-2">
                      <span className="text-blue-700">Description:</span>
                      <span className="ml-2 font-medium">{selectedPartner.description}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Generation Progress */}
            {isGenerating && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center mb-3">
                  <Sparkles className="w-5 h-5 text-purple-600 mr-2 animate-pulse" />
                  <span className="text-purple-700 font-medium">Generating optimized banner...</span>
                </div>
                <Progress value={progress} className="h-2 bg-purple-100" />
                <p className="text-sm text-purple-600 mt-2">
                  AI is creating banner with your specifications: {selectedStyle && bannerStyles.find(s => s.id === selectedStyle)?.name}, {selectedFlavor && bannerFlavors.find(f => f.id === selectedFlavor)?.name}
                </p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={generateBannerOptions}
              disabled={isGenerating || !selectedPartnerId || !bannerType || !bannerCopy || !selectedStyle || !selectedFlavor || partnersLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating Banner...
                </div>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Optimized Banner
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Saved Banners */}
      {savedBanners.length > 0 && (
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Your Banner Projects</CardTitle>
            <CardDescription>Previously created banners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedBanners.map((banner) => (
                <div key={banner.id} className="bg-white/50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900">{banner.partnerName}</h4>
                    <div className="flex space-x-1">
                      <Badge variant="outline" className="text-xs">
                        {banner.selectedOption.style}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {banner.selectedOption.bannerType}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{banner.customCopy}</p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Download className="w-3 h-3 mr-1" />
                      Desktop
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-3 h-3 mr-1" />
                      Mobile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BannerGeneration;
