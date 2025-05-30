
import React from 'react';
import { Wand2, Sparkles, Tag, Type, Palette, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Partner } from '@/hooks/usePartners';

interface BannerFormInputsProps {
  selectedPartnerId: string;
  setSelectedPartnerId: (value: string) => void;
  bannerType: string;
  setBannerType: (value: string) => void;
  promotionDiscount: string;
  setPromotionDiscount: (value: string) => void;
  bannerCopy: string;
  setBannerCopy: (value: string) => void;
  selectedStyle: string;
  setSelectedStyle: (value: string) => void;
  selectedFlavor: string;
  setSelectedFlavor: (value: string) => void;
  partners: Partner[];
  partnersLoading: boolean;
  selectedPartner: Partner | undefined;
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
  selectedStyle,
  setSelectedStyle,
  selectedFlavor,
  setSelectedFlavor,
  partners,
  partnersLoading,
  selectedPartner,
  isGenerating,
  progress,
  onGenerate
}: BannerFormInputsProps) => {
  const bannerStyles = [
    { id: 'bold-dynamic', name: 'Bold & Dynamic', description: 'Strong colors and bold typography' },
    { id: 'minimal', name: 'Minimal', description: 'Clean and simple design' },
    { id: 'vibrant', name: 'Vibrant', description: 'Colorful and energetic design' }
  ];

  const bannerFlavors = [
    { id: 'contextual', name: 'Contextual', description: 'Lifestyle or situational imagery' },
    { id: 'product-photo', name: 'Product Photo', description: 'Focus on product imagery' }
  ];

  const formatRegions = (regions: string[]) => {
    const regionLabels: Record<string, string> = {
      'argentina-uruguay': 'Argentina & Uruguay',
      'latam': 'LATAM',
    };
    return regions.map(region => regionLabels[region] || region).join(', ');
  };

  const isFormValid = selectedPartnerId && bannerType && bannerCopy && selectedStyle && selectedFlavor && 
    (bannerType !== 'promotion' || promotionDiscount);

  return (
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
            AI is creating banner with your specifications
          </p>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={isGenerating || !isFormValid || partnersLoading}
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
  );
};

export default BannerFormInputs;
