import React from 'react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer } from './ResponsiveContainer';
import { TouchOptimizedButton } from '@/components/ui/touch-optimized';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResponsivePageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonHref?: string;
  headerActions?: React.ReactNode;
  className?: string;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  withBottomNav?: boolean;
}

export const ResponsivePageLayout: React.FC<ResponsivePageLayoutProps> = ({
  children,
  title,
  subtitle,
  showBackButton = true,
  backButtonHref = '/',
  headerActions,
  className,
  containerSize = 'lg',
  withBottomNav = false
}) => {
  const navigate = useNavigate();

  return (
    <div className={cn(
      'min-h-screen bg-background mobile-safe-layout',
      className
    )}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/60 shadow-lg">
        <div className="responsive-padding py-4">
          <ResponsiveContainer size={containerSize} padding="none">
            <div className="flex items-center justify-between">
              <div className="flex items-center responsive-gap">
                {showBackButton && (
                  <TouchOptimizedButton 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(backButtonHref)}
                    className="lg:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </TouchOptimizedButton>
                )}
                <div>
                  <h1 className="text-responsive-xl font-bold">{title}</h1>
                  {subtitle && (
                    <p className="text-responsive-sm text-muted-foreground hidden sm:block">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              {headerActions && (
                <div className="flex items-center responsive-gap">
                  {headerActions}
                </div>
              )}
            </div>
          </ResponsiveContainer>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        'flex-1 overflow-y-auto content-scrollable',
        'responsive-padding py-6'
      )}>
        <ResponsiveContainer 
          size={containerSize}
          withBottomNav={withBottomNav}
          padding="none"
        >
          {children}
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ResponsivePageLayout;