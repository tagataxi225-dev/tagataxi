import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { cn } from '@/lib/utils';

interface BackToTopButtonProps {
  showAfter?: number;
  className?: string;
}

export const BackToTopButton = ({ 
  showAfter = 300, 
  className 
}: BackToTopButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollToTop } = useScrollToTop();

  useEffect(() => {
    let ticking = false;
    
    const toggleVisibility = () => {
      // Batch the DOM read to avoid forced reflow
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      setIsVisible(scrollY > showAfter);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(toggleVisibility);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial state
    toggleVisibility();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfter]);

  if (!isVisible) return null;

  return (
    <Button
      onClick={() => scrollToTop()}
      className={cn(
        "fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full p-0",
        "bg-primary/90 hover:bg-primary text-primary-foreground",
        "shadow-lg backdrop-blur-sm transition-all duration-300",
        "animate-fade-in md:bottom-6 md:right-6",
        "touch-friendly hover-scale",
        className
      )}
      aria-label="Retour en haut"
    >
      <ChevronUp className="h-5 w-5" />
    </Button>
  );
};