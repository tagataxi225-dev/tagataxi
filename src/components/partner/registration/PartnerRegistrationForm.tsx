import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartnerRegistrationSecure } from '@/hooks/usePartnerRegistrationSecure';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CompanyInfoStep } from './steps/CompanyInfoStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { ServicesStep } from './steps/ServicesStep';
import { SecurityStep } from './steps/SecurityStep';
import { RegistrationSummary } from './steps/RegistrationSummary';
import { 
  CompanyInfoFormData, 
  DocumentsFormData, 
  ServicesFormData, 
  SecurityFormData 
} from '@/schemas/partnerRegistration';
import { Building2, FileText, MapPin, Lock, CheckCircle } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';

/**
 * 🎯 FORMULAIRE D'INSCRIPTION PARTENAIRE COMPLET
 * 
 * Processus en 5 étapes sécurisé :
 * 1. Informations entreprise
 * 2. Documents et licences
 * 3. Zones de service
 * 4. Sécurité (mot de passe)
 * 5. Récapitulatif et confirmation
 * 
 * Sécurité :
 * - Validation Zod à chaque étape
 * - Sanitisation des entrées
 * - Protection CSRF via Supabase Auth
 * - Rate limiting côté backend
 */

type PartnerFormData = CompanyInfoFormData & 
  DocumentsFormData & 
  ServicesFormData & 
  SecurityFormData;

const STEPS = [
  { number: 1, title: 'Entreprise', icon: Building2 },
  { number: 2, title: 'Documents', icon: FileText },
  { number: 3, title: 'Services', icon: MapPin },
  { number: 4, title: 'Sécurité', icon: Lock },
  { number: 5, title: 'Confirmation', icon: CheckCircle },
];

