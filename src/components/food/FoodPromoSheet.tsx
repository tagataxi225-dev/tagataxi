import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import type { FoodWelcomeOffer } from '@/data/foodPromos';

interface FoodPromoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: FoodWelcomeOffer;
}

export const FoodPromoSheet = ({ open, onOpenChange, offer }: FoodPromoSheetProps) => {
  // Debug: Log when drawer opens
  useEffect(() => {
    if (open) {
      console.log('📱 [FoodPromoSheet] Drawer ouvert - État:', { open, offer });
    }
  }, [open, offer]);
  
  const handleDiscover = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {/* Close Button */}
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-lg border border-border/50"
            >
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>

          {/* Accessibility */}
          <DrawerTitle className="sr-only">{offer.title}</DrawerTitle>
          <DrawerDescription className="sr-only">{offer.description}</DrawerDescription>

          {/* Hero Image Section avec Gradient Overlay Doux */}
          <div className="relative w-full h-[50vh] overflow-hidden">
            <motion.img
              src={offer.hero_image}
              alt={offer.title}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            {/* Gradient overlay soft */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>

          {/* Content Section - Centré et Épuré */}
          <div className="px-6 py-8 space-y-6 text-center">
            {/* Titre + Sous-titre */}
            <motion.div
              className="space-y-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <h2 className="text-3xl font-black text-foreground">
                {offer.title}
              </h2>
              <p className="text-lg text-muted-foreground font-medium">
                {offer.subtitle}
              </p>
            </motion.div>

            {/* Description invitante */}
            <motion.p
              className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {offer.description}
            </motion.p>

            {/* CTA Simple et Élégant */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Button
                onClick={handleDiscover}
                size="lg"
                className={`w-full max-w-sm mx-auto h-14 rounded-2xl bg-gradient-to-r ${offer.background_gradient} hover:opacity-90 transition-all duration-300 text-base font-bold shadow-lg`}
              >
                {offer.cta_text}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DrawerContent>
    </Drawer>
  );
};
