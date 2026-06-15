import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, RefreshCw, TrendingUp } from 'lucide-react';
import motoSvg from '@/assets/vehicle-icons/moto.svg';
import carSvg from '@/assets/vehicle-icons/car.svg';
import carConfortSvg from '@/assets/vehicle-icons/car-confort.svg';
import carPremiumSvg from '@/assets/vehicle-icons/car-premium.svg';
import deliveryMotoSvg from '@/assets/vehicle-icons/d-moto.svg';
import deliveryFlexSvg from '@/assets/vehicle-icons/d-flex.svg';
import deliveryMaxiSvg from '@/assets/vehicle-icons/d-maxi.svg';
import { motion, AnimatePresence } from 'framer-motion';
import { isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

// ===== Traduction des statuts =====
const statusLabels: Record<string, string> = {
  cancelled: 'Annulé',
  completed: 'Terminé',
  delivered: 'Livré',
  pending: 'En attente',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  processing: 'Traitement',
  driver_assigned: 'Chauffeur assigné',
  picked_up: 'Récupéré',
  failed: 'Échoué',
};

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-500',
  delivered: 'bg-emerald-500',
  finished: 'bg-emerald-500',
  in_progress: 'bg-blue-500',
  processing: 'bg-blue-500',
  driver_assigned: 'bg-blue-500',
  picked_up: 'bg-blue-500',
  pending: 'bg-amber-500',
  confirmed: 'bg-amber-500',
  cancelled: 'bg-red-500',
  failed: 'bg-red-500',
};

// ===== Traduction véhicules =====
const vehicleLabels: Record<string, string> = {
  taxi_moto: 'Taxi Moto',
  taxi_eco: 'Taxi Éco',
  taxi_confort: 'Taxi Confort',
  taxi_premium: 'Taxi Premium',
  taxi_bus: 'Taxi Bus',
  vtc_prive: 'VTC Privé',
  eco: 'Éco',
  moto: 'Moto',
  standard: 'Standard',
  premium: 'Premium',
  delivery_flash: 'Flash',
  delivery_flex: 'Flex',
  delivery_maxi: 'Maxi',
  flash: 'Flash',
  flex: 'Flex',
  maxi: 'Maxi',
};

const VEHICLE_ICON_MAP: Record<string, string> = {
  taxi_moto: motoSvg,
  taxi_eco: carSvg,
  taxi_confort: carConfortSvg,
  taxi_premium: carPremiumSvg,
  eco: carSvg,
  moto: motoSvg,
  standard: carSvg,
  premium: carPremiumSvg,
  delivery_flash: deliveryMotoSvg,
  delivery_flex: deliveryFlexSvg,
  delivery_maxi: deliveryMaxiSvg,
  flash: deliveryMotoSvg,
  flex: deliveryFlexSvg,
  maxi: deliveryMaxiSvg,
};

interface EnhancedBooking {
  id: string;
  pickup_location: string;
  destination: string;
  vehicle_type: string;
  status: string;
  actual_price?: number;
  created_at: string;
  booking_time: string;
  completion_time?: string;
  driver_id?: string;
  driver?: { display_name: string; avatar_url?: string };
  rating?: { rating: number; comment?: string };
}

interface DateGroup {
  key: string;
  label: string;
  items: EnhancedBooking[];
}

function groupByDate(bookings: EnhancedBooking[]): DateGroup[] {
  const groups: Record<string, EnhancedBooking[]> = {
    today: [], yesterday: [], thisWeek: [], thisMonth: [], older: [],
  };
  for (const b of bookings) {
    const d = new Date(b.created_at);
    if (isToday(d)) groups.today.push(b);
    else if (isYesterday(d)) groups.yesterday.push(b);
    else if (isThisWeek(d)) groups.thisWeek.push(b);
    else if (isThisMonth(d)) groups.thisMonth.push(b);
    else groups.older.push(b);
  }
  const labels: Record<string, string> = {
    today: "Aujourd'hui", yesterday: 'Hier', thisWeek: 'Cette semaine', thisMonth: 'Ce mois', older: 'Plus ancien',
  };
  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([key, items]) => ({ key, label: labels[key], items }));
}

