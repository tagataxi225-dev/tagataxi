import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Briefcase, UserIcon as UserIcon, CreditCard, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SpecificServiceSelector } from './SpecificServiceSelector';
import { PersonalInfoStep } from './PersonalInfoStep';
import { LicenseStep } from './LicenseStep';
import { SummaryStep } from './SummaryStep';
import { useDriverRegistration } from '@/hooks/useDriverRegistration';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { User, FileCheck } from 'lucide-react';

interface StreamlinedDriverRegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
}

type RegistrationStep = 'service' | 'profil' | 'finalisation';

interface FormData {
  displayName: string;
  email: string;
  phoneNumber: string;
  password: string;
  referralCode?: string;
  serviceCategory: 'taxi' | 'delivery';
  serviceType: string;
  serviceSpecialization?: string;
  deliveryCapacity?: string;
  hasOwnVehicle: boolean;
  profilePhotoUrl?: string;
  licenseNumber: string;
  licenseExpiry: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  selectedPlanId: string | null;
  acceptTerms: boolean;
}

const STEPS = [
  { id: 'service' as RegistrationStep, number: 1, label: 'Service', icon: Briefcase },
  { id: 'profil'  as RegistrationStep, number: 2, label: 'Profil',  icon: User },
  { id: 'finalisation' as RegistrationStep, number: 3, label: 'Finalisation', icon: CreditCard },
];

const ORDER: RegistrationStep[] = ['service', 'profil', 'finalisation'];

