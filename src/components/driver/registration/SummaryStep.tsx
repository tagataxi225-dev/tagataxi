import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Briefcase, User, CreditCard, Loader2, ChevronDown, ChevronUp, Star, Sparkles, FileCheck, Phone, Mail, Car, AlertCircle } from 'lucide-react';
import { SubscriptionPlanStep } from './SubscriptionPlanStep';
import { LegalAcceptanceCheckbox } from '@/components/shared/LegalAcceptanceCheckbox';
import { cn } from '@/lib/utils';

interface SummaryStepProps {
  formData: {
    serviceType: string;
    serviceCategory: 'taxi' | 'delivery';
    displayName: string;
    email: string;
    phoneNumber: string;
    licenseNumber: string;
    acceptTerms: boolean;
    vehicleType?: string;
    selectedPlanId: string | null;
    serviceSpecialization?: string;
    profilePhotoUrl?: string;
  };
  onFieldChange: (field: string, value: any) => void;
  onBack: () => void;
  onSubmit: () => void;
  isRegistering: boolean;
  serviceCategory: 'taxi' | 'delivery';
}

const SERVICE_LABELS: Record<string, string> = {
  moto: 'Moto-taxi',
  eco: 'VTC Économique',
  confort: 'VTC Confort',
  premium: 'VTC Premium',
  flash: 'Livraison Flash ⚡',
  flex: 'Livraison Flex 📦',
  maxicharge: 'MaxiCharge 🚛',
  taxi_moto: 'Taxi Moto',
  vtc: 'VTC',
};

export const SummaryStep: React.FC<SummaryStepProps> = ({
  formData,
  onFieldChange,
  onBack,
  onSubmit,
  isRegistering,
  serviceCategory,
}) => {
  const [showPlans, setShowPlans] = useState(false);
  

  const summaryItems = [
    {
      icon: <Briefcase className="w-4 h-4" />,
      label: 'Service',
      value: SERVICE_LABELS[formData.serviceType] || formData.serviceType,
      sub: serviceCategory === 'taxi' ? 'Transport VTC' : 'Livraison',
    },
    {
      icon: <User className="w-4 h-4" />,
      label: 'Nom',
      value: formData.displayName,
    },
    {
      icon: <Mail className="w-4 h-4" />,
      label: 'Email',
      value: formData.email,
    },
    {
      icon: <Phone className="w-4 h-4" />,
      label: 'Téléphone',
      value: formData.phoneNumber,
    },
    ...(formData.licenseNumber ? [{
      icon: <FileCheck className="w-4 h-4" />,
      label: 'Permis',
      value: formData.licenseNumber,
    }] : []),
    ...(formData.vehicleType ? [{
      icon: <Car className="w-4 h-4" />,
      label: 'Véhicule',
      value: formData.vehicleType,
    }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Hero */}
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Presque terminé !</h3>
        <p className="text-xs text-muted-foreground mt-1">Vérifiez vos informations et finalisez votre inscription</p>
      </div>

      {/* Récap data */}
      <div className="border border-border/40 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-muted/20 border-b border-border/30">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Récapitulatif</span>
        </div>
        <div className="divide-y divide-border/20">
          {summaryItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 px-4 py-3">
              <span className="text-muted-foreground flex-shrink-0">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                {item.sub && <p className="text-[10px] text-muted-foreground">{item.sub}</p>}
              </div>
              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Abonnement — expandable */}
      <div className="border border-border/40 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPlans(!showPlans)}
          className="w-full flex items-center justify-between px-4 py-3 bg-amber-50/60 dark:bg-amber-950/20 border-b border-border/30 hover:bg-amber-100/60 dark:hover:bg-amber-950/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              {formData.selectedPlanId ? '✅ Plan sélectionné' : '🎉 Choisir un abonnement'}
            </span>
          </div>
          {showPlans ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {/* Free trial info (always visible) */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">✨ Essai gratuit 30 jours</p>
              <p className="text-xs text-muted-foreground">Activé automatiquement · Aucune carte requise</p>
            </div>
          </div>
        </div>

        {/* Plans expandable */}
        <AnimatePresence>
          {showPlans && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-border/30"
            >
              <div className="p-4">
                <SubscriptionPlanStep
                  selectedPlan={formData.selectedPlanId}
                  onPlanSelect={(planId) => onFieldChange('selectedPlanId', planId)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CGU */}
      <LegalAcceptanceCheckbox
        checked={formData.acceptTerms}
        onCheckedChange={(checked) => onFieldChange('acceptTerms', checked)}
        accentColor="amber"
      />

      {/* Validation photo obligatoire */}
      {!formData.profilePhotoUrl && (
        <p className="text-xs text-destructive text-center flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" />
          La photo de profil est obligatoire
        </p>
      )}

      {/* CTA principal */}
      <Button
        onClick={onSubmit}
        disabled={isRegistering || !formData.acceptTerms || !formData.profilePhotoUrl}
        className={cn(
          'w-full h-13 rounded-xl font-bold text-white text-sm shadow-lg shadow-amber-500/30 transition-all duration-200',
          'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        style={{ height: '52px' }}
      >
        {isRegistering ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Inscription en cours...
          </>
        ) : (
          <>
            <Check className="w-5 h-5 mr-2" />
            Finaliser mon inscription
          </>
        )}
      </Button>


      {/* Retour */}
      <button
        type="button"
        onClick={onBack}
        disabled={isRegistering}
        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        ← Retour à l'étape précédente
      </button>
    </motion.div>
  );
};
