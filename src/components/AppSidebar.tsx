
import React from 'react';
import { Home, Users, List, Plus, Image } from 'lucide-react';
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
      <SidebarContent className="bg-white">
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
      </SidebarContent>
    </Sidebar>
  );
}
