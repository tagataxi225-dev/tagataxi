// Composant de test ultra-simple pour vérifier que les 5 étapes fonctionnent
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface TestSlideInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const TestSlideInterface = ({ onSubmit, onCancel }: TestSlideInterfaceProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { title: "Ville", description: "Sélectionnez votre ville" },
    { title: "Service", description: "Choisissez le type de livraison" },
    { title: "Point de collecte", description: "Où récupérer votre colis ?" },
    { title: "Destination", description: "Où livrer votre colis ?" },
    { title: "Confirmation", description: "Vérifiez les détails" }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <span className="text-sm text-muted-foreground">
              Étape {currentStep + 1} sur {steps.length}
            </span>
          </div>
          
          <Progress value={(currentStep + 1) * 20} className="w-full" />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
              <p className="text-muted-foreground">{steps[currentStep].description}</p>
              
              <div className="h-32 bg-muted/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={nextStep}
                  className="flex-1"
                >
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => onSubmit({ test: true })}
                  className="flex-1"
                >
                  Confirmer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestSlideInterface;