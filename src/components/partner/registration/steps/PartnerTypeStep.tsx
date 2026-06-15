import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Package, Truck, Car, Building2, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PartnerTypeStepProps {
  onSelect: (type: 'delivery' | 'auto') => void;
}

const deliveryServices = [
  { icon: Zap, label: 'Flash', desc: 'Moto — Livraison express', color: 'text-red-500' },
  { icon: Package, label: 'Flex', desc: 'Camionnette — Standard', color: 'text-orange-500' },
  { icon: Truck, label: 'MaxiCharge', desc: 'Camion — Gros volumes', color: 'text-amber-600' },
];

const autoServices = [
  { icon: Car, label: 'Taxi / VTC', desc: 'Transport de personnes', color: 'text-blue-500' },
  { icon: Building2, label: 'Location', desc: 'Location de véhicules', color: 'text-violet-500' },
];

export const PartnerTypeStep = ({ onSelect }: PartnerTypeStepProps) => {
  const [selected, setSelected] = useState<'delivery' | 'auto' | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Quel type de partenaire êtes-vous ?
        </h2>
        <p className="text-muted-foreground text-sm">
          Choisissez votre secteur d'activité pour personnaliser votre espace partenaire
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Delivery Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelected('delivery')}
          className={cn(
            'relative flex flex-col items-start text-left p-6 rounded-2xl border-2 transition-all duration-200 w-full',
            'bg-card hover:shadow-lg',
            selected === 'delivery'
              ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/20 shadow-lg shadow-orange-500/10'
              : 'border-border hover:border-orange-300'
          )}
        >
          {/* Selected checkmark */}
          {selected === 'delivery' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-4 right-4 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center"
            >
              <Check className="w-3.5 h-3.5 text-white" />
            </motion.div>
          )}

          {/* Icon header */}
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all',
            selected === 'delivery'
              ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30'
              : 'bg-orange-50 dark:bg-orange-950/30'
          )}>
            <Truck className={cn('w-7 h-7', selected === 'delivery' ? 'text-white' : 'text-orange-500')} />
          </div>

          <div className="mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 mb-3">
              🚀 Livraison de colis
            </span>
          </div>

          <h3 className="text-lg font-bold text-foreground mb-1">
            Partenaire Delivery
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Gérez vos livreurs et livraisons multimodales
          </p>

          <div className="space-y-2 w-full">
            {deliveryServices.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center bg-white dark:bg-card shadow-sm')}>
                  <s.icon className={cn('w-3.5 h-3.5', s.color)} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground">{s.label}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.button>

        {/* Auto Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelected('auto')}
          className={cn(
            'relative flex flex-col items-start text-left p-6 rounded-2xl border-2 transition-all duration-200 w-full',
            'bg-card hover:shadow-lg',
            selected === 'auto'
              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/20 shadow-lg shadow-blue-500/10'
              : 'border-border hover:border-blue-300'
          )}
        >
          {/* Selected checkmark */}
          {selected === 'auto' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"
            >
              <Check className="w-3.5 h-3.5 text-white" />
            </motion.div>
          )}

          {/* Icon header */}
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all',
            selected === 'auto'
              ? 'bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/30'
              : 'bg-blue-50 dark:bg-blue-950/30'
          )}>
            <Car className={cn('w-7 h-7', selected === 'auto' ? 'text-white' : 'text-blue-500')} />
          </div>

          <div className="mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 mb-3">
              🚗 Transport & Location
            </span>
          </div>

          <h3 className="text-lg font-bold text-foreground mb-1">
            Partenaire Auto
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Gérez votre flotte Taxi, VTC et locations
          </p>

          <div className="space-y-2 w-full">
            {autoServices.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center bg-white dark:bg-card shadow-sm')}>
                  <s.icon className={cn('w-3.5 h-3.5', s.color)} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground">{s.label}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.button>
      </div>

      <Button
        onClick={() => selected && onSelect(selected)}
        disabled={!selected}
        className={cn(
          'w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200',
          selected === 'delivery'
            ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/25'
            : selected === 'auto'
            ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg shadow-blue-500/25'
            : ''
        )}
      >
        <span>Continuer</span>
        <ArrowRight className="w-4 h-4 ml-2 inline" />
      </Button>
    </div>
  );
};
