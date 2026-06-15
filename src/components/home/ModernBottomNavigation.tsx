import { Home, Activity, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ModernBottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  notificationCount?: number;
  favoritesCount?: number;
}

export const ModernBottomNavigation = ({ 
  activeTab, 
  onTabChange,
  notificationCount = 0,
  favoritesCount = 0
}: ModernBottomNavigationProps) => {
  const { t } = useLanguage();
  const tabs = [
    {
      id: 'home',
      name: t('client.nav.home'),
      icon: Home,
      badge: 0
    },
    {
      id: 'activity',
      name: t('client.nav.activity'),
      icon: Activity,
      badge: notificationCount
    },
    {
      id: 'profil',
      name: t('client.nav.account'),
      icon: User,
      badge: 0
    }
  ];

  return (
    <nav 
      className="bottom-nav-standard"
      style={{ 
        willChange: 'transform',
        pointerEvents: 'auto',
        touchAction: 'manipulation'
      }}
    >
      {/* Gradient d'accentuation subtile en haut */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      {/* Container des boutons - hauteur fixe explicite */}
      <div className="flex items-center justify-around h-[64px] px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 min-w-[72px] group active:scale-95"
            >
              {/* Active background avec glassmorphism moderne */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/8 to-primary/4 rounded-2xl border border-primary/20 shadow-lg shadow-primary/10" />
              )}
              
              {/* Icon container */}
              <div className="relative z-10">
                <Icon 
                  className={`w-5 h-5 transition-all duration-300 ease-out ${
                    isActive 
                      ? 'text-primary scale-110' 
                      : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
                  }`}
                />
                
                {/* Notification badge */}
                {tab.badge > 0 && (
                  <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[10px] font-bold shadow-md border-2 border-background">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </div>
                )}
              </div>
              
              {/* Label */}
              <span 
                className={`relative z-10 text-[10px] font-semibold tracking-tight transition-all duration-300 ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground group-hover:text-foreground'
                }`}
              >
                {tab.name}
              </span>
              
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute -bottom-0.5 h-1 w-10 bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
