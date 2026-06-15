import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  showSidebarOnMobile?: boolean;
}

export const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({
  children,
  header,
  footer,
  sidebar,
  className,
  contentClassName,
  showSidebarOnMobile = false
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      'mobile-safe-layout bg-background',
      className
    )}>
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-40 bg-card border-b border-border/60 shadow-lg">
          {header}
        </header>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop only unless specified */}
        {sidebar && (!isMobile || showSidebarOnMobile) && (
          <aside className={cn(
            'border-r border-border/60 bg-card/50',
            isMobile ? 'w-16' : 'w-64 lg:w-80',
            'transition-all duration-300'
          )}>
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main className={cn(
          footer ? 'content-with-bottom-nav' : 'content-scrollable',
          contentClassName
        )}>
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Footer/Navigation */}
      {footer && (
        <footer className="bottom-nav-standard">
          {footer}
        </footer>
      )}
    </div>
  );
};

export default MobileOptimizedLayout;