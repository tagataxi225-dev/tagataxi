import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Settings, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useModernRentals } from '@/hooks/useModernRentals';
import { useRentalBookings } from '@/hooks/useRentalBookings';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, differenceInHours } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { getCurrencyByCity } from '@/utils/formatCurrency';
import { DepositPaymentSheet } from '@/components/rental/DepositPaymentSheet';

import { SoftDateRangePicker } from './SoftDateRangePicker';
import { SoftDriverToggle } from './SoftDriverToggle';
import { SoftEquipmentSelector } from './SoftEquipmentSelector';
import { SoftBookingSummary } from './SoftBookingSummary';

type Step = 'dates' | 'options' | 'summary';

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'dates', label: 'Dates', icon: Calendar },
  { id: 'options', label: 'Options', icon: Settings },
  { id: 'summary', label: 'Résumé', icon: CheckCircle2 },
];

export const SoftRentalBooking = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vehicles, vehicleEquipment, calculateCityPrice, createBooking, getEquipmentPrice } = useModernRentals();
  const { payRentalDeposit, loading: depositLoading } = useRentalBookings();
  const { wallet } = useWallet();

  // State
  const [currentStep, setCurrentStep] = useState<Step>('dates');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [driverChoice, setDriverChoice] = useState<'with_driver' | 'without_driver' | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [pickupLocation, setPickupLocation] = useState('');
  const [sameReturnLocation, setSameReturnLocation] = useState(true);
  const [returnLocation, setReturnLocation] = useState('');
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<any>(null);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);

  const vehicle = vehicles.find(v => v.id === vehicleId);

  // Fetch booked dates
  useEffect(() => {
    const fetchBookedDates = async () => {
      if (!vehicleId) return;
      
      try {
        const { data, error } = await supabase
          .from('rental_bookings')
          .select('start_date, end_date')
          .eq('vehicle_id', vehicleId)
          .in('status', ['pending', 'confirmed', 'active', 'approved_by_partner']);

        if (error) throw error;

        const dates: Date[] = [];
        data?.forEach((booking: any) => {
          const start = new Date(booking.start_date);
          const end = new Date(booking.end_date);
          
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
          }
        });

        setBookedDates(dates);
      } catch (error) {
        console.error('Error fetching booked dates:', error);
      }
    };

    fetchBookedDates();
  }, [vehicleId]);

  // Auto-select driver choice - Par défaut TOUJOURS avec chauffeur
  useEffect(() => {
    if (vehicle && driverChoice === null) {
      // Toujours avec chauffeur par défaut
      setDriverChoice('with_driver');
    }
  }, [vehicle, driverChoice]);

  // Equipment for this vehicle
  const availableEquipment = useMemo(() => {
    if (!vehicle) return [];
    return vehicleEquipment.filter(eq => eq.category === 'vehicle' || eq.category === 'comfort');
  }, [vehicle, vehicleEquipment]);

  const currency = useMemo(() => getCurrencyByCity(vehicle?.city || ''), [vehicle?.city]);

  const formatCDF = (amount: number): string => {
    return `${amount.toLocaleString('fr-CD')} ${currency}`;
  };

  // Calculate days
  const days = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    return Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1);
  }, [dateRange]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to || !driverChoice || !vehicle) return 0;
    
    const rates = driverChoice === 'with_driver' 
      ? {
          hourly: vehicle.with_driver_hourly_rate || vehicle.hourly_rate,
          daily: vehicle.with_driver_daily_rate || vehicle.daily_rate,
          weekly: vehicle.with_driver_weekly_rate || vehicle.weekly_rate
        }
      : {
          hourly: vehicle.without_driver_hourly_rate || vehicle.hourly_rate,
          daily: vehicle.without_driver_daily_rate || vehicle.daily_rate,
          weekly: vehicle.without_driver_weekly_rate || vehicle.weekly_rate
        };
    
    let basePrice = 0;
    if (days >= 7) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      basePrice = (weeks * calculateCityPrice(rates.weekly, vehicle.category_id)) + 
                  (remainingDays * calculateCityPrice(rates.daily, vehicle.category_id));
    } else {
      basePrice = days * calculateCityPrice(rates.daily, vehicle.category_id);
    }

    const equipmentFees = selectedEquipment.reduce((total, eqId) => {
      const price = getEquipmentPrice(eqId, vehicle.city);
      return total + (price * days);
    }, 0);
    
    return basePrice + equipmentFees;
  }, [dateRange, driverChoice, vehicle, days, selectedEquipment, calculateCityPrice, getEquipmentPrice]);

  // Get prices for driver toggle
  const withDriverPrice = vehicle 
    ? calculateCityPrice(vehicle.with_driver_daily_rate || vehicle.daily_rate, vehicle.category_id)
    : 0;
  const withoutDriverPrice = vehicle 
    ? calculateCityPrice(vehicle.without_driver_daily_rate || vehicle.daily_rate, vehicle.category_id)
    : 0;

  // Step validation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'dates':
        return dateRange?.from && dateRange?.to && driverChoice;
      case 'options':
        return pickupLocation.trim().length > 0;
      case 'summary':
        return true;
      default:
        return false;
    }
  }, [currentStep, dateRange, driverChoice, pickupLocation]);

  // Navigation
  const nextStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  // Submit booking
  const handleSubmit = async () => {
    if (!vehicle || !dateRange?.from || !dateRange?.to || !driverChoice) return;

    setIsSubmitting(true);
    try {
      const result = await createBooking.mutateAsync({
        vehicle_id: vehicle.id,
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
        driver_choice: driverChoice,
        pickup_location: pickupLocation,
        return_location: sameReturnLocation ? pickupLocation : returnLocation,
        equipment_ids: selectedEquipment,
        total_price: totalPrice,
        rental_duration_type: days >= 7 ? 'weekly' : 'daily',
        security_deposit: vehicle.security_deposit || 0
      });

      const depositAmount = Math.round(totalPrice * 0.30);
      setPendingBooking({
        id: result.id,
        total_amount: totalPrice,
        deposit_amount: depositAmount,
        deposit_percentage: 30,
        remaining_amount: totalPrice - depositAmount,
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
        rental_vehicles: {
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          images: vehicle.images
        }
      });
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la réservation",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading/Error states
  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Véhicule non trouvé</h3>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
        </div>
      </div>
    );
  }

  // Get selected equipment details for summary
  const selectedEquipmentDetails = availableEquipment
    .filter(eq => selectedEquipment.includes(eq.id))
    .map(eq => ({ name: eq.name, price: getEquipmentPrice(eq.id, vehicle.city) }));

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">Réserver</h1>
              <p className="text-xs text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isPast = steps.findIndex(s => s.id === currentStep) > index;
              const Icon = step.icon;

              return (
                <React.Fragment key={step.id}>
                  <motion.div
                    initial={false}
                    animate={{ 
                      scale: isActive ? 1 : 0.9,
                      opacity: isActive || isPast ? 1 : 0.5 
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl transition-colors",
                      isActive && "bg-primary/10",
                      isPast && "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium",
                      isActive && "bg-primary text-primary-foreground",
                      isPast && "bg-primary/20 text-primary",
                      !isActive && !isPast && "bg-muted text-muted-foreground"
                    )}>
                      {isPast ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={cn(
                      "text-sm font-medium hidden sm:block",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </motion.div>
                  
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 rounded-full transition-colors",
                      isPast ? "bg-primary" : "bg-border"
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {currentStep === 'dates' && (
            <motion.div
              key="dates"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Quand souhaitez-vous louer ?</h2>
                <p className="text-sm text-muted-foreground">Sélectionnez vos dates et votre option de conduite</p>
              </div>

              <SoftDateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                bookedDates={bookedDates}
              />

              {dateRange?.from && dateRange?.to && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <h3 className="font-semibold text-foreground">Option de conduite</h3>
                  <SoftDriverToggle
                    value={driverChoice}
                    onChange={setDriverChoice}
                    withDriverPrice={withDriverPrice}
                    withoutDriverPrice={withoutDriverPrice}
                    selfDriveAllowed={(vehicle as any).self_drive_allowed || false}
                    formatPrice={formatCDF}
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {currentStep === 'options' && (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Lieu et équipements</h2>
                <p className="text-sm text-muted-foreground">Où souhaitez-vous récupérer le véhicule ?</p>
              </div>

              {/* Pickup Location */}
              <div className="space-y-3">
                <Label htmlFor="pickup" className="text-sm font-medium">
                  Lieu de prise en charge *
                </Label>
                <Input
                  id="pickup"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Ex: Gombe, Kinshasa"
                  className="h-12 rounded-xl"
                />
              </div>

              {/* Same return location toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <Checkbox
                  id="sameLocation"
                  checked={sameReturnLocation}
                  onCheckedChange={(checked) => setSameReturnLocation(!!checked)}
                />
                <Label htmlFor="sameLocation" className="text-sm cursor-pointer">
                  Retourner le véhicule au même endroit
                </Label>
              </div>

              {/* Return location if different */}
              <AnimatePresence>
                {!sameReturnLocation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <Label htmlFor="return" className="text-sm font-medium">
                      Lieu de retour
                    </Label>
                    <Input
                      id="return"
                      value={returnLocation}
                      onChange={(e) => setReturnLocation(e.target.value)}
                      placeholder="Ex: Aéroport de N'djili"
                      className="h-12 rounded-xl"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Equipment */}
              {availableEquipment.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <h3 className="font-semibold text-foreground">Équipements optionnels</h3>
                  <SoftEquipmentSelector
                    equipment={availableEquipment.map(eq => ({
                      id: eq.id,
                      name: eq.name,
                      price: getEquipmentPrice(eq.id, vehicle.city),
                      icon: eq.icon
                    }))}
                    selectedIds={selectedEquipment}
                    onSelectionChange={setSelectedEquipment}
                    formatPrice={formatCDF}
                    days={days}
                  />
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Récapitulatif</h2>
                <p className="text-sm text-muted-foreground">Vérifiez les détails de votre réservation</p>
              </div>

              <SoftBookingSummary
                vehicle={vehicle}
                dateRange={dateRange!}
                driverChoice={driverChoice!}
                pickupLocation={pickupLocation}
                returnLocation={sameReturnLocation ? undefined : returnLocation}
                selectedEquipment={selectedEquipmentDetails}
                totalPrice={totalPrice}
                formatPrice={formatCDF}
                onConfirm={handleSubmit}
                isLoading={isSubmitting}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Paiement acompte */}
      {pendingBooking && (
        <DepositPaymentSheet
          isOpen={!!pendingBooking}
          onClose={() => setPendingBooking(null)}
          booking={pendingBooking}
          walletBalance={(wallet?.balance || 0) + (wallet?.bonus_balance || 0)}
          onPayDeposit={async (bookingId, amount, method) => {
            setIsProcessingDeposit(true);
            try {
              const success = await payRentalDeposit(bookingId, amount, method);
              if (success) {
                setPendingBooking(null);
                navigate('/app/client/rental/bookings');
              }
              return success;
            } finally {
              setIsProcessingDeposit(false);
            }
          }}
          isProcessing={isProcessingDeposit}
        />
      )}

      {/* Bottom Navigation - Only show on non-summary steps */}
      {currentStep !== 'summary' && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 p-4 z-40">
          <div className="max-w-2xl mx-auto flex gap-3">
            {currentStep !== 'dates' && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex-1 h-12 rounded-xl"
              >
                Retour
              </Button>
            )}
            <Button
              onClick={nextStep}
              disabled={!canProceed}
              className={cn(
                "flex-1 h-12 rounded-xl font-semibold",
                "bg-gradient-to-r from-primary to-emerald-500",
                "hover:from-primary/90 hover:to-emerald-500/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {currentStep === 'options' ? 'Voir le récapitulatif' : 'Continuer'}
              {totalPrice > 0 && currentStep === 'options' && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-lg text-sm">
                  {formatCDF(totalPrice)}
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoftRentalBooking;
