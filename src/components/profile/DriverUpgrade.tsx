import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Car, CheckCircle, Clock, Upload, Users, DollarSign, Shield, Star, FileText, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const DriverUpgrade = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationStatus] = useState<'not_started' | 'in_progress' | 'pending' | 'approved' | 'rejected'>('not_started');

  const requirements = [
    {
      title: 'Âge minimum',
      description: '21 ans minimum',
      completed: false,
      required: true
    },
    {
      title: 'Permis de conduire',
      description: 'Permis valide depuis au moins 2 ans',
      completed: false,
      required: true
    },
    {
      title: 'Véhicule personnel',
      description: 'Véhicule de moins de 10 ans',
      completed: false,
      required: true
    },
    {
      title: 'Assurance véhicule',
      description: 'Assurance en cours de validité',
      completed: false,
      required: true
    },
    {
      title: 'Carte d\'identité',
      description: 'Pièce d\'identité en cours de validité',
      completed: false,
      required: true
    },
    {
      title: 'Casier judiciaire',
      description: 'Extrait de casier judiciaire récent',
      completed: false,
      required: true
    }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: 'Revenus flexibles',
      description: 'Gagnez jusqu\'à 150 000 CDF par jour selon votre disponibilité'
    },
    {
      icon: Clock,
      title: 'Horaires libres',
      description: 'Travaillez quand vous voulez, où vous voulez'
    },
    {
      icon: Users,
      title: 'Communauté',
      description: 'Rejoignez une communauté de chauffeurs professionnels'
    },
    {
      icon: Shield,
      title: 'Protection',
      description: 'Assurance incluse pour chaque course'
    }
  ];

  const steps = [
    {
      number: 1,
      title: 'Vérification des prérequis',
      description: 'Vérifiez que vous remplissez toutes les conditions'
    },
    {
      number: 2,
      title: 'Documents',
      description: 'Téléchargez vos documents justificatifs'
    },
    {
      number: 3,
      title: 'Véhicule',
      description: 'Informations et photos de votre véhicule'
    },
    {
      number: 4,
      title: 'Validation',
      description: 'Vérification de votre dossier par notre équipe'
    }
  ];

  const handleStartApplication = () => {
    toast({
      title: "Candidature initiée",
      description: "Votre processus de candidature a commencé. Suivez les étapes pour compléter votre dossier.",
    });
    setCurrentStep(1);
  };

  const getStatusBadge = () => {
    switch (applicationStatus) {
      case 'not_started':
        return <Badge variant="secondary">Non commencé</Badge>;
      case 'in_progress':
        return <Badge variant="outline">En cours</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">En attente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Approuvé</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Refusé</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Car className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Devenir chauffeur TAGA</h2>
        <p className="text-muted-foreground mb-4">Transformez votre véhicule en source de revenus</p>
        {getStatusBadge()}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="requirements">Prérequis</TabsTrigger>
          <TabsTrigger value="application">Candidature</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Pourquoi devenir chauffeur TAGA ?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {benefits.map((benefit) => {
                  const IconComponent = benefit.icon;
                  return (
                    <div key={benefit.title} className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">500+</div>
                <p className="text-sm text-muted-foreground">Chauffeurs actifs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">4.8/5</div>
                <p className="text-sm text-muted-foreground">Note moyenne</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">24/7</div>
                <p className="text-sm text-muted-foreground">Support disponible</p>
              </CardContent>
            </Card>
          </div>

          {applicationStatus === 'not_started' && (
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-2">Prêt à commencer ?</h3>
                <p className="text-muted-foreground mb-4">
                  Le processus d'inscription prend environ 10 minutes. Vous pouvez sauvegarder et reprendre à tout moment.
                </p>
                <Button onClick={handleStartApplication} size="lg">
                  Commencer ma candidature
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conditions requises</CardTitle>
              <p className="text-muted-foreground">
                Vérifiez que vous remplissez toutes les conditions avant de postuler
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`mt-1 ${req.completed ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {req.completed ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{req.title}</h4>
                        {req.required && <Badge variant="destructive" className="text-xs">Obligatoire</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{req.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="application" className="space-y-6">
          {/* Progress Tracker */}
          <Card>
            <CardHeader>
              <CardTitle>Progression de votre candidature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={(currentStep / steps.length) * 100} className="w-full" />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {steps.map((step) => (
                    <div key={step.number} className={`text-center p-3 rounded-lg border ${
                      currentStep >= step.number ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        currentStep >= step.number ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {currentStep > step.number ? <CheckCircle className="w-4 h-4" /> : step.number}
                      </div>
                      <h4 className="font-medium text-sm mb-1">{step.title}</h4>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Form */}
          {applicationStatus === 'not_started' ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Candidature non commencée</h3>
                <p className="text-muted-foreground mb-4">
                  Cliquez sur "Commencer ma candidature" dans l'onglet Aperçu pour débuter le processus.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Étape {currentStep}: {steps[currentStep - 1]?.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Avant de continuer, assurez-vous de remplir toutes les conditions requises.
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={() => setCurrentStep(2)}>
                        Continuer
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Permis de conduire *</Label>
                        <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Cliquez pour télécharger</p>
                        </div>
                      </div>
                      <div>
                        <Label>Carte d'identité *</Label>
                        <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Cliquez pour télécharger</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setCurrentStep(1)}>
                        Précédent
                      </Button>
                      <Button onClick={() => setCurrentStep(3)}>
                        Continuer
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="car-make">Marque du véhicule *</Label>
                        <Input id="car-make" placeholder="Ex: Toyota" />
                      </div>
                      <div>
                        <Label htmlFor="car-model">Modèle *</Label>
                        <Input id="car-model" placeholder="Ex: Corolla" />
                      </div>
                      <div>
                        <Label htmlFor="car-year">Année *</Label>
                        <Input id="car-year" type="number" placeholder="Ex: 2020" />
                      </div>
                      <div>
                        <Label htmlFor="car-plate">Plaque d'immatriculation *</Label>
                        <Input id="car-plate" placeholder="Ex: ABC-123" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setCurrentStep(2)}>
                        Précédent
                      </Button>
                      <Button onClick={() => setCurrentStep(4)}>
                        Continuer
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Candidature soumise !</h3>
                      <p className="text-muted-foreground mb-4">
                        Votre dossier est en cours de vérification. Vous recevrez une notification dans les 48h.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};