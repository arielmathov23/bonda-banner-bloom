
import React, { useState } from 'react';
import { Plus, Search, Edit, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

interface CopyItem {
  id: string;
  title: string;
  content: string;
  category: string;
  usage: number;
  lastUsed: string;
}

const CopyInputSelection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCopy, setSelectedCopy] = useState<string | null>(null);
  const [customCopy, setCustomCopy] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCopyTitle, setNewCopyTitle] = useState('');
  const [newCopyContent, setNewCopyContent] = useState('');
  const [newCopyCategory, setNewCopyCategory] = useState('general');

  // Mock data
  const copyItems: CopyItem[] = [
    {
      id: '1',
      title: 'Welcome Discount',
      content: 'Get 20% off your first purchase! Limited time offer for new customers.',
      category: 'discount',
      usage: 45,
      lastUsed: '2024-01-20'
    },
    {
      id: '2',
      title: 'Free Shipping',
      content: 'Free shipping on all orders over $50. No minimum purchase required.',
      category: 'shipping',
      usage: 32,
      lastUsed: '2024-01-18'
    },
    {
      id: '3',
      title: 'Flash Sale',
      content: 'Flash Sale! Up to 50% off selected items. Hurry, while stocks last!',
      category: 'sale',
      usage: 28,
      lastUsed: '2024-01-15'
    },
    {
      id: '4',
      title: 'Member Exclusive',
      content: 'Exclusive member benefits: Early access to sales and special discounts.',
      category: 'membership',
      usage: 15,
      lastUsed: '2024-01-10'
    }
  ];

  const categories = ['all', 'discount', 'shipping', 'sale', 'membership', 'general'];
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredCopy = copyItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectCopy = (copyId: string) => {
    setSelectedCopy(copyId);
    const selected = copyItems.find(item => item.id === copyId);
    if (selected) {
      toast({
        title: "Copy selected",
        description: `"${selected.title}" has been selected for banner creation`,
      });
    }
  };

  const handleCustomCopyChange = (value: string) => {
    if (value.length <= 250) {
      setCustomCopy(value);
    }
  };

  const handleAddNewCopy = () => {
    if (!newCopyTitle || !newCopyContent) {
      toast({
        title: "Missing information",
        description: "Please provide both title and content for the new copy",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Copy added successfully",
      description: `"${newCopyTitle}" has been added to your copy library`,
    });

    // Reset form
    setNewCopyTitle('');
    setNewCopyContent('');
    setNewCopyCategory('general');
    setIsAddingNew(false);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      discount: 'bg-green-100 text-green-700 border-green-200',
      shipping: 'bg-blue-100 text-blue-700 border-blue-200',
      sale: 'bg-red-100 text-red-700 border-red-200',
      membership: 'bg-purple-100 text-purple-700 border-purple-200',
      general: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="existing" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/60 backdrop-blur-sm">
          <TabsTrigger value="existing">Select Existing Copy</TabsTrigger>
          <TabsTrigger value="custom">Input Custom Copy</TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-6">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Copy Library</CardTitle>
                  <CardDescription>Choose from your existing copy templates</CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddingNew(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New
                </Button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search copy templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="capitalize"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCopy.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                      selectedCopy === item.id
                        ? 'bg-blue-50 border-blue-300 shadow-md'
                        : 'bg-white/50 border-gray-200 hover:shadow-md hover:scale-[1.02]'
                    }`}
                    onClick={() => handleSelectCopy(item.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          <Badge className={getCategoryColor(item.category)}>
                            {item.category}
                          </Badge>
                          {selectedCopy === item.id && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <p className="text-gray-700 text-sm mb-3">{item.content}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Used {item.usage} times</span>
                          <span>Last used: {new Date(item.lastUsed).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredCopy.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No copy templates found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add New Copy Modal */}
          {isAddingNew && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Add New Copy Template</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingNew(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="newTitle">Title</Label>
                  <Input
                    id="newTitle"
                    value={newCopyTitle}
                    onChange={(e) => setNewCopyTitle(e.target.value)}
                    placeholder="Enter copy title..."
                    className="bg-white/50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="newContent">Content</Label>
                  <Textarea
                    id="newContent"
                    value={newCopyContent}
                    onChange={(e) => setNewCopyContent(e.target.value)}
                    placeholder="Enter copy content..."
                    className="bg-white/50 resize-none"
                    rows={3}
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {newCopyContent.length}/250 characters
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingNew(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddNewCopy}
                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    Add Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="custom">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Custom Copy Input</CardTitle>
              <CardDescription>Create unique copy for your banner</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customCopy">Banner Copy</Label>
                  <Textarea
                    id="customCopy"
                    value={customCopy}
                    onChange={(e) => handleCustomCopyChange(e.target.value)}
                    placeholder="Enter your custom copy here..."
                    className="bg-white/50 border-gray-200 focus:border-blue-500 resize-none"
                    rows={4}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-sm ${customCopy.length > 250 ? 'text-red-500' : 'text-gray-500'}`}>
                      {customCopy.length}/250 characters
                    </span>
                    {customCopy.length > 250 && (
                      <span className="text-red-500 text-sm flex items-center">
                        <X className="w-4 h-4 mr-1" />
                        Character limit exceeded
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  disabled={!customCopy || customCopy.length > 250}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  onClick={() => {
                    toast({
                      title: "Custom copy ready",
                      description: "Your custom copy is ready for banner creation",
                    });
                  }}
                >
                  Use Custom Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CopyInputSelection;