export const StreamlinedDriverRegistration: React.FC<StreamlinedDriverRegistrationProps> = ({
  onBack,
  onSuccess
}) => {
  const [step, setStep] = useState<RegistrationStep>('service');
  const [serviceCategory, setServiceCategory] = useState<'taxi' | 'delivery'>('taxi');

  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    email: '',
    phoneNumber: '',
    password: '',
    referralCode: '',
    serviceCategory: 'taxi',
    serviceType: '',
    hasOwnVehicle: false,
    licenseNumber: '',
    licenseExpiry: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    selectedPlanId: null,
    acceptTerms: false
  });

  const { registerDriver, isRegistering } = useDriverRegistration();

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const currentStepNum = STEPS.find(s => s.id === step)?.number ?? 1;
  const progress = ((currentStepNum - 1) / (STEPS.length - 1)) * 100;

  const validateStep = (): boolean => {
    if (step === 'service') {
      if (!formData.serviceType) {
        toast.error('Veuillez sélectionner un type de service');
        return false;
      }
      return true;
    }
    if (step === 'profil') {
      if (!formData.displayName || !formData.email || !formData.phoneNumber || !formData.password) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return false;
      }
      if (!formData.profilePhotoUrl) {
        toast.error('La photo de profil est obligatoire');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    const idx = ORDER.indexOf(step);
    if (idx < ORDER.length - 1) setStep(ORDER[idx + 1]);
  };

  const handlePrev = () => {
    const idx = ORDER.indexOf(step);
    if (idx === 0) onBack();
    else setStep(ORDER[idx - 1]);
  };

  const handleSubmit = async () => {
    if (!formData.acceptTerms) {
      toast.error('Veuillez accepter les conditions générales');
      return;
    }
    try {
      const result = await registerDriver({
        displayName: formData.displayName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        serviceCategory,
        serviceType: formData.serviceType,
        serviceSpecialization: formData.serviceSpecialization,
        deliveryCapacity: formData.deliveryCapacity,
        hasOwnVehicle: false,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        profilePhotoUrl: formData.profilePhotoUrl,
        acceptsTerms: formData.acceptTerms
      });

      if (result.success) {
        if (formData.referralCode?.trim()) {
          const { data: refResult } = await supabase.rpc('apply_referral_code', {
            p_referee_id: result.user?.id,
            p_referral_code: formData.referralCode.trim().toUpperCase()
          });
          if ((refResult as any)?.success) toast.success('🎉 Bonus de parrainage reçu : 500 CDF !');
        }
        localStorage.setItem('kwenda_driver_service_type', serviceCategory);
        toast.success('Inscription réussie ! Connectez-vous pour continuer.');
        await supabase.auth.signOut();
        window.location.href = '/driver/auth';
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription");
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'service':      return 'Choisissez votre service';
      case 'profil':       return 'Votre profil';
      case 'finalisation': return 'Finalisation';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'service':      return 'Sélectionnez le service que vous souhaitez offrir';
      case 'profil':       return 'Informations personnelles, photo et permis de conduire';
      case 'finalisation': return 'Vérifiez vos informations et validez votre inscription';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Stepper header */}
      <div className="mb-6">
        <div className="flex items-center justify-center mb-4">
          {STEPS.map((s, idx) => {
            const isCompleted = currentStepNum > s.number;
            const isActive = currentStepNum === s.number;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 font-bold',
                      isCompleted
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30'
                        : isActive
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/40 ring-4 ring-white dark:ring-gray-900'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                  </motion.div>
                  <span className={cn(
                    'text-[10px] font-medium mt-1.5 hidden sm:block',
                    isActive    ? 'text-amber-600 dark:text-amber-400' :
                    isCompleted ? 'text-muted-foreground' :
                                  'text-muted-foreground/40'
                  )}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn(
                    'h-0.5 w-10 sm:w-16 mx-1 rounded-full transition-all duration-500',
                    isCompleted ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-border'
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden mx-2">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Title */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="text-center mt-4"
          >
            <h2 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {getStepTitle()}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{getStepSubtitle()}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content card */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-600" />

        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* ÉTAPE 1 : Service */}
            {step === 'service' && (
              <motion.div
                key="service"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl">
                  {[
                    { key: 'taxi',     label: '🚖 Transport VTC' },
                    { key: 'delivery', label: '📦 Livraison' },
                  ].map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => {
                        setServiceCategory(cat.key as 'taxi' | 'delivery');
                        handleFieldChange('serviceCategory', cat.key);
                        handleFieldChange('serviceType', '');
                      }}
                      className={cn(
                        'flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200',
                        serviceCategory === cat.key
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <SpecificServiceSelector
                  serviceCategory={serviceCategory}
                  selectedService={formData.serviceType}
                  onServiceSelect={(type) => {
                    handleFieldChange('serviceType', type);
                    handleFieldChange('serviceSpecialization', undefined);
                  }}
                />
              </motion.div>
            )}

            {/* ÉTAPE 2 : Profil + Documents fusionnés */}
            {step === 'profil' && (
              <motion.div
                key="profil"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <PersonalInfoStep formData={formData} onFieldChange={handleFieldChange} />

                <div className="border-t border-border/30 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileCheck className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-foreground">Permis & Contact d'urgence</h3>
                    <span className="text-xs text-muted-foreground">(optionnel)</span>
                  </div>
                  <LicenseStep formData={formData} onFieldChange={handleFieldChange} />
                </div>
              </motion.div>
            )}

            {/* ÉTAPE 3 : Finalisation */}
            {step === 'finalisation' && (
              <motion.div
                key="finalisation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <SummaryStep
                  formData={formData}
                  onFieldChange={handleFieldChange}
                  onBack={handlePrev}
                  onSubmit={handleSubmit}
                  isRegistering={isRegistering}
                  serviceCategory={serviceCategory}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Boutons navigation — cachés à l'étape finalisation (géré dans SummaryStep) */}
          {step !== 'finalisation' && (
            <div className="flex gap-3 mt-6 pt-5 border-t border-border/30">
              <Button
                variant="outline"
                onClick={handlePrev}
                className="h-12 px-5 rounded-xl border-border/60"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Retour</span>
              </Button>
              <Button
                onClick={handleNext}
                disabled={step === 'service' && !formData.serviceType}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 font-semibold transition-all duration-200"
              >
                Continuer
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
