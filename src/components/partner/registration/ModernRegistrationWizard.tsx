import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, FileText, MapPin, Lock, CheckCircle, Layers, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import BrandLogo from '@/components/brand/BrandLogo';
import { usePartnerRegistrationSecure } from '@/hooks/usePartnerRegistrationSecure';
import { 
  CompanyInfoFormData, 
  DocumentsFormData, 
  ServicesFormData, 
  SecurityFormData 
} from '@/schemas/partnerRegistration';
import { CompanyInfoStep } from './steps/CompanyInfoStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { ServicesStep } from './steps/ServicesStep';
import { SecurityStep } from './steps/SecurityStep';
import { RegistrationSummary } from './steps/RegistrationSummary';
import { PartnerTypeStep } from './steps/PartnerTypeStep';
import { cn } from '@/lib/utils';

type PartnerFormData = CompanyInfoFormData & 
  DocumentsFormData & 
  ServicesFormData & 
  SecurityFormData & {
    partner_type?: 'delivery' | 'auto';
  };

// Thème adaptatif selon le type partenaire
const getTheme = (partnerType?: 'delivery' | 'auto') => {
  if (partnerType === 'auto') {
    return {
      gradient: 'from-blue-600 to-violet-600',
      gradientHover: 'hover:from-blue-700 hover:to-violet-700',
      gradientBg: 'from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-violet-950/20',
      stepActive: 'bg-gradient-to-br from-blue-600 to-violet-600',
      stepDone: 'bg-gradient-to-br from-blue-500 to-violet-500',
      connectorDone: 'bg-gradient-to-r from-blue-500 to-violet-500',
      progressBar: '[&>div]:bg-gradient-to-r [&>div]:from-blue-600 [&>div]:to-violet-600',
      stepLabel: 'text-blue-600 dark:text-blue-400',
      shadow: 'shadow-blue-500/20',
      btnClass: 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-lg shadow-blue-500/25',
      ringCard: 'ring-blue-200/50 dark:ring-blue-800/30',
      badge: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
      badgeLabel: '🚗 Partenaire Auto',
    };
  }
  if (partnerType === 'delivery') {
    return {
      gradient: 'from-orange-500 to-red-500',
      gradientHover: 'hover:from-orange-600 hover:to-red-600',
      gradientBg: 'from-orange-50 via-amber-50 to-red-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-red-950/20',
      stepActive: 'bg-gradient-to-br from-orange-500 to-red-500',
      stepDone: 'bg-gradient-to-br from-orange-400 to-red-400',
      connectorDone: 'bg-gradient-to-r from-orange-500 to-red-500',
      progressBar: '[&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-red-500',
      stepLabel: 'text-orange-600 dark:text-orange-400',
      shadow: 'shadow-orange-500/20',
      btnClass: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/25',
      ringCard: 'ring-orange-200/50 dark:ring-orange-800/30',
      badge: 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300',
      badgeLabel: '🚚 Partenaire Delivery',
    };
  }
  // Default (neutre — avant sélection)
  return {
    gradient: 'from-emerald-600 to-teal-600',
    gradientHover: 'hover:from-emerald-700 hover:to-teal-700',
    gradientBg: 'from-slate-50 via-gray-50 to-slate-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950',
    stepActive: 'bg-gradient-to-br from-emerald-600 to-teal-600',
    stepDone: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    connectorDone: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    progressBar: '[&>div]:bg-gradient-to-r [&>div]:from-emerald-600 [&>div]:to-teal-600',
    stepLabel: 'text-emerald-600 dark:text-emerald-400',
    shadow: 'shadow-emerald-500/20',
    btnClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25',
    ringCard: 'ring-emerald-200/50 dark:ring-emerald-800/30',
    badge: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
    badgeLabel: '',
  };
};

const MAIN_STEPS = [
  { number: 1, title: 'Entreprise', icon: Building2, subtitle: 'Votre société' },
  { number: 2, title: 'Documents', icon: FileText, subtitle: 'Justificatifs' },
  { number: 3, title: 'Zones', icon: MapPin, subtitle: 'Villes' },
  { number: 4, title: 'Sécurité', icon: Lock, subtitle: 'Mot de passe' },
  { number: 5, title: 'Validation', icon: CheckCircle, subtitle: 'Confirmation' },
];

