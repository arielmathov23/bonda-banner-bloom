
import React, { useState } from 'react';
import { Wand2, Download, ChevronLeft, ChevronRight, Minimize2, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
    // Here you would implement the AI iteration logic
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
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      {/* Left Column - Inputs */}
      <div className={`transition-all duration-300 ${isInputMinimized ? 'w-80' : 'w-1/2'}`}>
        <Card className="h-full bg-white/60 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <Wand2 className="w-6 h-6 mr-2 text-blue-600" />
                  Banner Configuration
                </CardTitle>
                <CardDescription>Configure your banner specifications</CardDescription>
              </div>
              {hasGenerated && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsInputMinimized(!isInputMinimized)}
                  >
                    {isInputMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetForm}>
                    New Banner
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto">
            {!isInputMinimized && (
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

            {isInputMinimized && hasGenerated && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Partner:</span> {selectedPartner?.name}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Type:</span> {bannerType}
                  {bannerType === 'promotion' && ` (${promotionDiscount}%)`}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Style:</span> {selectedStyle}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Copy:</span> {bannerCopy}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Generated Banners & Chat */}
      <div className={`transition-all duration-300 ${isInputMinimized ? 'flex-1' : 'w-1/2'} flex flex-col gap-6`}>
        {/* Banner Preview */}
        {hasGenerated && currentOption && (
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900">
                  Generated Banner
                </CardTitle>
                <div className="flex items-center gap-2">
                  {generatedOptions.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentOptionIndex(Math.max(0, currentOptionIndex - 1))}
                        disabled={currentOptionIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-600">
                        {currentOptionIndex + 1} of {generatedOptions.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentOptionIndex(Math.min(generatedOptions.length - 1, currentOptionIndex + 1))}
                        disabled={currentOptionIndex === generatedOptions.length - 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Desktop Preview */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Desktop (1440x338px)</div>
                <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                  <img
                    src={currentOption.desktopUrl}
                    alt="Desktop Banner"
                    className="w-full rounded-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Mobile Preview */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Mobile (984x450px)</div>
                <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                  <img
                    src={currentOption.mobileUrl}
                    alt="Mobile Banner"
                    className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
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
        )}

        {/* Chat Interface */}
        {hasGenerated && (
          <div className="flex-1">
            <BannerChat
              onIterationRequest={handleIteration}
              isGenerating={isGenerating}
            />
          </div>
        )}

        {/* Welcome Message */}
        {!hasGenerated && (
          <Card className="flex-1 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <Wand2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Ready to Generate</h3>
                <p>Configure your banner settings and click generate to see your banner here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BannerGeneration;
