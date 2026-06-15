import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Shield, 
  Phone, 
  Upload, 
  Camera, 
  CheckCircle, 
  AlertTriangle,
  User,
  FileText,
  Fingerprint,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  required: boolean;
}

const SecurityVerification: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([
    {
      id: 'phone',
      title: 'Vérification téléphone',
      description: 'Confirmez votre numéro de téléphone',
      status: 'pending',
      required: true
    },
    {
      id: 'identity',
      title: 'Vérification d\'identité',
      description: 'Téléchargez une pièce d\'identité valide',
      status: 'pending',
      required: true
    },
    {
      id: 'selfie',
      title: 'Photo de profil',
      description: 'Prenez une photo de votre visage',
      status: 'pending',
      required: true
    },
    {
      id: 'biometric',
      title: 'Données biométriques',
      description: 'Authentification par empreinte (optionnel)',
      status: 'pending',
      required: false
    }
  ]);

  const updateStepStatus = (stepId: string, status: VerificationStep['status']) => {
    setVerificationSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un numéro de téléphone',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    updateStepStatus('phone', 'in_progress');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Code envoyé',
        description: `Code de vérification envoyé au ${phoneNumber}`,
      });
      
      setCurrentStep(1);
    } catch (error) {
      updateStepStatus('phone', 'failed');
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer le code de vérification',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyPhoneCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Erreur',
        description: 'Code de vérification invalide',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      updateStepStatus('phone', 'completed');
      setCurrentStep(2);
      
      toast({
        title: 'Téléphone vérifié',
        description: 'Votre numéro a été confirmé avec succès',
      });
    } catch (error) {
      updateStepStatus('phone', 'failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadIdentityDocument = async (file: File) => {
    updateStepStatus('identity', 'in_progress');
    setIsSubmitting(true);

    try {
      // Simulate file upload and processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      updateStepStatus('identity', 'completed');
      setCurrentStep(3);
      
      toast({
        title: 'Document vérifié',
        description: 'Votre pièce d\'identité a été validée',
      });
    } catch (error) {
      updateStepStatus('identity', 'failed');
      toast({
        title: 'Erreur',
        description: 'Impossible de vérifier le document',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const takeSelfie = async () => {
    updateStepStatus('selfie', 'in_progress');
    setIsSubmitting(true);

    try {
      // Simulate camera capture and face verification
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      updateStepStatus('selfie', 'completed');
      setCurrentStep(4);
      
      toast({
        title: 'Photo validée',
        description: 'Votre photo de profil a été acceptée',
      });
    } catch (error) {
      updateStepStatus('selfie', 'failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setupBiometric = async () => {
    updateStepStatus('biometric', 'in_progress');
    setIsSubmitting(true);

    try {
      // Simulate biometric setup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      updateStepStatus('biometric', 'completed');
      
      toast({
        title: 'Authentification biométrique activée',
        description: 'Vous pouvez maintenant vous connecter avec votre empreinte',
      });
    } catch (error) {
      updateStepStatus('biometric', 'failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepIcon = (step: VerificationStep) => {
    switch (step.id) {
      case 'phone': return <Phone className="h-5 w-5" />;
      case 'identity': return <FileText className="h-5 w-5" />;
      case 'selfie': return <Camera className="h-5 w-5" />;
      case 'biometric': return <Fingerprint className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'in_progress': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const completedSteps = verificationSteps.filter(s => s.status === 'completed').length;
  const totalSteps = verificationSteps.length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">Vérification de sécurité</h2>
        <p className="text-muted-foreground">
          Sécurisez votre compte avec notre processus de vérification
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progression globale</span>
              <span>{completedSteps}/{totalSteps} étapes</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-muted-foreground text-center">
              {progress === 100 ? 'Vérification complète!' : `${Math.round(progress)}% complété`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Steps Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Étapes de vérification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {verificationSteps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                <div className={getStatusColor(step.status)}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : step.status === 'failed' ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    getStepIcon(step)
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{step.title}</p>
                    {step.required && <Badge variant="secondary" className="text-xs">Obligatoire</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <Badge 
                  variant={
                    step.status === 'completed' ? 'default' : 
                    step.status === 'failed' ? 'destructive' : 
                    'secondary'
                  }
                >
                  {step.status === 'completed' ? 'Terminé' :
                   step.status === 'in_progress' ? 'En cours' :
                   step.status === 'failed' ? 'Échec' : 'En attente'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Detail */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Vérification du téléphone</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+243 XXX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <Button 
              onClick={sendVerificationCode}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer le code'}
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Entrez le code de vérification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Code envoyé au {phoneNumber}
            </p>
            <div className="space-y-2">
              <Label htmlFor="code">Code de vérification (6 chiffres)</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setCurrentStep(0)} className="flex-1">
                Retour
              </Button>
              <Button 
                onClick={verifyPhoneCode}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Vérification...' : 'Vérifier'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Téléchargement de pièce d'identité</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-muted rounded-lg">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">
                Téléchargez votre carte d'identité ou passeport
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Formats acceptés: JPG, PNG, PDF (Max 5MB)
              </p>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadIdentityDocument(file);
                }}
                className="hidden"
                id="identity-upload"
              />
              <Button asChild disabled={isSubmitting}>
                <label htmlFor="identity-upload" className="cursor-pointer">
                  {isSubmitting ? 'Téléchargement...' : 'Choisir un fichier'}
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Photo de profil</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-muted rounded-lg">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">
                Prenez une photo de votre visage
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Assurez-vous que votre visage est bien éclairé et centré
              </p>
              <Button 
                onClick={takeSelfie}
                disabled={isSubmitting}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Capture...' : 'Prendre une photo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Fingerprint className="h-5 w-5" />
              <span>Authentification biométrique (optionnel)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-muted rounded-lg">
              <Fingerprint className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">
                Configurez l'authentification par empreinte
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Ajoutez une couche de sécurité supplémentaire
              </p>
              <div className="flex space-x-3 justify-center">
                <Button variant="outline" onClick={() => {
                  toast({
                    title: 'Vérification terminée',
                    description: 'Votre compte est maintenant sécurisé',
                  });
                }}>
                  Ignorer
                </Button>
                <Button 
                  onClick={setupBiometric}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Configuration...' : 'Configurer'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityVerification;