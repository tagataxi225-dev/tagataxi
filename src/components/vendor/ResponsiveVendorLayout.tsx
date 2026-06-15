import React, { useRef } from 'react';
import { UnifiedVendorHeader } from './UnifiedVendorHeader';
import { VendorBottomNav } from './modern/VendorBottomNav';
import { VendorDesktopSidebar } from './modern/VendorDesktopSidebar';
import { VendorBackToTop } from './VendorBackToTop';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSwipeable } from 'react-swipeable';
import { cn } from '@/lib/utils';
import '@/styles/vendor-modern.css';

interface VendorStats {
  activeProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  escrowBalance: number;
  pendingEscrow: number;
}

interface ResponsiveVendorLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats: VendorStats;
  onOpenChat?: () => void;
  onOpenNotifications?: () => void;
  unreadChatCount?: number;
  shopName?: string;
}

export const ResponsiveVendorLayout: React.FC<ResponsiveVendorLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  stats,
  onOpenChat,
  onOpenNotifications,
  unreadChatCount,
  shopName,
}) => {
  const isMobile = useIsMobile();
  const mainRef = useRef<HTMLDivElement>(null);
  // Swipe gestures pour navigation mobile - avec finances
  const tabs = ['dashboard', 'shop', 'orders', 'finances', 'profile'];
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isMobile) return;
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        onTabChange(tabs[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      if (!isMobile) return;
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        onTabChange(tabs[currentIndex - 1]);
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 80,
    preventScrollOnSwipe: false,
  });

  return (
    <div className="vendor-layout-container vendor-gradient-bg">
      {/* Header fixe avec glassmorphism - h-16 = 64px */}
      <header className="flex-shrink-0 sticky top-0 z-40 h-16">
        <div className="vendor-card-glass border-b border-border/20">
          <UnifiedVendorHeader 
            onOpenChat={onOpenChat}
            onOpenNotifications={onOpenNotifications}
            unreadChatCount={unreadChatCount}
            shopName={shopName}
          />
        </div>
      </header>

      {/* Container principal avec sidebar et contenu */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar Desktop uniquement */}
        {!isMobile && (
          <div className="vendor-card-glass border-r border-border/20">
            <VendorDesktopSidebar 
              activeTab={activeTab}
              onTabChange={onTabChange}
              stats={stats}
            />
          </div>
        )}

        {/* Zone de contenu scrollable avec swipe support */}
        <main 
          ref={mainRef}
          {...(isMobile ? handlers : {})}
          className={cn(
            'vendor-scrollbar flex-1 overflow-y-auto overflow-x-hidden',
            isMobile ? 'pb-24' : ''
          )}
        >
          <div className="container max-w-6xl mx-auto p-4 space-y-4">
            {children}
          </div>
        </main>

        <VendorBackToTop scrollContainerRef={mainRef} />
      </div>

      {/* Footer Mobile uniquement - Ne scroll jamais */}
      {isMobile && (
        <footer className="bottom-nav-standard">
            <VendorBottomNav 
              activeTab={activeTab}
              onTabChange={onTabChange}
              stats={stats}
            />
        </footer>
      )}
    </div>
  );
};
