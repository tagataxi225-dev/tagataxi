import { useState } from 'react';
import { ServicesFormData } from '@/schemas/partnerRegistration';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ServicesStepProps {
  data: ServicesFormData;
  onNext: (data: ServicesFormData) => void;
  onPrevious: () => void;
  partnerType?: 'delivery' | 'auto';
  theme?: any;
}

const AVAILABLE_CITIES = [
  { id: 'Kinshasa', name: 'Kinshasa', country: 'République Démocratique du Congo', flag: '🇨🇩', region: 'Ouest' },
  { id: 'Lubumbashi', name: 'Lubumbashi', country: 'République Démocratique du Congo', flag: '🇨🇩', region: 'Sud-Est' },
  { id: 'Kolwezi', name: 'Kolwezi', country: 'République Démocratique du Congo', flag: '🇨🇩', region: 'Lualaba' },
];

export const ServicesStep = ({ data, onNext, onPrevious, partnerType, theme }: ServicesStepProps) => {
  const [selectedAreas, setSelectedAreas] = useState<string[]>(data.service_areas || ['Kinshasa']);

  const handleToggleCity = (cityId: string) => {
    setSelectedAreas(prev =>
      prev.includes(cityId) ? prev.filter(id => id !== cityId) : [...prev, cityId]
    );
  };

  const handleSubmit = () => {
    if (selectedAreas.length === 0) {
      toast.error('Veuillez sélectionner au moins une zone de service');
      return;
    }
    if (selectedAreas.length > 10) {
      toast.error('Maximum 10 zones de service autorisées');
      return;
    }
    onNext({ service_areas: selectedAreas });
  };

  const iconColor = partnerType === 'auto' ? 'text-blue-500' : partnerType === 'delivery' ? 'text-orange-500' : 'text-emerald-500';
  const selectedBorder = partnerType === 'auto' ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/20 shadow-blue-500/10' :
                         partnerType === 'delivery' ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/20 shadow-orange-500/10' :
                         'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-emerald-500/10';
  const checkBg = partnerType === 'auto' ? 'bg-blue-500' : partnerType === 'delivery' ? 'bg-orange-500' : 'bg-emerald-500';
  const badgeBg = partnerType === 'auto' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' :
                  partnerType === 'delivery' ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300' :
                  'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center',
          partnerType === 'auto' ? 'bg-blue-100 dark:bg-blue-950/40' :
          partnerType === 'delivery' ? 'bg-orange-100 dark:bg-orange-950/40' :
          'bg-emerald-100 dark:bg-emerald-950/40'
        )}>
          <Globe className={cn('w-5 h-5', iconColor)} />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-base">Zones d'intervention</h3>
          <p className="text-xs text-muted-foreground">Sélectionnez les villes où vous opérez</p>
        </div>
      </div>

      {/* Cities grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AVAILABLE_CITIES.map((city) => {
          const isSelected = selectedAreas.includes(city.id);
          return (
            <motion.button
              key={city.id}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleToggleCity(city.id)}
              className={cn(
                'relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 w-full',
                isSelected
                  ? cn('shadow-md', selectedBorder)
                  : 'border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40'
              )}
            >
              {/* Checkmark */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={cn('absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center', checkBg)}
                  >
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Flag */}
              <div className="text-3xl leading-none flex-shrink-0">{city.flag}</div>

              {/* Info */}
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm">{city.name}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selection summary */}
      <AnimatePresence>
        {selectedAreas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-muted/30 rounded-2xl border border-border/40"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Sélectionnées ({selectedAreas.length}/10)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedAreas.map((areaId) => {
                const city = AVAILABLE_CITIES.find(c => c.id === areaId);
                return (
                  <span key={areaId} className={cn('inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full', badgeBg)}>
                    {city?.flag} {city?.name}
                  </span>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          className="flex-1 h-12 rounded-xl border-border/60"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={selectedAreas.length === 0}
          className={cn('flex-1 h-12 rounded-xl font-semibold text-white', theme?.btnClass)}
        >
          Continuer
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
