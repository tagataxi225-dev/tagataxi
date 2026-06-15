import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useModernRentals } from '@/hooks/useModernRentals';
import { usePartnerRentalGroups } from '@/hooks/usePartnerRentalGroups';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { VehicleImageGallery } from '@/components/rental/VehicleImageGallery';
import { VehicleSpecifications } from '@/components/rental/VehicleSpecifications';
import { VehicleHeader } from '@/components/rental/VehicleHeader';
import { PricingCard } from '@/components/rental/PricingCard';
import { VehicleReviews } from '@/components/rental/VehicleReviews';
import { SimilarVehicles } from '@/components/rental/SimilarVehicles';
import { 
  Calendar, 
  Shield, 
  User, 
  Car,
  Clock,
  CalendarDays,
  DollarSign,
  FileText,
  XCircle,
  CheckCircle2,
  ChevronRight,
  Star,
  MapPin
} from 'lucide-react';
import { getVehicleImage } from '@/utils/vehicleFallbackImages';
import { formatCurrency, formatCDF } from '@/utils/formatCurrency';

export const RentalVehicleDetails = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { vehicles, calculateCityPrice, isLoading } = useModernRentals();
  const { partnerGroups } = usePartnerRentalGroups();
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowFooter(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const vehicle = vehicles.find(v => v.id === vehicleId);
  const partnerGroup = partnerGroups.find(p => p.partnerId === vehicle?.partner_id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Véhicule non trouvé</h3>
          <Button onClick={() => navigate('/rental')}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  // formatCDF déjà importé de utils/formatCurrency

  const vehicleImages = vehicle.images?.length > 0 
    ? vehicle.images 
    : [
        getVehicleImage(vehicle),
        `https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&h=600&fit=crop`,
        `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop`,
        `https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop`,
      ];

  const conditions = [
    "Permis de conduire valide requis (si location sans chauffeur)",
    "Carte d'identité ou passeport obligatoire",
    "Âge minimum : 23 ans pour la location",
    "Inspection complète du véhicule avant et après location",
    "Restitution avec le même niveau de carburant",
    "Respect du kilométrage convenu dans le contrat"
  ];

  const minPrice = vehicle.driver_available && vehicle.without_driver_daily_rate > 0
    ? vehicle.without_driver_daily_rate
    : vehicle.with_driver_daily_rate > 0
    ? vehicle.with_driver_daily_rate
    : vehicle.daily_rate;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header compact moderne */}
      <VehicleHeader 
        vehicleName={vehicle.name} 
        minPrice={formatCDF(calculateCityPrice(minPrice, vehicle.category_id))}
        showPriceOnScroll
      />

      <div className="max-w-5xl mx-auto pb-24 sm:pb-6">
        {/* Galerie photos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="px-4 sm:px-6 py-4 sm:py-6"
        >
          <VehicleImageGallery images={vehicleImages} vehicleName={vehicle.name} />
        </motion.div>

        <div className="px-4 sm:px-6 space-y-5 sm:space-y-6">
          {/* Informations principales - Card Hero Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/30 overflow-hidden">
              <CardContent className="p-5 sm:p-6 relative">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.03),transparent_50%)]" />
                
                <div className="relative space-y-4">
                  {/* Row 1: Title + Badges */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold mb-2 line-clamp-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                        {vehicle.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.brand} {vehicle.model} · {vehicle.year}
                      </p>
                    </div>
                    
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shrink-0 shadow-lg border-0">
                      Disponible
                    </Badge>
                  </div>

                  {/* Badges inline - Design moderne */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-muted to-muted/60">
                      {vehicle.comfort_level}
                    </Badge>
                    {vehicle.driver_available && (
                      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs px-3 py-1 rounded-full border-0">
                        <User className="h-3 w-3 mr-1" />
                        Chauffeur dispo
                      </Badge>
                    )}
                    {vehicle.driver_required && (
                      <Badge variant="outline" className="border-amber-400/50 bg-amber-500/10 text-amber-600 text-xs px-3 py-1 rounded-full">
                        Chauffeur obligatoire
                      </Badge>
                    )}
                  </div>

                  <Separator className="bg-border/50" />

                  {/* Row 2: Partner Info - Design Premium */}
                  {partnerGroup && (
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex items-center gap-4 p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl hover:from-primary/5 hover:to-primary/10 transition-all duration-300 cursor-pointer border border-border/30 hover:border-primary/20 hover:shadow-lg"
                      onClick={() => navigate(`/rental/partner/${vehicle.partner_id}/shop`)}
                    >
                      <div className="relative">
                        <img 
                          src={partnerGroup.partnerLogo || '/placeholder.svg'}
                          alt={partnerGroup.partnerName}
                          className="w-14 h-14 rounded-xl object-cover ring-2 ring-primary/20 shadow-lg"
                        />
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center ring-2 ring-background">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm line-clamp-1">{partnerGroup.partnerName}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-foreground">{partnerGroup.avgRating.toFixed(1)}</span>
                          </span>
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                          <span>{partnerGroup.vehicleCount} véhicules</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-primary/60 shrink-0" />
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Spécifications - Design Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20 overflow-hidden">
              <CardContent className="p-5 sm:p-6">
                <VehicleSpecifications vehicle={vehicle} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Tarifs avec Tabs - Design Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20 overflow-hidden">
              <CardContent className="p-5 sm:p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">Tarifs de location</h3>
                </div>

                {/* Nouvelle logique : Avec chauffeur par défaut, Sans chauffeur = option */}
                {(vehicle as any).self_drive_allowed ? (
                  <Tabs 
                    defaultValue="with"
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/60 rounded-xl">
                      <TabsTrigger 
                        value="with" 
                        className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Avec chauffeur
                      </TabsTrigger>
                      <TabsTrigger 
                        value="without" 
                        className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md"
                      >
                        <Car className="h-4 w-4 mr-2" />
                        Sans chauffeur
                      </TabsTrigger>
                    </TabsList>

                    {/* Avec chauffeur - Par défaut */}
                    <TabsContent value="with" className="space-y-4 mt-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <PricingCard
                          label="Horaire"
                          price={formatCDF(calculateCityPrice(vehicle.with_driver_hourly_rate, vehicle.category_id))}
                          period="/heure"
                          icon={Clock}
                          index={0}
                        />
                        <PricingCard
                          label="Journalier"
                          price={formatCDF(calculateCityPrice(vehicle.with_driver_daily_rate, vehicle.category_id))}
                          period="/jour"
                          icon={Calendar}
                          featured
                          index={1}
                        />
                        <PricingCard
                          label="Hebdomadaire"
                          price={formatCDF(calculateCityPrice(vehicle.with_driver_weekly_rate, vehicle.category_id))}
                          period="/semaine"
                          icon={CalendarDays}
                          discount="-15%"
                          index={2}
                        />
                      </div>
                    </TabsContent>

                    {/* Sans chauffeur - Option */}
                    <TabsContent value="without" className="space-y-4 mt-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <PricingCard
                          label="Horaire"
                          price={formatCDF(calculateCityPrice(vehicle.without_driver_hourly_rate, vehicle.category_id))}
                          period="/heure"
                          icon={Clock}
                          index={0}
                        />
                        <PricingCard
                          label="Journalier"
                          price={formatCDF(calculateCityPrice(vehicle.without_driver_daily_rate, vehicle.category_id))}
                          period="/jour"
                          icon={Calendar}
                          featured
                          index={1}
                        />
                        <PricingCard
                          label="Hebdomadaire"
                          price={formatCDF(calculateCityPrice(vehicle.without_driver_weekly_rate, vehicle.category_id))}
                          period="/semaine"
                          icon={CalendarDays}
                          discount="-15%"
                          index={2}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  /* Uniquement avec chauffeur */
                  <div className="space-y-4">
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-center">
                      <p className="text-sm text-muted-foreground">
                        <User className="h-4 w-4 inline mr-1" />
                        Ce véhicule est disponible <strong>avec chauffeur uniquement</strong>
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <PricingCard
                        label="Horaire"
                        price={formatCDF(calculateCityPrice(vehicle.with_driver_hourly_rate || vehicle.hourly_rate, vehicle.category_id))}
                        period="/heure"
                        icon={Clock}
                        index={0}
                      />
                      <PricingCard
                        label="Journalier"
                        price={formatCDF(calculateCityPrice(vehicle.with_driver_daily_rate || vehicle.daily_rate, vehicle.category_id))}
                        period="/jour"
                        icon={Calendar}
                        featured
                        index={1}
                      />
                      <PricingCard
                        label="Hebdomadaire"
                        price={formatCDF(calculateCityPrice(vehicle.with_driver_weekly_rate || vehicle.weekly_rate, vehicle.category_id))}
                        period="/semaine"
                        icon={CalendarDays}
                        discount="-15%"
                        index={2}
                      />
                    </div>
                  </div>
                )}

                {/* Dépôt de garantie - Design Soft Modern */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 bg-muted/30 border border-border/50 rounded-2xl"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Dépôt de garantie</p>
                        <p className="text-xs text-muted-foreground">Remboursable en fin de location</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-foreground shrink-0">
                      {formatCDF(calculateCityPrice(vehicle.security_deposit, vehicle.category_id))}
                    </p>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Conditions et informations - Accordion Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20 overflow-hidden">
              <CardContent className="p-5 sm:p-6">
                <Accordion type="single" collapsible defaultValue="conditions" className="space-y-3">
                  {/* Conditions */}
                  <AccordionItem value="conditions" className="border rounded-2xl px-4 bg-gradient-to-br from-background/80 to-muted/20 border-border/50">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-semibold text-sm sm:text-base">Conditions de location</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-3 pt-2">
                        {conditions.map((condition, i) => (
                          <motion.div 
                            key={i} 
                            className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <div className="h-6 w-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            </div>
                            <p className="text-sm text-muted-foreground">{condition}</p>
                          </motion.div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Assurance incluse */}
                  <AccordionItem value="insurance" className="border rounded-2xl px-4 bg-gradient-to-br from-background/80 to-muted/20 border-border/50">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center shadow-md">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-semibold text-sm sm:text-base">Assurance et protection</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-3 pt-2">
                        {[
                          'Assurance tous risques incluse',
                          'Protection contre le vol et les dommages',
                          'Assistance 24h/24 en cas de panne'
                        ].map((item, i) => (
                          <motion.div 
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-muted/40"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <div className="h-6 w-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            </div>
                            <p className="text-sm text-muted-foreground">{item}</p>
                          </motion.div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Politique d'annulation */}
                  <AccordionItem value="cancellation">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-sm sm:text-base">Politique d'annulation</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-muted-foreground pt-2">
                        <p>• Annulation gratuite jusqu'à 48h avant la réservation</p>
                        <p>• 50% remboursé entre 24h-48h avant la date de début</p>
                        <p>• Non remboursable moins de 24h avant la date de début</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <VehicleReviews vehicleId={vehicle.id} />
          </motion.div>

          {/* Véhicules similaires */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <SimilarVehicles 
              currentVehicleId={vehicle.id}
              categoryId={vehicle.category_id}
              city={vehicle.city}
            />
          </motion.div>
        </div>
      </div>

      {/* CTA Réservation - Footer fixe avec animation progressive */}
      <AnimatePresence>
        {showFooter && (
          <>
            {/* Footer Desktop - Design Soft */}
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="hidden lg:block fixed bottom-0 left-0 right-0 z-40"
            >
              <div className="bg-gradient-to-t from-background via-background to-transparent pt-8">
                <div className="max-w-5xl mx-auto px-6 pb-6">
                  <Card className="border border-border/50 shadow-xl bg-card">
                    {/* Header simplifié */}
                    <div className="px-6 py-2.5 border-b border-border/50 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-muted-foreground">Disponible</span>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                        Réservation instantanée
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 ml-auto">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        Annulation gratuite 48h avant
                      </span>
                    </div>
                    
                    <CardContent className="p-5 flex items-center justify-between gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tarif journalier</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-3xl font-bold text-foreground">
                            {formatCDF(calculateCityPrice(minPrice, vehicle.category_id)).replace(' CDF', '')}
                          </p>
                          <span className="text-lg font-semibold text-primary">CDF</span>
                          <span className="text-sm text-muted-foreground">/jour</span>
                        </div>
                      </div>
                      
                      <Button 
                        size="lg" 
                        onClick={() => navigate(`/rental-booking/${vehicle.id}`)}
                        className="h-12 px-8 bg-primary hover:bg-primary/90 shadow-md"
                      >
                        <Calendar className="h-5 w-5 mr-2" />
                        Réserver maintenant
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>

            {/* Footer Mobile - Design Soft */}
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
            >
              <div className="bg-background/98 backdrop-blur-xl border-t border-border/50 shadow-xl p-4 pb-safe">
                {/* Header simplifié */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-muted-foreground">Disponible</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">
                    Réservation instantanée
                  </Badge>
                </div>
                
                {/* Prix et CTA */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">À partir de</p>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-2xl font-bold text-foreground">
                        {formatCDF(calculateCityPrice(minPrice, vehicle.category_id)).replace(' CDF', '')}
                      </p>
                      <span className="text-sm font-semibold text-primary">CDF</span>
                      <span className="text-xs text-muted-foreground">/jour</span>
                    </div>
                  </div>
                  
                  <Button 
                    size="lg" 
                    onClick={() => navigate(`/rental-booking/${vehicle.id}`)}
                    className="h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Réserver
                  </Button>
                </div>
                
                {/* Trust badge discret */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Annulation gratuite 48h avant</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer adaptatif pour éviter que le contenu soit caché */}
      <div className="h-32 lg:h-0" />
    </div>
  );
};

export default RentalVehicleDetails;
