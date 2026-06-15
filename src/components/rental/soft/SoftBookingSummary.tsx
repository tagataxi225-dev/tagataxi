import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, MapPin, User, Car, Shield, Clock, 
  ChevronRight, Sparkles, Check, CreditCard
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface SoftBookingSummaryProps {
  vehicle: {
    name: string;
    brand: string;
    model: string;
    images?: string[];
    seats?: number;
    transmission?: string;
  };
  dateRange: DateRange;
  driverChoice: 'with_driver' | 'without_driver';
  pickupLocation: string;
  returnLocation?: string;
  selectedEquipment: Array<{ name: string; price: number }>;
  totalPrice: number;
  formatPrice: (price: number) => string;
  onConfirm: () => void;
  isLoading?: boolean;
  partnerName?: string;
}

export const SoftBookingSummary = ({
  vehicle,
  dateRange,
  driverChoice,
  pickupLocation,
  returnLocation,
  selectedEquipment,
  totalPrice,
  formatPrice,
  onConfirm,
  isLoading = false,
  partnerName
}: SoftBookingSummaryProps) => {
  const days = dateRange.from && dateRange.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1 
    : 1;

  const guarantees = [
    { icon: Shield, text: 'Annulation gratuite 24h' },
    { icon: Check, text: 'Véhicule vérifié' },
    { icon: CreditCard, text: 'Paiement sécurisé' },
  ];

  return (
    <div className="space-y-4">
      {/* Vehicle Hero Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden bg-card border border-border/50 shadow-lg"
      >
        {/* Image with Gradient Overlay */}
        <div className="relative h-40">
          <img 
            src={vehicle.images?.[0] || '/placeholder.svg'} 
            alt={vehicle.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {/* Partner Badge */}
          {partnerName && (
            <Badge 
              className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm border-0"
            >
              {partnerName}
            </Badge>
          )}
        </div>

        {/* Vehicle Info */}
        <div className="p-4 -mt-12 relative">
          <h3 className="text-xl font-bold text-foreground mb-1">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">{vehicle.name}</p>
          
          <div className="flex gap-3">
            {vehicle.seats && (
              <span className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> {vehicle.seats} places
              </span>
            )}
            {vehicle.transmission && (
              <span className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground flex items-center gap-1">
                <Car className="w-3 h-3" /> {vehicle.transmission}
              </span>
            )}
            <span className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary flex items-center gap-1">
              <User className="w-3 h-3" /> 
              {driverChoice === 'with_driver' ? 'Avec chauffeur' : 'Sans chauffeur'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Date Timeline */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border/50 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Début</span>
            </div>
            <p className="font-semibold text-foreground">
              {dateRange.from && format(dateRange.from, 'EEE dd MMM', { locale: fr })}
            </p>
          </div>

          <div className="flex flex-col items-center px-4">
            <div className="w-16 h-0.5 bg-gradient-to-r from-primary to-emerald-500 rounded-full" />
            <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary border-0">
              <Clock className="w-3 h-3 mr-1" />
              {days} jour{days > 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="flex-1 text-right">
            <div className="flex items-center justify-end gap-2 mb-2">
              <span className="text-xs text-muted-foreground">Fin</span>
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <p className="font-semibold text-foreground">
              {dateRange.to && format(dateRange.to, 'EEE dd MMM', { locale: fr })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Location */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-2xl border border-border/50 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lieu de prise en charge</p>
            <p className="font-medium text-foreground">{pickupLocation || 'À définir'}</p>
            {returnLocation && returnLocation !== pickupLocation && (
              <p className="text-xs text-muted-foreground mt-1">
                Retour: {returnLocation}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Equipment */}
      {selectedEquipment.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border/50 p-4"
        >
          <p className="text-sm text-muted-foreground mb-2">Équipements</p>
          <div className="flex flex-wrap gap-2">
            {selectedEquipment.map((eq, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="bg-muted border-0"
              >
                {eq.name}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Price Breakdown */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-gradient-to-br from-primary/5 via-card to-emerald-500/5 rounded-2xl border border-primary/20 p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted-foreground">Total pour {days} jour{days > 1 ? 's' : ''}</span>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {formatPrice(totalPrice)}
            </p>
          </div>
        </div>

        {/* Guarantees */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50">
          {guarantees.map((g, i) => (
            <span 
              key={i}
              className="text-[10px] px-2 py-1 rounded-full bg-background/50 text-muted-foreground flex items-center gap-1"
            >
              <g.icon className="w-3 h-3" />
              {g.text}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Confirm Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            "w-full h-14 rounded-2xl text-lg font-semibold",
            "bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90",
            "shadow-lg shadow-primary/25 transition-all duration-300",
            "flex items-center justify-center gap-3"
          )}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Confirmer la réservation
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
};
