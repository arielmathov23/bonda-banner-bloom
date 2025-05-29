
import React, { useState } from 'react';
import { Wand2, Download, RefreshCw, Edit3, Copy, Type, Palette, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface Partner {
  id: string;
  name: string;
  logo: string;
  brandColors: string[];
  industry: string;
  brandingStyle: string;
}

interface BannerOption {
  id: string;
  desktopUrl: string;
  mobileUrl: string;
  style: string;
  copy: string;
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedOptions, setGeneratedOptions] = useState<BannerOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<BannerOption | null>(null);
  const [customCopy, setCustomCopy] = useState('');
  const [isInArtboard, setIsInArtboard] = useState(false);
  const [savedBanners, setSavedBanners] = useState<GeneratedBanner[]>([]);

  // Mock partner data with branding information
  const partners: Partner[] = [
    {
      id: '1',
      name: 'TechCorp Solutions',
      logo: 'https://via.placeholder.com/120x60/4A90E2/FFFFFF?text=TechCorp',
      brandColors: ['#4A90E2', '#FFFFFF', '#2C3E50'],
      industry: 'Technology',
      brandingStyle: 'Modern & Professional'
    },
    {
      id: '2',
      name: 'Global Finance Ltd',
      logo: 'https://via.placeholder.com/120x60/50E3C2/FFFFFF?text=Finance',
      brandColors: ['#50E3C2', '#2C3E50', '#FFFFFF'],
      industry: 'Finance',
      brandingStyle: 'Corporate & Trustworthy'
    },
    {
      id: '3',
      name: 'HealthFirst Medical',
      logo: 'https://via.placeholder.com/120x60/E74C3C/FFFFFF?text=Health',
      brandColors: ['#E74C3C', '#FFFFFF', '#34495E'],
      industry: 'Healthcare',
      brandingStyle: 'Clean & Caring'
    },
    {
      id: '4',
      name: 'EduTech Innovations',
      logo: 'https://via.placeholder.com/120x60/9B59B6/FFFFFF?text=EduTech',
      brandColors: ['#9B59B6', '#3498DB', '#FFFFFF'],
      industry: 'Education',
      brandingStyle: 'Creative & Inspiring'
    }
  ];

  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  const generateBannerOptions = async () => {
    if (!selectedPartnerId) {
      toast({
        title: "No partner selected",
        description: "Please select a partner first",
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

      // Generate 3 banner options with different styles
      const options: BannerOption[] = [
        {
          id: '1',
          desktopUrl: `https://via.placeholder.com/720x169/4A90E2/FFFFFF?text=${encodeURIComponent(selectedPartner?.name || '')}+Style+1`,
          mobileUrl: `https://via.placeholder.com/492x225/4A90E2/FFFFFF?text=${encodeURIComponent(selectedPartner?.name || '')}+Mobile+1`,
          style: 'Bold & Dynamic',
          copy: 'Get exclusive benefits today!'
        },
        {
          id: '2',
          desktopUrl: `https://via.placeholder.com/720x169/50E3C2/FFFFFF?text=${encodeURIComponent(selectedPartner?.name || '')}+Style+2`,
          mobileUrl: `https://via.placeholder.com/492x225/50E3C2/FFFFFF?text=${encodeURIComponent(selectedPartner?.name || '')}+Mobile+2`,
          style: 'Clean & Minimal',
          copy: 'Discover amazing offers now!'
        },
        {
          id: '3',
          desktopUrl: `https://via.placeholder.com/720x169/9B59B6/FFFFFF?text=${encodeURIComponent(selectedPartner?.name || '')}+Style+3`,
          mobileUrl: `https://via.placeholder.com/492x225/9B59B6/FFFFFF?text=${encodeURIComponent(selectedPartner?.name || '')}+Mobile+3`,
          style: 'Creative & Vibrant',
          copy: 'Join now for special deals!'
        }
      ];

      setGeneratedOptions(options);

      toast({
        title: "Banner options generated!",
        description: `3 banner variations created for ${selectedPartner?.name}`,
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
              Back to Options
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
              <Badge variant="outline" className="text-xs">
                {selectedOption.style}
              </Badge>
            </div>
          </div>

          {/* Partner Branding Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              Partner Branding
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Brand Colors:</span>
                <div className="flex space-x-2 mt-1">
                  {selectedPartner.brandColors.map((color, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Style:</span>
                <p className="text-sm font-medium text-gray-900">{selectedPartner.brandingStyle}</p>
              </div>
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
      {/* Partner Selection & Generation */}
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <Wand2 className="w-6 h-6 mr-2 text-blue-600" />
            AI Banner Generation
          </CardTitle>
          <CardDescription>Select a partner and generate banner options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label htmlFor="partner">Select Partner *</Label>
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Choose a partner from your database" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-4 rounded" style={{ backgroundColor: partner.brandColors[0] }}></div>
                        <span>{partner.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPartner && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Partner Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Industry:</span>
                    <span className="ml-2 font-medium">{selectedPartner.industry}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Style:</span>
                    <span className="ml-2 font-medium">{selectedPartner.brandingStyle}</span>
                  </div>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center mb-3">
                  <Sparkles className="w-5 h-5 text-purple-600 mr-2 animate-pulse" />
                  <span className="text-purple-700 font-medium">Generating 3 banner options...</span>
                </div>
                <Progress value={progress} className="h-2 bg-purple-100" />
                <p className="text-sm text-purple-600 mt-2">
                  AI is creating banners with logo, branding, CTA, and copy space
                </p>
              </div>
            )}

            <Button
              onClick={generateBannerOptions}
              disabled={isGenerating || !selectedPartnerId}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating Options...
                </div>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate 3 Banner Options
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Options (Reve Art Style) */}
      {generatedOptions.length > 0 && (
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Choose Your Banner Style</CardTitle>
            <CardDescription>Select one of the 3 generated options to customize</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {generatedOptions.map((option, index) => (
                <div
                  key={option.id}
                  className="bg-white/50 rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105"
                  onClick={() => selectOption(option)}
                >
                  <div className="space-y-3">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <img
                        src={option.desktopUrl}
                        alt={`Option ${index + 1}`}
                        className="w-full rounded"
                      />
                    </div>
                    
                    <div>
                      <Badge variant="outline" className="text-xs mb-2">
                        {option.style}
                      </Badge>
                      <p className="text-sm text-gray-600">{option.copy}</p>
                    </div>
                    
                    <Button className="w-full" variant="outline">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Customize This
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                    <Badge variant="outline" className="text-xs">
                      {banner.selectedOption.style}
                    </Badge>
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