// Format short address: last meaningful segment
function shortAddress(addr: string): string {
  if (!addr) return '...';
  const parts = addr.split(',').map(s => s.trim()).filter(Boolean);
  // Return first part (usually most specific)
  return parts[0] || addr;
}

export const ActivityHistory = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<EnhancedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadBookings(); }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data: bookingsData, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && bookingsData) {
        const enhancedBookings = await Promise.all(
          bookingsData.map(async (booking) => {
            let driver = null;
            let rating = null;
            if (booking.driver_id) {
              const { data: driverData } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('user_id', booking.driver_id)
                .maybeSingle();
              driver = driverData;
              const { data: ratingData } = await supabase
                .from('user_ratings')
                .select('rating, comment')
                .eq('booking_id', booking.id)
                .maybeSingle();
              rating = ratingData;
            }
            return { ...booking, driver, rating };
          })
        );
        setBookings(enhancedBookings);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setTimeout(() => setRefreshing(false), 400);
  };

  const dateGroups = useMemo(() => groupByDate(bookings), [bookings]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const currency = (() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz === 'Africa/Abidjan' || tz === 'Africa/Dakar' || tz === 'Africa/Accra' ? 'XOF' : 'CDF';
  })();

  const formatAmount = (amount: number) => {
    if (currency === 'XOF') {
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M XOF`;
      if (amount >= 1000) return `${Math.round(amount / 1000).toLocaleString()}K XOF`;
      return `${amount.toLocaleString()} XOF`;
    }
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M CDF`;
    if (amount >= 1000) return `${Math.round(amount / 1000).toLocaleString()}K CDF`;
    return `${amount.toLocaleString()} CDF`;
  };

  const getTranslatedStatus = (status: string) => statusLabels[status.toLowerCase()] || status;
  const getStatusColor = (status: string) => statusColors[status.toLowerCase()] || 'bg-muted-foreground';
  const getVehicleLabel = (type: string) => vehicleLabels[type?.toLowerCase()] || type;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-card border border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted/60 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted/60 rounded-full w-3/4 animate-pulse" />
                  <div className="h-2.5 bg-muted/40 rounded-full w-1/2 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header compact */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{bookings.length} courses</p>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh} 
          className="h-8 w-8 rounded-full"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 pb-24">
        {bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted/40 rounded-2xl flex items-center justify-center">
              <TrendingUp className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Aucune course</h3>
            <p className="text-xs text-muted-foreground/70">Vos courses apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-1">
            {dateGroups.map((group) => (
              <div key={group.key}>
                {/* Date separator */}
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {group.items.map((booking, idx) => {
                      const statusText = getTranslatedStatus(booking.status);
                      const statusDot = getStatusColor(booking.status);
                      const vehicle = getVehicleLabel(booking.vehicle_type);
                      const hasAmount = booking.actual_price != null && booking.actual_price > 0;

                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.03, 0.2) }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card className="bg-card border-border/30 shadow-sm">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                {/* Vehicle icon */}
                                <div className="w-12 h-10 flex items-center justify-center flex-shrink-0">
                                  <img
                                    src={VEHICLE_ICON_MAP[booking.vehicle_type?.toLowerCase()] || carSvg}
                                    alt={booking.vehicle_type}
                                    className="w-12 h-9 object-contain"
                                  />
                                </div>

                                {/* Main content */}
                                <div className="flex-1 min-w-0">
                                  {/* Route */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-foreground text-sm truncate">
                                      {shortAddress(booking.pickup_location)}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
                                    <span className="font-medium text-foreground text-sm truncate">
                                      {shortAddress(booking.destination)}
                                    </span>
                                  </div>

                                  {/* Subtitle: vehicle + time */}
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-xs text-muted-foreground">{vehicle}</span>
                                    <span className="text-muted-foreground/50">•</span>
                                    <span className="text-xs text-muted-foreground">{formatTime(booking.created_at)}</span>
                                  </div>

                                  {/* Status */}
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                                    <span className="text-[11px] text-muted-foreground">{statusText}</span>
                                  </div>
                                </div>

                                {/* Amount (hidden if null) */}
                                {hasAmount && (
                                  <div className="text-right flex-shrink-0">
                                    <div className="text-sm font-semibold text-foreground">
                                      {formatAmount(booking.actual_price!)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}

            <p className="text-center text-xs text-muted-foreground py-6">
              Toutes les courses affichées
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
