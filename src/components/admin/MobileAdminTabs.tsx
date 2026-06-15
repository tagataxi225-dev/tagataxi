import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  Users, 
  MapPin, 
  Car, 
  ShoppingBag, 
  DollarSign, 
  Headphones, 
  Settings 
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileAdminTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const MobileAdminTabs: React.FC<MobileAdminTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  const isMobile = useIsMobile();

  const tabs = [
    { value: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { value: 'users', label: 'Utilisateurs', icon: Users },
    { value: 'zones', label: 'Zones', icon: MapPin },
    { value: 'drivers', label: 'Chauffeurs', icon: Car },
    { value: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { value: 'finance', label: 'Finance', icon: DollarSign },
    { value: 'support', label: 'Support', icon: Headphones },
    { value: 'settings', label: 'Paramètres', icon: Settings }
  ];

  if (isMobile) {
    return (
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ScrollArea className="w-full">
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="inline-flex h-12 w-max items-center justify-start rounded-none border-0 bg-transparent p-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-b-transparent bg-transparent px-4 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </ScrollArea>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-12">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden xl:inline">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
};