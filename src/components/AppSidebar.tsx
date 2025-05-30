
import React from 'react';
import { Home, Users, List, Plus, Menu } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';

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
  {
    title: 'Crear un Banner',
    icon: Plus,
    key: 'create-banner',
  },
];

export function AppSidebar({ activeSection, setActiveSection }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-brand-100">
      <SidebarContent className="bg-white flex flex-col">
        {/* Sidebar Trigger at the top */}
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <SidebarTrigger className="w-8 h-8">
            <Menu className="w-4 h-4" />
          </SidebarTrigger>
          <span className="text-sm font-medium text-gray-700">Menú</span>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-600 font-medium px-3 py-2">
              Navegación
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      onClick={() => setActiveSection(item.key)}
                      isActive={activeSection === item.key}
                      className={`w-full justify-start px-3 py-2 ${
                        activeSection === item.key
                          ? 'bg-brand-500 text-white hover:bg-brand-600'
                          : 'text-gray-700 hover:bg-brand-50 hover:text-brand-500'
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
        <div className="p-3 border-t border-gray-100">
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
