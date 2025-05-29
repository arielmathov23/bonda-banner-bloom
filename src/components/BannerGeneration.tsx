
import React, { useState } from 'react';
import { Wand2, Download, RefreshCw, Eye, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

interface Banner {
  id: string;
  url: string;
  partnerId: string;
  partnerName: string;
  copy: string;
  style: string;
  size: string;
  generatedAt: string;
}

const BannerGeneration = () => {
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedCopy, setSelectedCopy] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBanners, setGeneratedBanners] = useState<Banner[]>([]);
  const [progress, setProgress] = useState(0);

  // Mock data
  const partners = [
    { id: '1', name: 'TechCorp Solutions' },
    { id: '2', name: 'Global Finance Ltd' },
    { id: '3', name: 'HealthFirst Medical' },
    { id: '4', name: 'EduTech Innovations' }
  ];

  const copyOptions = [
    { id: '1', title: 'Welcome Discount', content: 'Get 20% off your first purchase!' },
    { id: '2', title: 'Free Shipping', content: 'Free shipping on all orders over $50.' },
    { id: '3', title: 'Flash Sale', content: 'Flash Sale! Up to 50% off selected items.' }
  ];

  const styles = [
    'Modern Minimal',
    'Bold & Vibrant',
    'Professional',
    'Playful',
    'Elegant',
    'Tech-focused'
  ];

  const sizes = [
    '1200x628 (Facebook)',
    '1080x1080 (Instagram Square)',
    '1080x1920 (Instagram Story)',
    '728x90 (Banner)',
    '300x250 (Medium Rectangle)',
    '320x50 (Mobile Banner)'
  ];

  const mockBanners: Banner[] = [
    {
      id: '1',
      url: 'https://via.placeholder.com/300x150/4A90E2/FFFFFF?text=TechCorp+Banner',
      partnerId: '1',
      partnerName: 'TechCorp Solutions',
      copy: 'Get 20% off your first purchase!',
      style: 'Modern Minimal',
      size: '1200x628',
      generatedAt: '2024-01-20'
    },
    {
      id: '2',
      url: 'https://via.placeholder.com/300x150/50E3C2/FFFFFF?text=Finance+Banner',
      partnerId: '2',
      partnerName: 'Global Finance Ltd',
      copy: 'Free shipping on all orders over $50.',
      style: 'Professional',
      size: '728x90',
      generatedAt: '2024-01-19'
    }
  ];

  const handleGenerate = async () => {
    if (!selectedPartner || !selectedCopy || !selectedStyle || !selectedSize) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
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
        return prev + 10;
      });
    }, 300);

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      const partner = partners.find(p => p.id === selectedPartner);
      const copy = copyOptions.find(c => c.id === selectedCopy);
      
      const newBanner: Banner = {
        id: Date.now().toString(),
        url: `https://via.placeholder.com/300x150/4A90E2/FFFFFF?text=${encodeURIComponent(partner?.name || 'Banner')}`,
        partnerId: selectedPartner,
        partnerName: partner?.name || '',
        copy: copy?.content || '',
        style: selectedStyle,
        size: selectedSize,
        generatedAt: new Date().toISOString()
      };

      setGeneratedBanners(prev => [newBanner, ...prev]);

      toast({
        title: "Banner generated successfully!",
        description: `New banner created for ${partner?.name}`,
      });

      // Reset form
      setSelectedPartner('');
      setSelectedCopy('');
      setSelectedStyle('');
      setSelectedSize('');

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

  const handleDownload = (banner: Banner) => {
    toast({
      title: "Download started",
      description: `Downloading banner for ${banner.partnerName}`,
    });
  };

  const handleRegenerate = (banner: Banner) => {
    toast({
      title: "Regenerating banner",
      description: `Creating new version for ${banner.partnerName}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner Creation Form */}
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <Wand2 className="w-6 h-6 mr-2 text-blue-600" />
            AI Banner Generation
          </CardTitle>
          <CardDescription>Create stunning banners with AI assistance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="partner">Select Partner *</Label>
                <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                  <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Choose a partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="copy">Select Copy *</Label>
                <Select value={selectedCopy} onValueChange={setSelectedCopy}>
                  <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Choose copy text" />
                  </SelectTrigger>
                  <SelectContent>
                    {copyOptions.map((copy) => (
                      <SelectItem key={copy.id} value={copy.id}>
                        {copy.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="style">Banner Style *</Label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Choose style" />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="size">Banner Size *</Label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Choose size" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isGenerating && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center mb-2">
                <Sparkles className="w-5 h-5 text-blue-600 mr-2 animate-pulse" />
                <span className="text-blue-700 font-medium">Generating your banner...</span>
              </div>
              <Progress value={progress} className="h-2 bg-blue-100" />
              <p className="text-sm text-blue-600 mt-2">
                AI is creating your custom banner design
              </p>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedPartner || !selectedCopy || !selectedStyle || !selectedSize}
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
                Generate Banner
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Banners */}
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Generated Banners</CardTitle>
          <CardDescription>Your recently created banners</CardDescription>
        </CardHeader>
        <CardContent>
          {(generatedBanners.length > 0 || mockBanners.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...generatedBanners, ...mockBanners].map((banner) => (
                <div key={banner.id} className="bg-white/50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                    <img
                      src={banner.url}
                      alt={`Banner for ${banner.partnerName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{banner.partnerName}</h3>
                      <p className="text-sm text-gray-600">{banner.copy}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {banner.style}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {banner.size}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(banner.generatedAt).toLocaleDateString()}
                      </span>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerate(banner)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(banner)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wand2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No banners generated yet</p>
              <p className="text-gray-400">Create your first banner using the form above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerGeneration;
