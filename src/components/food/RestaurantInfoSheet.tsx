import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, MapPin, Phone, Mail, Globe, Truck, ShoppingBag, 
  CreditCard, Smartphone, Check, X, ChevronRight, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { Restaurant } from '@/types/food';

interface RestaurantInfoSheetProps {
  restaurant: Restaurant;
}

// Mock opening hours (would come from restaurant data in real app)
const defaultOpeningHours = [
  { day: 'Lundi', open: '08:00', close: '22:00', isOpen: true },
  { day: 'Mardi', open: '08:00', close: '22:00', isOpen: true },
  { day: 'Mercredi', open: '08:00', close: '22:00', isOpen: true },
  { day: 'Jeudi', open: '08:00', close: '22:00', isOpen: true },
  { day: 'Vendredi', open: '08:00', close: '23:00', isOpen: true },
  { day: 'Samedi', open: '09:00', close: '23:00', isOpen: true },
  { day: 'Dimanche', open: '10:00', close: '21:00', isOpen: true },
];

const getCurrentDayIndex = () => {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1; // Convert to Mon=0 format
};

const isCurrentlyOpen = () => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const todayHours = defaultOpeningHours[getCurrentDayIndex()];
  
  if (!todayHours.isOpen) return false;
  
  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);
  
  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;
  
  return currentTime >= openTime && currentTime <= closeTime;
};

export const RestaurantInfoSheet: React.FC<RestaurantInfoSheetProps> = ({
  restaurant,
}) => {
  const isOpen = isCurrentlyOpen();
  const todayIndex = getCurrentDayIndex();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Info className="w-4 h-4" />
          Plus d'infos
          <ChevronRight className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-xl">À propos de {restaurant.restaurant_name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-100px)] pb-8">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <Badge 
              variant={isOpen ? "default" : "secondary"}
              className={isOpen ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {isOpen ? (
                <><Check className="w-3 h-3 mr-1" /> Ouvert</>
              ) : (
                <><X className="w-3 h-3 mr-1" /> Fermé</>
              )}
            </Badge>
            {isOpen && (
              <span className="text-sm text-muted-foreground">
                Ferme à {defaultOpeningHours[todayIndex].close}
              </span>
            )}
          </div>

          {/* Opening Hours */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Horaires d'ouverture
            </h3>
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              {defaultOpeningHours.map((hours, index) => (
                <motion.div
                  key={hours.day}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between py-1.5 px-2 rounded-lg ${
                    index === todayIndex ? 'bg-primary/10 font-medium' : ''
                  }`}
                >
                  <span className={index === todayIndex ? 'text-primary' : 'text-muted-foreground'}>
                    {hours.day}
                  </span>
                  {hours.isOpen ? (
                    <span>{hours.open} - {hours.close}</span>
                  ) : (
                    <span className="text-muted-foreground">Fermé</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Contact
            </h3>
            <div className="space-y-3">
              {restaurant.phone_number && (
                <a 
                  href={`tel:${restaurant.phone_number}`}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{restaurant.phone_number}</p>
                  </div>
                </a>
              )}
              
              {restaurant.address && (
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-medium truncate">{restaurant.address}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>

          <Separator />

          {/* Services */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Services disponibles
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-4 rounded-xl border ${
                restaurant.delivery_available 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-muted/50 border-transparent'
              }`}>
                <Truck className={`w-6 h-6 mb-2 ${
                  restaurant.delivery_available ? 'text-green-600' : 'text-muted-foreground'
                }`} />
                <p className="font-medium">Livraison</p>
                <p className="text-xs text-muted-foreground">
                  {restaurant.delivery_available ? 'Disponible' : 'Non disponible'}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${
                restaurant.takeaway_available 
                  ? 'bg-blue-500/10 border-blue-500/30' 
                  : 'bg-muted/50 border-transparent'
              }`}>
                <ShoppingBag className={`w-6 h-6 mb-2 ${
                  restaurant.takeaway_available ? 'text-blue-600' : 'text-muted-foreground'
                }`} />
                <p className="font-medium">À emporter</p>
                <p className="text-xs text-muted-foreground">
                  {restaurant.takeaway_available ? 'Disponible' : 'Non disponible'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Methods */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Moyens de paiement
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1.5 py-1.5">
                <CreditCard className="w-4 h-4" />
                Espèces
              </Badge>
              <Badge variant="outline" className="gap-1.5 py-1.5">
                <Smartphone className="w-4 h-4" />
                Mobile Money
              </Badge>
              <Badge variant="outline" className="gap-1.5 py-1.5">
                💳 TembeaPay
              </Badge>
            </div>
          </div>

          {/* Cuisine Types */}
          {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Types de cuisine</h3>
                <div className="flex flex-wrap gap-2">
                  {restaurant.cuisine_types.map((type) => (
                    <Badge key={type} variant="secondary" className="text-sm">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Min Order */}
          {restaurant.minimum_order_amount && restaurant.minimum_order_amount > 0 && (
            <>
              <Separator />
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  💡 Commande minimum : <strong>{restaurant.minimum_order_amount.toLocaleString()} FC</strong>
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
