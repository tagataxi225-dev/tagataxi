import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  Calendar as CalendarIcon, ArrowLeft, ArrowRight, 
  Check, User, Phone, Mail, CreditCard, Shield, Clock, 
  MapPin, Car, Users, Settings, Star, CalendarCheck, CalendarX, ArrowDown
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useModernRentals } from '@/hooks/useModernRentals';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, differenceInHours, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

type BookingStep = 'dates' | 'driver-choice' | 'pickup-location' | 'vehicle-equipment' | 'driver-info' | 'summary';

export const ModernRentalBooking = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vehicles, vehicleEquipment, driverEquipment, calculateCityPrice, createBooking, getEquipmentPrice } = useModernRentals();
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('dates');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [driverChoice, setDriverChoice] = useState<'with_driver' | 'without_driver' | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [driverInfo, setDriverInfo] = useState({
    name: '',
    phone: '',
    email: '',
    license: ''
  });
  const [pickupLocation, setPickupLocation] = useState('');
  const [returnLocation, setReturnLocation] = useState('');
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'unavailable' | null>(null);

  const vehicle = vehicles.find(v => v.id === vehicleId);

  // Charger les dates réservées pour ce véhicule
  useEffect(() => {
    const fetchBookedDates = async () => {
      if (!vehicleId) return;
      
      try {
        const { data, error } = await supabase
          .from('rental_bookings')
          .select('start_date, end_date')
          .eq('vehicle_id', vehicleId)
          .in('status', ['pending', 'confirmed', 'active']);

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

  // Vérifier disponibilité en temps réel quand les dates changent
  useEffect(() => {
    const checkAvailability = async () => {
      if (!startDate || !endDate || !vehicleId) {
        setAvailabilityStatus(null);
        return;
      }

      setIsCheckingAvailability(true);
      try {
        const { data: isAvailable, error } = await supabase.rpc('check_vehicle_availability' as any, {
          p_vehicle_id: vehicleId,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        } as any);

        if (error) throw error;

        setAvailabilityStatus(isAvailable ? 'available' : 'unavailable');

        if (!isAvailable) {
          toast({
            title: "⚠️ Véhicule indisponible",
            description: "Ce véhicule est déjà réservé pour ces dates",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        setAvailabilityStatus(null);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [startDate, endDate, vehicleId, toast]);

  // Auto-select driver choice based on vehicle properties
  useEffect(() => {
    if (vehicle) {
      if (vehicle.driver_required) {
        setDriverChoice('with_driver');
      } else if (!vehicle.driver_available) {
        setDriverChoice('without_driver');
      }
    }
  }, [vehicle]);

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Véhicule non trouvé</h3>
          <Button onClick={() => navigate(-1)}>Retour</Button>
        </div>
      </div>
    );
  }

  const formatCDF = (amount: number): string => {
    return `${amount.toLocaleString('fr-CD')} CDF`;
  };

  const calculateTotal = () => {
    if (!startDate || !endDate || !driverChoice) return 0;
    
    const hours = differenceInHours(endDate, startDate);
    const days = Math.max(1, differenceInDays(endDate, startDate));
    
    // Get rates based on driver choice
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
    
    // Calculate base price
    let basePrice = 0;
    if (days >= 7) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      basePrice = (weeks * calculateCityPrice(rates.weekly, vehicle.category_id)) + 
                  (remainingDays * calculateCityPrice(rates.daily, vehicle.category_id));
    } else if (days >= 1) {
      basePrice = days * calculateCityPrice(rates.daily, vehicle.category_id);
    } else {
      basePrice = hours * calculateCityPrice(rates.hourly, vehicle.category_id);
    }

    // Calculate equipment fees
    const equipmentFees = selectedEquipment.reduce((total, eqId) => {
      const price = getEquipmentPrice(eqId, vehicle.city);
      return total + (price * days);
    }, 0);
    
    return basePrice + equipmentFees;
  };

  const getSteps = (): BookingStep[] => {
    const steps: BookingStep[] = ['dates'];
    
    // Add driver choice step only if user has a choice
    if (vehicle.driver_available && !vehicle.driver_required) {
      steps.push('driver-choice');
    }
    
    // Add pickup location step (REQUIS)
    steps.push('pickup-location');
    
    steps.push('vehicle-equipment');
    
    // Add driver info step only if without driver
    if (driverChoice === 'without_driver') {
      steps.push('driver-info');
    }
    
    steps.push('summary');
    return steps;
  };

  const handleNext = () => {
    // Validation étape dates
    if (currentStep === 'dates') {
      if (!startDate || !endDate) {
        toast({
          title: "Dates requises",
          description: "Veuillez sélectionner les dates de début et de fin",
          variant: "destructive"
        });
        return;
      }
      if (availabilityStatus !== 'available') {
        toast({
          title: "Véhicule indisponible",
          description: "Ce véhicule n'est pas disponible pour ces dates",
          variant: "destructive"
        });
        return;
      }
    }

    // Validation pickup location
    if (currentStep === 'pickup-location') {
      if (!pickupLocation.trim()) {
        toast({
          title: "Lieu de prise en charge requis",
          description: "Veuillez indiquer où récupérer le véhicule",
          variant: "destructive"
        });
        return;
      }
    }

    // Validation driver info (si sans chauffeur)
    if (currentStep === 'driver-info') {
      if (!driverInfo.name || !driverInfo.phone || !driverInfo.email || !driverInfo.license) {
        toast({
          title: "Informations conducteur requises",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive"
        });
        return;
      }
    }

    const steps = getSteps();
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps = getSteps();
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    } else {
      navigate('/rental');
    }
  };

  const handleConfirmBooking = async () => {
    console.log('🚗 [BOOKING] Starting booking process', {
      vehicleId,
      vehicleName: vehicle.name,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      driverChoice,
      pickupLocation,
      selectedEquipment,
      totalPrice: calculateTotal(),
      availabilityStatus
    });

    // Validation finale
    if (!startDate || !endDate) {
      toast({
        title: "Dates manquantes",
        description: "Veuillez sélectionner les dates de location",
        variant: "destructive"
      });
      return;
    }

    if (!driverChoice) {
      toast({
        title: "Choix du chauffeur manquant",
        description: "Veuillez indiquer si vous souhaitez un chauffeur",
        variant: "destructive"
      });
      return;
    }

    if (!pickupLocation.trim()) {
      toast({
        title: "Lieu de prise en charge manquant",
        description: "Veuillez indiquer où récupérer le véhicule",
        variant: "destructive"
      });
      return;
    }

    if (availabilityStatus !== 'available') {
      toast({
        title: "Véhicule indisponible",
        description: "Ce véhicule n'est pas disponible pour les dates sélectionnées",
        variant: "destructive"
      });
      return;
    }

    try {
      const equipmentTotal = selectedEquipment.reduce((total, eqId) => {
        const price = getEquipmentPrice(eqId, vehicle.city);
        const days = Math.max(1, differenceInDays(endDate!, startDate!));
        return total + (price * days);
      }, 0);

      // Calculer rental_duration_type automatiquement
      const hours = differenceInHours(endDate!, startDate!);
      const days = Math.max(1, differenceInDays(endDate!, startDate!));
      let rentalDurationType: 'hourly' | 'daily' | 'weekly';
      if (hours < 24) {
        rentalDurationType = 'hourly';
      } else if (days < 7) {
        rentalDurationType = 'daily';
      } else {
        rentalDurationType = 'weekly';
      }

      await createBooking.mutateAsync({
        vehicle_id: vehicleId,
        start_date: startDate,
        end_date: endDate,
        pickup_location: pickupLocation,
        return_location: returnLocation || pickupLocation,
        rental_duration_type: rentalDurationType,
        driver_choice: driverChoice,
        equipment_ids: selectedEquipment,
        equipment_total: equipmentTotal,
        driver_name: driverChoice === 'without_driver' ? driverInfo.name : null,
        driver_phone: driverChoice === 'without_driver' ? driverInfo.phone : null,
        driver_email: driverChoice === 'without_driver' ? driverInfo.email : null,
        driver_license: driverChoice === 'without_driver' ? driverInfo.license : null,
        total_price: calculateTotal(),
        security_deposit: calculateCityPrice(vehicle.security_deposit, vehicle.category_id)
      });

      console.log('✅ [BOOKING] Mutation completed successfully');
      
      toast({
        title: "✅ Réservation confirmée !",
        description: "Votre demande de location a été enregistrée avec succès"
      });

      navigate('/rental/bookings');
    } catch (error: any) {
      console.error('❌ [BOOKING] Error:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      });
      
      toast({
        title: "Erreur de réservation",
        description: error?.message || "Impossible de confirmer la réservation. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const steps = getSteps();
  const currentStepIndex = steps.indexOf(currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Bouton retour fixe visible */}
      <div className="fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleBack}
          className="bg-background/90 backdrop-blur shadow-lg hover:bg-background"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 glassmorphism border-b border-border/20 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="font-bold text-lg">Réservation</h1>
              <p className="text-sm text-muted-foreground">{vehicle.name}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary via-primary to-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Dates - Simplifié */}
          {currentStep === 'dates' && (
            <motion.div key="dates" {...fadeInUp}>
              <Card className="glassmorphism border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Quand souhaitez-vous louer ?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date de début - Card avec bordure verte */}
                  <div className="border-2 border-green-500/50 rounded-xl p-4 bg-green-50/50 dark:bg-green-950/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-green-500">
                        <CalendarCheck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-green-700 dark:text-green-400">
                          📅 Date de début
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Début de votre location
                        </p>
                      </div>
                    </div>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => {
                        // Désactiver dates passées
                        if (date < new Date()) return true;
                        
                        // Désactiver dates déjà réservées
                        return bookedDates.some(bookedDate => 
                          bookedDate.toDateString() === date.toDateString()
                        );
                      }}
                      className="w-full pointer-events-auto"
                    />
                  </div>

                  {/* Séparateur visuel avec flèche */}
                  <div className="flex items-center justify-center relative">
                    <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                    <div className="relative z-10 p-3 rounded-full bg-background border-2 border-primary">
                      <ArrowDown className="h-6 w-6 text-primary animate-bounce" />
                    </div>
                  </div>

                  {/* Date de fin - Card avec bordure orange */}
                  <div className="border-2 border-orange-500/50 rounded-xl p-4 bg-orange-50/50 dark:bg-orange-950/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-orange-500">
                        <CalendarX className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-orange-700 dark:text-orange-400">
                          🛑 Date de fin
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Fin de votre location
                        </p>
                      </div>
                    </div>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => {
                        // Désactiver si pas de date début ou si avant date début
                        if (!startDate || date <= startDate) return true;
                        
                        // Désactiver dates déjà réservées
                        return bookedDates.some(bookedDate => 
                          bookedDate.toDateString() === date.toDateString()
                        );
                      }}
                      className="w-full pointer-events-auto"
                    />
                  </div>

                  {/* Indicateur de disponibilité */}
                  {startDate && endDate && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-3 rounded-xl border ${
                        isCheckingAvailability
                          ? 'bg-muted/50 border-muted'
                          : availabilityStatus === 'available'
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-500/50'
                          : availabilityStatus === 'unavailable'
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-500/50'
                          : 'bg-muted/50 border-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCheckingAvailability ? (
                          <>
                            <Clock className="h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Vérification de la disponibilité...
                            </span>
                          </>
                        ) : availabilityStatus === 'available' ? (
                          <>
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                              ✅ Véhicule disponible pour ces dates
                            </span>
                          </>
                        ) : availabilityStatus === 'unavailable' ? (
                          <>
                            <CalendarX className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-red-700 dark:text-red-400">
                              ❌ Véhicule indisponible - Choisissez d'autres dates
                            </span>
                          </>
                        ) : null}
                      </div>
                    </motion.div>
                  )}

                  {/* Récapitulatif visuel des dates sélectionnées */}
                  {startDate && endDate && availabilityStatus === 'available' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border border-primary/20"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3 w-full md:flex-1">
                          <div className="p-1.5 md:p-2 rounded-lg bg-green-100 dark:bg-green-900/20 flex-shrink-0">
                            <CalendarCheck className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">Début</p>
                            <p className="text-xs text-muted-foreground">
                              {format(startDate, 'dd MMM yyyy', { locale: fr })}
                            </p>
                          </div>
                        </div>

                        <div className="md:hidden w-full h-px bg-border"></div>

                        <div className="flex items-center justify-center gap-2 px-2 py-1.5 md:px-3 md:py-2 rounded-lg bg-primary/10 w-full md:w-auto">
                          <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:inline" />
                          <p className="text-sm font-bold text-primary">{differenceInDays(endDate, startDate)} jour(s)</p>
                          <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:inline" />
                        </div>

                        <div className="md:hidden w-full h-px bg-border"></div>

                        <div className="flex items-center gap-3 w-full md:flex-1">
                          <div className="p-1.5 md:p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex-shrink-0">
                            <CalendarX className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">Fin</p>
                            <p className="text-xs text-muted-foreground">
                              {format(endDate, 'dd MMM yyyy', { locale: fr })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    onClick={handleNext}
                    disabled={!startDate || !endDate || availabilityStatus !== 'available' || isCheckingAvailability}
                  >
                    {isCheckingAvailability ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Vérification...
                      </>
                    ) : (
                      <>
                        Continuer
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Driver Choice */}
          {currentStep === 'driver-choice' && (
            <motion.div key="driver-choice" {...fadeInUp}>
              <Card className="glassmorphism border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Type de location
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choisissez votre mode de location
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Option SANS chauffeur */}
                  {!vehicle.driver_required && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDriverChoice('without_driver')}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                        driverChoice === 'without_driver'
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              driverChoice === 'without_driver' 
                                ? 'bg-primary border-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {driverChoice === 'without_driver' && (
                                <Check className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <h3 className="font-bold text-lg">Sans chauffeur</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 ml-9">
                            Conduisez vous-même le véhicule. Permis de conduire requis.
                          </p>
                          <div className="space-y-2 ml-9">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Tarif journalier</span>
                              <span className="font-bold text-primary">
                                {formatCDF(calculateCityPrice(vehicle.without_driver_daily_rate, vehicle.category_id))}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Tarif hebdomadaire</span>
                              <span className="font-semibold">
                                {formatCDF(calculateCityPrice(vehicle.without_driver_weekly_rate, vehicle.category_id))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Option AVEC chauffeur */}
                  {vehicle.driver_available && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDriverChoice('with_driver')}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                        driverChoice === 'with_driver'
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              driverChoice === 'with_driver' 
                                ? 'bg-primary border-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {driverChoice === 'with_driver' && (
                                <Check className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <h3 className="font-bold text-lg">Avec chauffeur</h3>
                            {vehicle.driver_required && (
                              <Badge variant="secondary" className="ml-2">Obligatoire</Badge>
                            )}
                            {!vehicle.driver_required && (
                              <Badge variant="secondary" className="ml-2">Recommandé</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 ml-9">
                            Chauffeur professionnel avec licence valide. Confort maximal.
                          </p>
                          <div className="space-y-2 ml-9">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Tarif journalier</span>
                              <span className="font-bold text-primary">
                                {formatCDF(calculateCityPrice(vehicle.with_driver_daily_rate, vehicle.category_id))}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Tarif hebdomadaire</span>
                              <span className="font-semibold">
                                {formatCDF(calculateCityPrice(vehicle.with_driver_weekly_rate, vehicle.category_id))}
                              </span>
                            </div>
                          </div>

                          {driverEquipment.length > 0 && (
                            <div className="mt-4 pt-4 border-t ml-9">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Équipements chauffeur inclus :
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {driverEquipment.slice(0, 3).map(eq => (
                                  <Badge key={eq.id} variant="outline" className="text-xs">
                                    {eq.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    onClick={handleNext}
                    disabled={!driverChoice}
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Pickup Location - NOUVEAU */}
          {currentStep === 'pickup-location' && (
            <motion.div key="pickup-location" {...fadeInUp}>
              <Card className="glassmorphism border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Lieux de prise en charge
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Où souhaitez-vous récupérer le véhicule ?
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Adresse de récupération *
                    </label>
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Ex: Avenue Kasa-Vubu, Kinshasa"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Indiquez l'adresse exacte où vous souhaitez prendre le véhicule
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Adresse de retour (optionnel)
                    </label>
                    <input
                      type="text"
                      value={returnLocation}
                      onChange={(e) => setReturnLocation(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Même adresse si vide"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Laissez vide pour retourner au même endroit
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      💡 <strong>Astuce :</strong> Vous pouvez modifier ces adresses ultérieurement avant la confirmation finale.
                    </p>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    onClick={handleNext}
                    disabled={!pickupLocation.trim()}
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Vehicle Equipment */}
          {currentStep === 'vehicle-equipment' && (
            <motion.div key="vehicle-equipment" {...fadeInUp}>
              <Card className="glassmorphism border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Équipements additionnels
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Sélectionnez les équipements souhaités (optionnel)
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {vehicleEquipment.map((eq) => {
                      const price = getEquipmentPrice(eq.id, vehicle.city);
                      return (
                        <motion.div
                          key={eq.id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => {
                            setSelectedEquipment(prev =>
                              prev.includes(eq.id) 
                                ? prev.filter(e => e !== eq.id) 
                                : [...prev, eq.id]
                            );
                          }}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedEquipment.includes(eq.id)
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                selectedEquipment.includes(eq.id) 
                                  ? 'bg-primary border-primary' 
                                  : 'border-muted-foreground'
                              }`}>
                                {selectedEquipment.includes(eq.id) && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{eq.name}</p>
                                  {eq.is_premium && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Star className="h-3 w-3 mr-1" />
                                      Premium
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{eq.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">{formatCDF(price)}</p>
                              <p className="text-xs text-muted-foreground">par jour</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {selectedEquipment.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Aucun équipement sélectionné</p>
                      <p className="text-xs mt-1">Vous pouvez continuer sans équipement</p>
                    </div>
                  )}

                  {selectedEquipment.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total équipements</span>
                        <span className="font-bold text-primary">
                          {formatCDF(selectedEquipment.reduce((total, eqId) => {
                            const price = getEquipmentPrice(eqId, vehicle.city);
                            const days = Math.max(1, differenceInDays(endDate!, startDate!));
                            return total + (price * days);
                          }, 0))}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    onClick={handleNext}
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Driver Info (only if without driver) */}
          {currentStep === 'driver-info' && (
            <motion.div key="driver-info" {...fadeInUp}>
              <Card className="glassmorphism border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Informations conducteur
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Renseignez vos informations pour conduire le véhicule
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        value={driverInfo.name}
                        onChange={(e) => setDriverInfo({ ...driverInfo, name: e.target.value })}
                        className="w-full p-3 border border-border rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Jean Kabongo"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={driverInfo.phone}
                        onChange={(e) => setDriverInfo({ ...driverInfo, phone: e.target.value })}
                        className="w-full p-3 border border-border rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="+243 800 000 000"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={driverInfo.email}
                        onChange={(e) => setDriverInfo({ ...driverInfo, email: e.target.value })}
                        className="w-full p-3 border border-border rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="jean@example.com"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Permis de conduire
                      </label>
                      <input
                        type="text"
                        value={driverInfo.license}
                        onChange={(e) => setDriverInfo({ ...driverInfo, license: e.target.value })}
                        className="w-full p-3 border border-border rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Numéro de permis"
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    onClick={handleNext}
                    disabled={!driverInfo.name || !driverInfo.phone}
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 6: Summary */}
          {currentStep === 'summary' && (
            <motion.div key="summary" {...fadeInUp} className="space-y-4">
              <Card className="glassmorphism border-primary/20">
                <CardHeader>
                  <CardTitle>Récapitulatif de la réservation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vehicle */}
                  <div className="flex gap-4">
                    {vehicle.images[0] && (
                      <img 
                        src={vehicle.images[0]} 
                        alt={vehicle.name} 
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.brand} {vehicle.model} • {vehicle.year}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        {driverChoice === 'with_driver' ? 'Avec chauffeur' : 'Sans chauffeur'}
                      </Badge>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Période de location</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <span>
                        {format(startDate!, 'dd MMMM yyyy', { locale: fr })} → {format(endDate!, 'dd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Math.max(1, differenceInDays(endDate!, startDate!))} jour(s)
                    </p>
                  </div>

                  {/* Pickup Location */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Lieux</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Récupération :</span> {pickupLocation}</p>
                      {returnLocation && (
                        <p><span className="text-muted-foreground">Retour :</span> {returnLocation}</p>
                      )}
                    </div>
                  </div>

                  {/* Equipment */}
                  {selectedEquipment.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Équipements sélectionnés</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEquipment.map(eqId => {
                          const eq = vehicleEquipment.find(e => e.id === eqId);
                          return eq ? (
                            <Badge key={eqId} variant="secondary">{eq.name}</Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Driver Info */}
                  {driverChoice === 'without_driver' && driverInfo.name && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Conducteur</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Nom :</span> {driverInfo.name}</p>
                        <p><span className="text-muted-foreground">Téléphone :</span> {driverInfo.phone}</p>
                        {driverInfo.email && (
                          <p><span className="text-muted-foreground">Email :</span> {driverInfo.email}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Location ({driverChoice === 'with_driver' ? 'avec chauffeur' : 'sans chauffeur'})</span>
                      <span className="font-medium">
                        {formatCDF(calculateTotal() - selectedEquipment.reduce((total, eqId) => {
                          const price = getEquipmentPrice(eqId, vehicle.city);
                          const days = Math.max(1, differenceInDays(endDate!, startDate!));
                          return total + (price * days);
                        }, 0))}
                      </span>
                    </div>
                    
                    {selectedEquipment.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Équipements ({selectedEquipment.length})</span>
                        <span className="font-medium">
                          {formatCDF(selectedEquipment.reduce((total, eqId) => {
                            const price = getEquipmentPrice(eqId, vehicle.city);
                            const days = Math.max(1, differenceInDays(endDate!, startDate!));
                            return total + (price * days);
                          }, 0))}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span>Dépôt de garantie</span>
                      <span className="font-medium">
                        {formatCDF(calculateCityPrice(vehicle.security_deposit, vehicle.category_id))}
                      </span>
                    </div>
                    
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total à payer</span>
                      <span className="text-primary">
                        {formatCDF(calculateTotal() + calculateCityPrice(vehicle.security_deposit, vehicle.category_id))}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-primary mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Protection et garanties</p>
                        <ul className="text-muted-foreground space-y-0.5 text-xs">
                          <li>• Assurance tous risques incluse</li>
                          <li>• Dépôt de garantie remboursable</li>
                          <li>• Assistance 24/7</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-primary via-primary to-secondary hover:opacity-90 text-lg py-6"
                    onClick={handleConfirmBooking}
                    disabled={
                      createBooking.isPending || 
                      !startDate || 
                      !endDate || 
                      !driverChoice || 
                      !pickupLocation.trim() ||
                      availabilityStatus !== 'available'
                    }
                  >
                    {createBooking.isPending ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Confirmation en cours...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Confirmer la réservation • {formatCDF(calculateTotal() + calculateCityPrice(vehicle.security_deposit, vehicle.category_id))}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ModernRentalBooking;