export const PartnerRegistrationForm = () => {
  const navigate = useNavigate();
  const { registerPartner, loading } = usePartnerRegistrationSecure();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  
  // État du formulaire (initialisé avec valeurs par défaut sécurisées)
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
  });

  // Progression (0-100%)
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  // Navigation entre étapes
  const handleNextStep = (stepData: Partial<PartnerFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Soumission finale
  const handleSubmit = async () => {
    try {
      // Validation finale complète
      if (!formData.company_name || !formData.contact_email || 
          !formData.phone || !formData.password || !formData.business_type) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      // Vérification correspondance mots de passe
      if (formData.password !== formData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        setCurrentStep(4); // Retour à l'étape sécurité
        return;
      }

      // Préparer les données pour l'API (suppression confirmPassword)
      const registrationData = {
        company_name: formData.company_name,
        contact_email: formData.contact_email,
        phone: formData.phone,
        business_type: formData.business_type,
        address: formData.address || '',
        tax_number: formData.tax_number || '',
        service_areas: formData.service_areas || ['Kinshasa'],
        password: formData.password,
      };

      console.log('🚀 Submitting partner registration:', {
        ...registrationData,
        password: '[REDACTED]' // Ne jamais logger les mots de passe
      });

      const result = await registerPartner(registrationData);

      if (result.success) {
        // Message personnalisé selon le cas
        if ((result as any).existingUser) {
          toast.success('Profil partenaire créé avec succès !', {
            description: 'Vous pouvez maintenant accéder à votre espace partenaire'
          });
        } else {
          toast.success('Inscription réussie !', {
            description: result.emailConfirmationRequired 
              ? 'Vérifiez votre email pour activer votre compte'
              : 'Votre demande est en cours de traitement'
          });
        }
        
        // Redirection après 2 secondes
        setTimeout(() => {
          navigate('/partner/auth');
        }, 2000);
      } else {
        // ✅ Cas d'échec retourné par le hook
        if (result.error === 'AUTH_FAILED') {
          setCurrentStep(4);
          setShowPasswordReset(true);
          return;
        }
      }
    } catch (error: any) {
      console.error('Partner registration error:', error);
      
      // ✅ Cas 1 : Email déjà utilisé
      if (error.message === 'EMAIL_EXISTS_USE_LOGIN') {
        toast.error('Email déjà utilisé', {
          description: 'Cet email est déjà lié à un compte Tembea. Connectez-vous d\'abord pour ajouter le rôle partenaire.',
          duration: 8000,
          action: {
            label: 'Se connecter',
            onClick: () => navigate('/partner/auth')
          }
        });
        return;
      }
      
      toast.error('Erreur lors de l\'inscription', {
        description: error.message || 'Veuillez réessayer plus tard'
      });
    }
  };

  // Rendu de l'étape actuelle
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CompanyInfoStep
            data={{
              company_name: formData.company_name || '',
              contact_email: formData.contact_email || '',
              phone: formData.phone || '',
              business_type: formData.business_type || 'company',
              address: formData.address,
            }}
            onNext={handleNextStep}
          />
        );
      
      case 2:
        return (
          <DocumentsStep
            data={{
              tax_number: formData.tax_number,
            }}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
          />
        );
      
      case 3:
        return (
          <ServicesStep
            data={{
              service_areas: formData.service_areas || ['Kinshasa'],
            }}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
          />
        );
      
      case 4:
        return (
          <SecurityStep
            data={{
              password: formData.password || '',
              confirmPassword: formData.confirmPassword || '',
            }}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
            showPasswordResetLink={showPasswordReset}
          />
        );
      
      case 5:
        return (
          <RegistrationSummary
            data={formData as PartnerFormData}
            onConfirm={handleSubmit}
            onEdit={(step) => setCurrentStep(step)}
            onPrevious={handlePreviousStep}
            loading={loading}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-background dark:to-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Messages informatifs multi-rôles */}
        {currentStep === 1 && (
          <div className="mb-6 space-y-3 animate-fade-in">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Vous avez déjà un compte Tembea ?</strong> Pas de problème ! 
                Vous pouvez utiliser le même email pour devenir partenaire. 
                Utilisez le même mot de passe que votre compte existant.
              </p>
            </div>
            
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ <strong>Email déjà enregistré ?</strong> Si cet email est déjà utilisé, vous devez d'abord vous{' '}
                <button 
                  onClick={() => navigate('/partner/auth')}
                  className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-300"
                >
                  connecter ici
                </button>
                , puis accéder à "Devenir partenaire" depuis votre profil.
              </p>
            </div>
          </div>
        )}
        
        {/* Header avec logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-gray-950 shadow-lg mb-4">
            <BrandLogo size={60} />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Devenir Partenaire Tembea
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400">
            Rejoignez notre réseau et développez votre activité de transport
          </p>
        </div>

        {/* Barre de progression */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div 
                  key={step.number}
                  className="flex flex-col items-center flex-1"
                >
                  <div 
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                      ${isActive 
                        ? 'bg-green-600 text-white shadow-lg scale-110' 
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  
                  <span 
                    className={`
                      text-xs font-medium text-center
                      ${isActive 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-500 dark:text-gray-400'
                      }
                    `}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          
          <Progress value={progress} className="h-2" />
        </div>

        {/* Contenu de l'étape actuelle */}
        <Card className="shadow-xl animate-scale-in">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              {STEPS[currentStep - 1]?.icon && 
                (() => {
                  const Icon = STEPS[currentStep - 1].icon;
                  return <Icon className="w-6 h-6 text-green-600" />;
                })()
              }
              Étape {currentStep} : {STEPS[currentStep - 1]?.title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Informations sur votre entreprise"}
              {currentStep === 2 && "Documents légaux et licences"}
              {currentStep === 3 && "Zones de service et véhicules"}
              {currentStep === 4 && "Sécurité de votre compte"}
              {currentStep === 5 && "Vérifiez vos informations avant de confirmer"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            Déjà inscrit ?{' '}
            <button
              onClick={() => navigate('/partner/auth')}
              className="text-green-600 hover:underline font-medium"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegistrationForm;
