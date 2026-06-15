import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ArrowLeft } from 'lucide-react';

interface UniversalAppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const UniversalAppHeader = ({ 
  title, 
  showBackButton = false, 
  onBackClick 
}: UniversalAppHeaderProps) => {
  return (
    <header className="sticky top-0 z-[150] bg-background/95 backdrop-blur-xl border-b shadow-sm pt-safe-top">
      <div className="px-4 py-3 flex items-center justify-between h-[60px]">
        {/* Left: Back button ou Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBackButton && onBackClick && (
            <Button variant="ghost" size="icon" onClick={onBackClick}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {title && (
            <h1 className="text-lg font-bold truncate">{title}</h1>
          )}
        </div>

        {/* Right: Theme toggle only */}
        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
        </div>
      </div>
    </header>
  );
};
