import React, { useState } from 'react';
import { Wand2, Download, ChevronLeft, ChevronRight, RefreshCw, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { usePartners } from '@/hooks/usePartners';
import BannerFormInputs from '@/components/BannerFormInputs';
import BannerChat from '@/components/BannerChat';

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
  // Form state
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [bannerType, setBannerType] = useState('');
  const [promotionDiscount, setPromotionDiscount] = useState('');
  const [bannerCopy, setBannerCopy] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedOptions, setGeneratedOptions] = useState<BannerOption[]>([]);
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  // Layout state
  const [isInputMinimized, setIsInputMinimized] = useState(false);
  const [savedBanners, setSavedBanners] = useState<GeneratedBanner[]>([]);

  const { partners, isLoading: partnersLoading } = usePartners();
  const selectedPartner = partners.find(p => p.id === selectedPartnerId);
  const currentOption = generatedOptions[currentOptionIndex];

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

      const bannerStyles = ['Bold & Dynamic', 'Minimal', 'Vibrant'];
      const bannerFlavors = ['Contextual', 'Product Photo'];
      
      const styleDescription = bannerStyles.find(s => s.toLowerCase().replace(/\s+/g, '-').replace('&', '').replace(/--/g, '-') === selectedStyle) || selectedStyle;
      const flavorDescription = bannerFlavors.find(f => f.toLowerCase().replace(/\s+/g, '-') === selectedFlavor) || selectedFlavor;
      const typeDescription = bannerType === 'promotion' ? `promotion with ${promotionDiscount}% discount` : 'general';
      
      console.log(`AI Prompt: Create a ${styleDescription} banner for ${selectedPartner?.name} with ${flavorDescription} imagery. Banner type: ${typeDescription}. Copy: "${bannerCopy}"`);

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
      setCurrentOptionIndex(0);
      setHasGenerated(true);
      setIsInputMinimized(true);

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

  const handleIteration = (message: string) => {
    console.log('Iteration request:', message);
    toast({
      title: "Iteration request received",
      description: "AI is processing your changes...",
    });
  };

  const downloadBanner = (size: 'desktop' | 'mobile') => {
    if (!currentOption) return;
    
    const url = size === 'desktop' ? currentOption.desktopUrl : currentOption.mobileUrl;
    const dimensions = size === 'desktop' ? '1440x338' : '984x450';
    
    toast({
      title: "Download started",
      description: `Downloading ${size} banner (${dimensions}px)`,
    });
  };

  const saveBanner = () => {
    if (!currentOption || !selectedPartner) return;

    const newBanner: GeneratedBanner = {
      id: Date.now().toString(),
      partnerId: selectedPartner.id,
      partnerName: selectedPartner.name,
      selectedOption: currentOption,
      customCopy: bannerCopy,
      createdAt: new Date().toISOString()
    };

    setSavedBanners(prev => [newBanner, ...prev]);

    toast({
      title: "Banner saved!",
      description: `Banner for ${selectedPartner.name} has been saved to your projects`,
    });
  };

  const resetForm = () => {
    setSelectedPartnerId('');
    setBannerType('');
    setPromotionDiscount('');
    setBannerCopy('');
    setSelectedStyle('');
    setSelectedFlavor('');
    setGeneratedOptions([]);
    setHasGenerated(false);
    setIsInputMinimized(false);
    setCurrentOptionIndex(0);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-8 p-8 bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Left Column - Chat (when generated) or Inputs (when not generated) */}
      <div className={`transition-all duration-300 ${hasGenerated ? 'w-96' : 'w-[420px]'} flex-shrink-0`}>
        {hasGenerated ? (
          <BannerChat
            onIterationRequest={handleIteration}
            isGenerating={isGenerating}
          />
        ) : (
          <BannerFormInputs
            selectedPartnerId={selectedPartnerId}
            setSelectedPartnerId={setSelectedPartnerId}
            bannerType={bannerType}
            setBannerType={setBannerType}
            promotionDiscount={promotionDiscount}
            setPromotionDiscount={setPromotionDiscount}
            bannerCopy={bannerCopy}
            setBannerCopy={setBannerCopy}
            selectedStyle={selectedStyle}
            setSelectedStyle={setSelectedStyle}
            selectedFlavor={selectedFlavor}
            setSelectedFlavor={setSelectedFlavor}
            partners={partners}
            partnersLoading={partnersLoading}
            selectedPartner={selectedPartner}
            isGenerating={isGenerating}
            progress={progress}
            onGenerate={generateBannerOptions}
          />
        )}
      </div>

      {/* Right Column - Generated Banners & Configuration Summary */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Configuration Summary (when generated) */}
        {hasGenerated && (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Banner Configuration</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={resetForm} className="rounded-lg border-gray-200 hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Banner
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="font-semibold text-gray-700 text-sm">Partner</span>
                    <p className="text-gray-900 font-medium">{selectedPartner?.name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-gray-700 text-sm">Type</span>
                    <p className="text-gray-900 font-medium">
                      {bannerType}
                      {bannerType === 'promotion' && ` (${promotionDiscount}% off)`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-gray-700 text-sm">Style</span>
                    <p className="text-gray-900 font-medium">{selectedStyle}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-gray-700 text-sm">Image Type</span>
                    <p className="text-gray-900 font-medium">{selectedFlavor}</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <span className="font-semibold text-gray-700 text-sm">Banner Text</span>
                  <p className="text-gray-900 font-medium mt-1">"{bannerCopy}"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Banner Preview */}
        {hasGenerated && currentOption ? (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl flex-1">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Wand2 className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Generated Banner</CardTitle>
                </div>
                {generatedOptions.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentOptionIndex(Math.max(0, currentOptionIndex - 1))}
                      disabled={currentOptionIndex === 0}
                      className="rounded-lg"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium px-3">
                      {currentOptionIndex + 1} of {generatedOptions.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentOptionIndex(Math.min(generatedOptions.length - 1, currentOptionIndex + 1))}
                      disabled={currentOptionIndex === generatedOptions.length - 1}
                      className="rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6 pt-0">
              {/* Desktop Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">Desktop Version</h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">1440×338px</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <img
                    src={currentOption.desktopUrl}
                    alt="Desktop Banner"
                    className="w-full rounded-lg border border-gray-200 shadow-sm"
                  />
                </div>
              </div>

              {/* Mobile Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">Mobile Version</h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">984×450px</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <img
                    src={currentOption.mobileUrl}
                    alt="Mobile Banner"
                    className="w-full max-w-sm mx-auto rounded-lg border border-gray-200 shadow-sm"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => downloadBanner('desktop')}
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl flex-1"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Desktop
                </Button>
                <Button
                  onClick={() => downloadBanner('mobile')}
                  className="bg-green-600 hover:bg-green-700 rounded-xl flex-1"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Mobile
                </Button>
                <Button
                  onClick={saveBanner}
                  className="bg-purple-600 hover:bg-purple-700 rounded-xl"
                  size="lg"
                >
                  Save Project
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1 bg-white/60 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Wand2 className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Ready to Create Magic</h3>
                <p className="text-gray-600 max-w-md">Fill out the form on the left to generate your perfect banner design in seconds</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BannerGeneration;
