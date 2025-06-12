import React from 'react';
import { Home, Users, List, Plus, Wand2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const menuItems = [
  {
    title: 'Inicio',
    icon: Home,
    key: 'home',
  },
  {
    title: 'Socios',
    icon: Users,
    key: 'partners',
  },
  {
    title: 'Lista de Banners',
    icon: List,
    key: 'banner-list',
  },
];

export function AppSidebar({ activeSection, setActiveSection }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-brand-100 w-64 h-screen" collapsible="none">
      <SidebarContent className="bg-white flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img 
              src="/bondacom_logo.jpeg" 
              alt="Bonda" 
              className="w-8 h-8 object-contain rounded-lg"
            />
            <h2 className="text-base font-medium text-gray-900">BONDA BANNER AI</h2>
          </div>
        </div>

        {/* Create Banner - Main Action */}
        <div className="p-4 flex-shrink-0">
          <Button
            onClick={() => setActiveSection('create-banner')}
            className={`w-full justify-start px-4 py-3 text-left ${
              activeSection === 'create-banner'
                ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg'
                : 'bg-violet-500 hover:bg-violet-600 text-white shadow-md'
            } transition-all duration-200`}
          >
            <Wand2 className="w-5 h-5 mr-3" />
            <span className="font-medium">Crear un Banner</span>
          </Button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-4 overflow-hidden">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      onClick={() => setActiveSection(item.key)}
                      isActive={activeSection === item.key}
                      className={`w-full justify-start px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        activeSection === item.key
                          ? 'bg-brand-100 text-brand-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="w-4 h-4 mr-3" />
                      {item.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Footer with powered by panchito */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
            <div className="flex justify-center">
              <a 
                href="https://www.panchito.xyz/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all duration-200"
              >
                powered by panchito
              </a>
            </div>
          </div>
      </SidebarContent>
    </Sidebar>
  );
}
