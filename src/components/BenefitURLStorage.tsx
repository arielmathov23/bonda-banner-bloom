
import React, { useState } from 'react';
import { Plus, Link, Edit, Trash2, ExternalLink, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface BenefitURL {
  id: string;
  partnerId: string;
  partnerName: string;
  title: string;
  url: string;
  description: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  clicks: number;
}

const BenefitURLStorage = () => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    partnerId: '',
    title: '',
    url: '',
    description: '',
    category: 'discount'
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mock data
  const partners = [
    { id: '1', name: 'TechCorp Solutions' },
    { id: '2', name: 'Global Finance Ltd' },
    { id: '3', name: 'HealthFirst Medical' },
    { id: '4', name: 'EduTech Innovations' }
  ];

  const categories = [
    'discount',
    'free-shipping',
    'trial',
    'membership',
    'cashback',
    'bundle'
  ];

  const benefitURLs: BenefitURL[] = [
    {
      id: '1',
      partnerId: '1',
      partnerName: 'TechCorp Solutions',
      title: '20% Off Software License',
      url: 'https://techcorp.com/discount/20OFF',
      description: 'Get 20% off your first software license purchase',
      category: 'discount',
      isActive: true,
      createdAt: '2024-01-20',
      clicks: 145
    },
    {
      id: '2',
      partnerId: '2',
      partnerName: 'Global Finance Ltd',
      title: 'Free Financial Consultation',
      url: 'https://globalfinance.com/free-consult',
      description: 'Book a free 30-minute financial consultation',
      category: 'trial',
      isActive: true,
      createdAt: '2024-01-18',
      clicks: 89
    },
    {
      id: '3',
      partnerId: '3',
      partnerName: 'HealthFirst Medical',
      title: 'Free Health Checkup',
      url: 'https://healthfirst.com/free-checkup',
      description: 'Complete health screening at no cost',
      category: 'trial',
      isActive: false,
      createdAt: '2024-01-15',
      clicks: 67
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.partnerId || !formData.title || !formData.url) {
      toast({
        title: "Missing required fields",
        description: "Please fill in partner, title, and URL",
        variant: "destructive"
      });
      return;
    }

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const partner = partners.find(p => p.id === formData.partnerId);
      
      toast({
        title: "Benefit URL added successfully!",
        description: `${formData.title} has been added for ${partner?.name}`,
      });

      // Reset form
      setFormData({
        partnerId: '',
        title: '',
        url: '',
        description: '',
        category: 'discount'
      });
      setIsAddingNew(false);

    } catch (error) {
      toast({
        title: "Error adding benefit URL",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleCopyURL = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      
      toast({
        title: "URL copied",
        description: "Benefit URL has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive"
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      discount: 'bg-green-100 text-green-700 border-green-200',
      'free-shipping': 'bg-blue-100 text-blue-700 border-blue-200',
      trial: 'bg-purple-100 text-purple-700 border-purple-200',
      membership: 'bg-orange-100 text-orange-700 border-orange-200',
      cashback: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      bundle: 'bg-pink-100 text-pink-700 border-pink-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatCategory = (category: string) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Benefit URL Management</h2>
          <p className="text-gray-600">Manage discount links and special offers for your partners</p>
        </div>
        <Button
          onClick={() => setIsAddingNew(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Benefit URL
        </Button>
      </div>

      {/* Add New Benefit Form */}
      {isAddingNew && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Add New Benefit URL</CardTitle>
            <CardDescription>Create a new benefit link for your partners</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partner">Partner *</Label>
                  <Select value={formData.partnerId} onValueChange={(value) => handleInputChange('partnerId', value)}>
                    <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select partner" />
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
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {formatCategory(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Benefit Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., 20% Off First Purchase"
                  className="bg-white/50 border-gray-200 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="url">Benefit URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder="https://partner.com/special-offer"
                  className="bg-white/50 border-gray-200 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the benefit..."
                  className="bg-white/50 border-gray-200 focus:border-blue-500 resize-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingNew(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  Add Benefit URL
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Benefit URLs List */}
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Active Benefits</CardTitle>
          <CardDescription>Manage your partner benefit URLs and track performance</CardDescription>
        </CardHeader>
        <CardContent>
          {benefitURLs.length === 0 ? (
            <div className="text-center py-12">
              <Link className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No benefit URLs created yet</p>
              <p className="text-gray-400">Start by adding your first benefit URL</p>
            </div>
          ) : (
            <div className="space-y-4">
              {benefitURLs.map((benefit) => (
                <div
                  key={benefit.id}
                  className="bg-white/50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                        <Badge className={getCategoryColor(benefit.category)}>
                          {formatCategory(benefit.category)}
                        </Badge>
                        <Badge variant={benefit.isActive ? "default" : "secondary"}>
                          {benefit.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{benefit.partnerName}</p>
                      
                      {benefit.description && (
                        <p className="text-sm text-gray-700 mb-3">{benefit.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created: {new Date(benefit.createdAt).toLocaleDateString()}</span>
                        <span>Clicks: {benefit.clicks}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1 mr-3">
                      <code className="text-sm text-gray-700 break-all">
                        {benefit.url}
                      </code>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyURL(benefit.url, benefit.id)}
                      >
                        {copiedId === benefit.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(benefit.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Edit feature",
                            description: "Edit functionality will be available soon",
                          });
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Delete confirmation",
                            description: "Delete functionality will be available soon",
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BenefitURLStorage;
