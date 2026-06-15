import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const MobileProfileModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className 
}: MobileProfileModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-background">
      {/* Header with visible back button + iOS safe area */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/95 backdrop-blur-sm pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-9 w-9 rounded-xl bg-muted/50 hover:bg-muted text-foreground shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      {/* Content area */}
      <div 
        className={cn(
          "flex-1 overflow-y-auto",
          "animate-fade-in",
          className
        )}
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehaviorY: 'auto' } as React.CSSProperties}
      >
        <div className="p-4">
          {children}
        </div>
      </div>

      {/* Safe area at bottom */}
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-background" />
    </div>
  );
};