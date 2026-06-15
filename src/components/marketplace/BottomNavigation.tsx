import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, ShoppingBag, Plus, Activity, Heart } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartItemsCount: number;
  favoritesCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  cartItemsCount,
  favoritesCount
}) => {
  const tabs = [
    {
      id: 'explore',
      label: 'Explorer',
      icon: Search,
      badge: null
    },
    {
      id: 'sell',
      label: 'Vendre',
      icon: Plus,
      badge: null
    },
    {
      id: 'activity',
      label: 'Activité',
      icon: Activity,
      badge: null
    },
    {
      id: 'favorites',
      label: 'Favoris',
      icon: Heart,
      badge: favoritesCount > 0 ? favoritesCount : null
    }
  ];

  return (
    <div className="bottom-nav-standard transition-all duration-300">
      <div className="flex items-center justify-around px-4 py-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              className={`relative flex-1 flex flex-col items-center gap-1 h-auto py-2 px-2 transition-all duration-200 ${
                isActive 
                  ? 'text-primary bg-primary/5' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                {tab.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center min-w-4 bg-primary text-white border-0"
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-primary' : ''}`}>
                {tab.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};