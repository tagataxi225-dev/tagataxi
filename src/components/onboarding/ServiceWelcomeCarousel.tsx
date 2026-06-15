import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ServiceSlide } from '@/data/serviceWelcome';

interface ServiceWelcomeCarouselProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slides: ServiceSlide[];
  onNavigate: (path: string) => void;
}

export const ServiceWelcomeCarousel = ({
  open,
  onOpenChange,
  slides,
  onNavigate
}: ServiceWelcomeCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!open || isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [open, isHovered, slides.length]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setCurrentSlide(0);
  }, [onOpenChange]);

  const handleCTA = useCallback(() => {
    const slide = slides[currentSlide];
    onNavigate(slide.ctaPath);
    handleClose();
  }, [currentSlide, slides, onNavigate, handleClose]);

  const slide = slides[currentSlide];
  const IconComponent = slide?.lucideIcon;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="h-auto max-h-[75vh] rounded-t-[32px] border-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <DrawerTitle className="sr-only">Services Tembea</DrawerTitle>
        <DrawerDescription className="sr-only">
          Découvrez tous nos services : Food, Shop, Transport et Loterie
        </DrawerDescription>

        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Floating Close Button */}
        <button
          onClick={handleClose}
          className="absolute -top-6 right-4 z-50 h-12 w-12 rounded-full bg-background shadow-lg border border-border/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          aria-label="Fermer"
        >
          <X className="w-6 h-6 text-foreground" strokeWidth={2.5} />
        </button>

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center px-6 pt-4 pb-10 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center text-center max-w-sm"
            >
              {/* Icon */}
              {IconComponent && (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="mb-8"
                >
                  <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-sm">
                    <IconComponent className="w-12 h-12 text-primary" strokeWidth={1.5} />
                  </div>
                </motion.div>
              )}

              {/* Title */}
              <h2 className="text-3xl font-black font-montserrat mb-2 text-foreground tracking-tight">
                {slide?.title}
              </h2>

              {/* Subtitle */}
              <p className="text-base font-semibold font-montserrat mb-4 text-primary">
                {slide?.subtitle}
              </p>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-10 max-w-xs">
                {slide?.description}
              </p>

              {/* Dots */}
              <div className="flex gap-2.5 mb-8">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? 'w-7 bg-primary'
                        : 'w-2.5 bg-muted-foreground/25 hover:bg-muted-foreground/40'
                    }`}
                    aria-label={`Aller au slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* CTA */}
              <Button
                size="lg"
                onClick={handleCTA}
                className="w-full max-w-xs h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-md transition-all active:scale-[0.97]"
              >
                {slide?.ctaText || 'Découvrir'}
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
