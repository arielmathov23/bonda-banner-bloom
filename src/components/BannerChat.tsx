
import React, { useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

interface BannerChatProps {
  onIterationRequest: (message: string) => void;
  isGenerating?: boolean;
}

const BannerChat = ({ onIterationRequest, isGenerating = false }: BannerChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      message: 'Hi! I can help you refine your banner design. What changes would you like to make?',
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');

  const sendMessage = () => {
    if (!currentMessage.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    onIterationRequest(currentMessage);
    setCurrentMessage('');

    // Add a bot "thinking" message
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: 'I\'m working on your changes...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-xs text-gray-500">Refine your banner design</p>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900 border border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'bot' && <Bot className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />}
                  {message.type === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <span className="text-sm leading-relaxed">{message.message}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-6 border-t border-gray-100">
        <div className="flex space-x-3">
          <Input
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the changes you want to make..."
            disabled={isGenerating}
            className="flex-1 h-12 rounded-xl border-gray-200 focus:border-blue-400 transition-colors"
          />
          <Button
            onClick={sendMessage}
            disabled={!currentMessage.trim() || isGenerating}
            className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 p-0"
          >
            {isGenerating ? (
              <Sparkles className="w-5 h-5 animate-pulse" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Ask for color changes, text modifications, or style adjustments
        </p>
      </div>
    </div>
  );
};

export default BannerChat;
