import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import YangoVerticalVehicleCards from './YangoVerticalVehicleCards';
import BeneficiarySelector from './BeneficiarySelector';
import DestinationSearchBar from './DestinationSearchBar';
import PopularPlacesList from './PopularPlacesList';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHandle,
} from '@/components/ui/drawer';

interface YangoBottomSheetProps {
  bookingStep: 'vehicle' | 'destination' | 'confirm';
  selectedVehicle: string;
  onVehicleSelect: (id: string) => void;
  distance: number;
  city: string;
  calculatingRoute: boolean;
  popularPlaces: any[];
  onPlaceSelect: (place: any) => void;
  onSearchFocus: () => void;
  hasDestination?: boolean;
  onSheetPositionChange?: (height: number) => void;
  onContinue?: () => void;
  isForSomeoneElse?: boolean;
  onToggleBeneficiary?: (value: boolean) => void;
  selectedBeneficiary?: any;
  onSelectBeneficiary?: (beneficiary: any) => void;
}

export default function YangoBottomSheet({ 
  bookingStep,
  selectedVehicle,
  onVehicleSelect,
  distance,
  city,
  calculatingRoute,
  popularPlaces,
  onPlaceSelect,
  onSearchFocus,
  onSheetPositionChange,
  onContinue,
  isForSomeoneElse,
  onToggleBeneficiary,
  selectedBeneficiary,
  onSelectBeneficiary
}: YangoBottomSheetProps) {
  
  // Feedback haptique simple
  const triggerHaptic = (intensity: 'light' | 'medium' = 'light') => {
    if ('vibrate' in navigator) {
      navigator.vibrate(intensity === 'medium' ? 15 : 10);
    }
  };

  // Notifier hauteur au montage
  useEffect(() => {
    onSheetPositionChange?.(420);
  }, [onSheetPositionChange]);

  // Bloquer le scroll du body quand le drawer est ouvert
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <Drawer 
      open={true} 
      dismissible={false}
      modal={false}
      snapPoints={[0.35, 0.85, 0.9]}
      activeSnapPoint={bookingStep === 'vehicle' ? 0.85 : 0.9}
      fadeFromIndex={2}
      handleOnly={false}
    >
      <DrawerContent className="max-h-[85vh]">
        {/* Handle bar VISIBLE et tactile */}
        <div className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gradient-to-r from-muted/40 via-muted to-muted/40 rounded-full shadow-sm" />
        </div>

        {/* Contenu scrollable avec ScrollArea */}
        <ScrollArea 
          className="px-5 pb-safe-area-inset-bottom font-montserrat"
          style={{ 
            maxHeight: 'calc(85vh - 60px)',
          }}
        >
        {/* ÉTAPE 1 : Sélection du véhicule */}
        {bookingStep === 'vehicle' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-5"
          >
            {/* Cartes véhicules verticales style Yango */}
            <YangoVerticalVehicleCards
              distance={distance}
              selectedVehicleId={selectedVehicle}
              onVehicleSelect={onVehicleSelect}
              city={city}
            />

            {/* Bouton Continuer rouge style Yango */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                onContinue?.();
                triggerHaptic('medium');
              }}
              disabled={!selectedVehicle}
              className={cn(
                "w-full py-4 rounded-2xl font-montserrat font-bold text-base",
                "bg-gradient-to-r from-congo-red to-congo-red-electric shadow-xl",
                "hover:shadow-2xl hover:from-congo-red-electric hover:to-congo-red",
                "transition-all duration-300 transform",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2 text-white",
                "active:shadow-inner"
              )}
            >
              Continuer
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
              </motion.div>
            </motion.button>

            {/* Message d'aide si aucun véhicule sélectionné */}
            {!selectedVehicle && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Sélectionnez un véhicule ci-dessus pour continuer
              </p>
            )}

            {/* Carte Réserver pour quelqu'un d'autre */}
            {isForSomeoneElse !== undefined && onToggleBeneficiary && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-4 shadow-sm border border-border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-congo-red/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-congo-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Réserver pour quelqu'un d'autre</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Offrez un trajet à un proche</p>
                    </div>
                  </div>
                  <Switch 
                    checked={isForSomeoneElse} 
                    onCheckedChange={(checked) => {
                      onToggleBeneficiary(checked);
                      triggerHaptic('light');
                    }}
                  />
                </div>
                
                {/* Sélecteur de bénéficiaire si activé */}
                {isForSomeoneElse && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <BeneficiarySelector
                      isForSomeoneElse={isForSomeoneElse}
                      onToggle={onToggleBeneficiary}
                      selectedBeneficiary={selectedBeneficiary || null}
                      onSelectBeneficiary={onSelectBeneficiary || (() => {})}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ÉTAPE 2 : Sélection de la destination */}
        {bookingStep === 'destination' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground mb-3 px-1">
                Où allez-vous ?
              </h3>
              
              {/* Barre de recherche */}
              <DestinationSearchBar onFocus={onSearchFocus} />
            </div>
            
            {/* Lieux populaires */}
            <PopularPlacesList 
              places={popularPlaces}
              onSelectPlace={onPlaceSelect}
            />
          </motion.div>
        )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
