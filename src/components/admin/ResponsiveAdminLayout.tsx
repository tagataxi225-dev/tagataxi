import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileAdminHeader } from './MobileAdminHeader';
import { AdminVerticalNav } from './AdminVerticalNav';
import { AdminPermissionSettings, AdminPermissionProvider, useAdminPermissions } from './AdminPermissionContext';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { BackToTopButton } from '@/components/navigation/BackToTopButton';
import { AdminRoleNotificationCenter } from '@/components/admin/AdminRoleNotificationCenter';
import { AdminMobileNav } from './AdminMobileNav';
import { cn } from '@/lib/utils';

interface ResponsiveAdminLayoutProps {
  children: React.ReactNode;
  realTimeStats: any;
  activeTab: string;
  onTabChange: (value: string) => void;
}

const ResponsiveAdminLayoutInner: React.FC<ResponsiveAdminLayoutProps> = ({
  children,
  realTimeStats,
  activeTab,
  onTabChange
}) => {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { devMode, showAllSections } = useAdminPermissions();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
      <MobileAdminHeader 
        onMenuToggle={() => setMobileMenuOpen(true)}
      />
        
        {/* Mobile Menu Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent 
            side="left" 
            className={cn(
              "p-0 w-[85vw] max-w-sm sm:max-w-md md:max-w-lg",
              "overflow-hidden"
            )}
          >
            <div className="flex flex-col h-full max-h-screen">
            {/* Header avec notifications */}
            <div className="shrink-0 p-4 border-b border-border/60 bg-card/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Navigation Admin</h2>
              <div className="flex items-center gap-2">
                <AdminRoleNotificationCenter />
              </div>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="shrink-0 p-4 border-b border-border/60 bg-card/50">
                <AdminPermissionSettings />
              </div>
            )}
              
              <div className="flex-1 min-h-0 overflow-hidden">
                <AdminVerticalNav 
                  activeTab={activeTab} 
                  onTabChange={(value) => {
                    onTabChange(value);
                    setMobileMenuOpen(false);
                  }}
                  devMode={devMode}
                  isMobile={true}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Content with bottom padding */}
        <main className="p-2 sm:p-4 pb-[var(--bottom-nav-height-safe)]">
          {children}
        </main>
        
        {/* Mobile Footer Navigation */}
        <footer className="bottom-nav-standard">
          <AdminMobileNav 
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        </footer>
        
        {/* Back to Top - Mobile */}
        <BackToTopButton 
          showAfter={400} 
          className="bottom-[calc(var(--bottom-nav-height-safe)+1rem)] right-4 z-50"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header avec notifications */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/60 shadow-sm">
        <div className="container h-14 flex items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          <div className="flex items-center gap-2">
            <AdminRoleNotificationCenter />
          </div>
        </div>
      </header>

      <div className="container py-4">
        <div className="flex gap-6">
          <aside className={cn(
            "shrink-0 sticky top-[calc(3.5rem+1rem)] self-start",
            "w-56 lg:w-64 xl:w-72",
            "h-[calc(100dvh-5.5rem)]",
            "flex flex-col",
            "overflow-hidden rounded-lg border border-border/40 bg-card/50",
            "shadow-md transition-all duration-300"
          )}>
            {process.env.NODE_ENV === 'development' && (
              <div className="p-3 border-b border-border/60 shrink-0">
                <AdminPermissionSettings />
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-hidden">
              <AdminVerticalNav activeTab={activeTab} onTabChange={onTabChange} devMode={devMode} />
            </div>
          </aside>
          <section className="flex-1">
            <main className="py-6">
              {children}
            </main>
          </section>
        </div>
      </div>
      
      {/* Back to Top - Desktop */}
      <BackToTopButton 
        showAfter={400} 
        className="bottom-6 right-6 z-50"
      />
    </div>
  );
};

export const ResponsiveAdminLayout: React.FC<ResponsiveAdminLayoutProps> = (props) => {
  return (
    <AdminPermissionProvider>
      <ResponsiveAdminLayoutInner {...props} />
    </AdminPermissionProvider>
  );
};