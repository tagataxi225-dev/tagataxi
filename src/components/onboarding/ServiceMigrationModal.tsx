/**
 * 🔀 PHASE 2: Modal de migration - Choix taxi/delivery + spécialisation
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Car, Package, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { ServiceSpecializationSelector } from '@/components/driver/registration/ServiceSpecializationSelector';

interface ServiceMigrationModalProps {
  open: boolean;
  onComplete: (serviceType: 'taxi' | 'delivery') => void;
}

export const ServiceMigrationModal = ({ open, onComplete }: ServiceMigrationModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'category' | 'specialization'>('category');
  const [selected, setSelected] = useState<'taxi' | 'delivery' | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<string>('voiture'); // Défaut voiture pour les options
  const [loading, setLoading] = useState(false);

  const services = [
    {
      type: 'taxi' as const,
      icon: Car,
      emoji: '🚗',
      title: 'Chauffeur Taxi',
      description: 'Transport de passagers',
      gradient: 'from-blue-500 to-blue-600',
      features: [
        'Courses de passagers',
        'Tarification au kilomètre',
        'Zones urbaines principales',
        'Paiements instantanés'
      ],
      ideal: 'Idéal pour le transport de personnes'
    },
    {
      type: 'delivery' as const,
      icon: Package,
      emoji: '📦',
      title: 'Livreur Express',
      description: 'Livraison de colis',
      gradient: 'from-green-500 to-orange-500',
      features: [
        'Livraisons Flash/Flex/Maxicharge',
        'Colis et marchandises',
        'Livraisons marketplace',
        'Bonus par colis'
      ],
      ideal: 'Idéal pour la livraison rapide'
    }
  ];

  const handleConfirm = async () => {
    if (!selected || !selectedSpecialization || !user) return;

    setLoading(true);
    try {
      // ✅ PHASE 2: Mettre à jour service_type ET service_specialization
      const { error: updateError } = await supabase
        .from('chauffeurs')
        .update({ 
          service_type: selected,
          service_specialization: selectedSpecialization 
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Également mettre à jour driver_service_preferences pour cohérence
      await supabase
        .from('driver_service_preferences')
        .upsert({
          driver_id: user.id,
          service_type: selected,
          is_active: true
        });
      
      // Log l'activité
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: 'service_migration',
        description: `Service migrated to ${selected} - ${selectedSpecialization}`,
        metadata: {
          service_type: selected,
          service_specialization: selectedSpecialization,
          migration_date: new Date().toISOString()
        }
      });

      toast.success(
        selected === 'taxi' 
          ? `🚗 Vous êtes maintenant chauffeur ${selectedSpecialization.replace('taxi_', '')} !` 
          : `📦 Vous êtes maintenant livreur ${selectedSpecialization} !`
      );

      onComplete(selected);
    } catch (error: any) {
      console.error('Migration error:', error);
      toast.error('Erreur lors de la migration');
    } finally {
      setLoading(false);
    }
  };

  const handleNextToSpecialization = () => {
    if (!selected) return;
    setStep('specialization');
  };

  const handleBackToCategory = () => {
    setStep('category');
    setSelectedSpecialization(null);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            {step === 'category' ? 'Choisissez votre spécialité' : 'Choisissez votre spécialisation'}
          </DialogTitle>
        </DialogHeader>

        {step === 'category' ? (
          <>
            {/* Alerte */}
            <Card className="p-4 bg-orange-500/10 border-orange-500/20">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-foreground mb-1">Choix unique et définitif</p>
                  <p className="text-muted-foreground">
                    Vous devez choisir entre chauffeur taxi OU livreur. 
                    Ce choix déterminera les types de commandes que vous recevrez.
                  </p>
                </div>
              </div>
            </Card>

            {/* Options */}
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service) => (
                <motion.div
                  key={service.type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`p-6 cursor-pointer transition-all ${
                      selected === service.type
                        ? 'border-2 border-primary shadow-lg'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelected(service.type)}
                  >
                    {/* Header */}
                    <div className="text-center mb-4">
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mx-auto mb-3`}>
                        <span className="text-4xl">{service.emoji}</span>
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-1">
                        {service.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {service.description}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-4">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Ideal for */}
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${service.gradient} bg-opacity-10`}>
                      <p className="text-xs text-center text-foreground font-medium">
                        {service.ideal}
                      </p>
                    </div>

                    {/* Selection indicator */}
                    {selected === service.type && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                      >
                        <span className="text-white font-bold">✓</span>
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Bouton Suivant */}
            <Button
              onClick={handleNextToSpecialization}
              disabled={!selected}
              className="w-full h-12 text-lg font-semibold"
            >
              Continuer
            </Button>
          </>
        ) : (
          <>
            {/* Step 2: Specialization */}
            <ServiceSpecializationSelector
              serviceCategory={selected!}
              vehicleType={vehicleType}
              selectedSpecialization={selectedSpecialization}
              onSpecializationSelect={setSelectedSpecialization}
            />

            {/* Info véhicule pour adapter les choix */}
            <Card className="p-4 bg-muted">
              <p className="text-sm text-muted-foreground mb-2">
                Type de véhicule :
              </p>
              <div className="flex gap-2">
                {selected === 'taxi' && (
                  <>
                    <Button
                      variant={vehicleType === 'moto' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setVehicleType('moto');
                        setSelectedSpecialization(null);
                      }}
                    >
                      Moto
                    </Button>
                    <Button
                      variant={vehicleType === 'voiture' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setVehicleType('voiture');
                        setSelectedSpecialization(null);
                      }}
                    >
                      Voiture
                    </Button>
                  </>
                )}
                {selected === 'delivery' && (
                  <>
                    <Button
                      variant={vehicleType === 'moto' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setVehicleType('moto');
                        setSelectedSpecialization(null);
                      }}
                    >
                      Moto
                    </Button>
                    <Button
                      variant={vehicleType === 'camionnette' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setVehicleType('camionnette');
                        setSelectedSpecialization(null);
                      }}
                    >
                      Camionnette
                    </Button>
                  </>
                )}
              </div>
            </Card>

            {/* Boutons navigation */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBackToCategory}
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedSpecialization || loading}
                className="flex-1 h-12 text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Confirmation...
                  </>
                ) : (
                  'Confirmer mon choix'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