export const ModernRegistrationWizard = () => {
  const navigate = useNavigate();
  const { registerPartner, loading } = usePartnerRegistrationSecure();
  const [currentStep, setCurrentStep] = useState(0);
  
  const [formData, setFormData] = useState<Partial<PartnerFormData>>({
    company_name: '',
    contact_email: '',
    phone: '',
    business_type: 'company',
    address: '',
    tax_number: '',
    service_areas: ['Kinshasa'],
    password: '',
    confirmPassword: '',
    partner_type: undefined,
  });

  const theme = getTheme(formData.partner_type);
  const progress = currentStep === 0 ? 0 : ((currentStep - 1) / (MAIN_STEPS.length - 1)) * 100;

  const handleTypeSelect = (type: 'delivery' | 'auto') => {
    setFormData(prev => ({ ...prev, partner_type: type }));
    setCurrentStep(1);
  };

  const handleNextStep = (stepData: Partial<PartnerFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.company_name || !formData.contact_email || 
          !formData.phone || !formData.password || !formData.business_type) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        setCurrentStep(4);
        return;
      }

      const registrationData = {
        company_name: formData.company_name,
        contact_email: formData.contact_email,
        phone: formData.phone,
        business_type: formData.business_type,
        address: formData.address || '',
        tax_number: formData.tax_number || '',
        service_areas: formData.service_areas || ['Kinshasa'],
        password: formData.password,
        partner_type: formData.partner_type,
      };

      const result = await registerPartner(registrationData);

      if (result.success) {
        toast.success('Inscription réussie !', {
          description: result.emailConfirmationRequired 
            ? 'Vérifiez votre email pour activer votre compte'
            : 'Votre demande est en cours de traitement'
        });
        setTimeout(() => navigate('/partner/auth'), 2000);
      }
    } catch (error: any) {
      if (error.message === 'EMAIL_EXISTS_USE_LOGIN') {
        toast.error('Email déjà utilisé', {
          description: 'Connectez-vous pour ajouter le rôle partenaire à votre compte existant',
          action: { label: 'Se connecter', onClick: () => navigate('/partner/auth') },
          duration: 10000
        });
        return;
      }
      toast.error("Erreur lors de l'inscription", {
        description: error.message || 'Veuillez réessayer'
      });
    }
  };

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br flex items-center justify-center p-4 transition-all duration-700',
      theme.gradientBg
    )}>
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className={cn(
            'relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-gray-900 shadow-xl mb-4',
            theme.shadow
          )}>
            <BrandLogo size={44} />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Devenez Partenaire Tembea
          </h1>
          <p className="text-sm text-muted-foreground">
            Rejoignez le réseau et développez votre activité
          </p>
          {/* Badge type partenaire */}
          {formData.partner_type && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mt-3', theme.badge)}
            >
              {theme.badgeLabel}
            </motion.span>
          )}
        </motion.div>

        {/* Stepper — affiché seulement après l'étape 0 */}
        <AnimatePresence>
          {currentStep > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              {/* Steps circles */}
              <div className="flex items-center justify-center gap-0 mb-4">
                {MAIN_STEPS.map((step, idx) => {
                  const isCompleted = currentStep > step.number;
                  const isActive = currentStep === step.number;
                  return (
                    <div key={step.number} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <motion.div
                          animate={{ scale: isActive ? 1.1 : 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                          className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                            isCompleted ? cn(theme.stepDone, 'text-white shadow-md') :
                            isActive ? cn(theme.stepActive, 'text-white shadow-lg ring-4 ring-white dark:ring-gray-900') :
                            'bg-muted text-muted-foreground'
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <step.icon className="w-4 h-4" />
                          )}
                        </motion.div>
                        <span className={cn(
                          'text-[10px] font-medium mt-1.5 hidden sm:block transition-colors duration-300',
                          isActive ? theme.stepLabel : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/50'
                        )}>
                          {step.title}
                        </span>
                      </div>
                      {idx < MAIN_STEPS.length - 1 && (
                        <div className={cn(
                          'h-0.5 w-8 sm:w-12 mx-1 rounded-full transition-all duration-500',
                          isCompleted ? theme.connectorDone : 'bg-border'
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full bg-gradient-to-r', theme.gradient)}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>

              {/* Step info */}
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={handlePreviousStep}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Retour
                </button>
                <span className={cn('text-xs font-semibold', theme.stepLabel)}>
                  Étape {currentStep} / {MAIN_STEPS.length}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={cn(
            'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden',
            theme.ringCard
          )}>
            {/* Top accent bar */}
            {formData.partner_type && (
              <div className={cn('h-1 w-full bg-gradient-to-r', theme.gradient)} />
            )}

            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {currentStep === 0 && (
                    <PartnerTypeStep onSelect={handleTypeSelect} />
                  )}
                  {currentStep === 1 && (
                    <CompanyInfoStep
                      data={formData as CompanyInfoFormData}
                      onNext={handleNextStep}
                      partnerType={formData.partner_type}
                      theme={theme}
                    />
                  )}
                  {currentStep === 2 && (
                    <DocumentsStep
                      data={formData as DocumentsFormData}
                      onNext={handleNextStep}
                      onPrevious={handlePreviousStep}
                      partnerType={formData.partner_type}
                      theme={theme}
                    />
                  )}
                  {currentStep === 3 && (
                    <ServicesStep
                      data={formData as ServicesFormData}
                      onNext={handleNextStep}
                      onPrevious={handlePreviousStep}
                      partnerType={formData.partner_type}
                      theme={theme}
                    />
                  )}
                  {currentStep === 4 && (
                    <SecurityStep
                      data={formData as SecurityFormData}
                      onNext={handleNextStep}
                      onPrevious={handlePreviousStep}
                      partnerType={formData.partner_type}
                      theme={theme}
                    />
                  )}
                  {currentStep === 5 && (
                    <RegistrationSummary
                      data={formData as PartnerFormData}
                      onConfirm={handleSubmit}
                      onEdit={(step) => setCurrentStep(step)}
                      onPrevious={handlePreviousStep}
                      loading={loading}
                      partnerType={formData.partner_type}
                      theme={theme}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-muted-foreground">
            Vous avez déjà un compte ?{' '}
            <button
              onClick={() => navigate('/partner/auth')}
              className={cn('font-semibold hover:underline transition-colors', theme.stepLabel)}
            >
              Se connecter
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ModernRegistrationWizard;
