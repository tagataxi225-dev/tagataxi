import React, { useState } from 'react';
import { ServiceCategorySelector, ServiceCategory } from './ServiceCategorySelector';
import { SimplifiedDriverRegistration } from './SimplifiedDriverRegistration';
import { DriverRegistrationData } from '@/hooks/useDriverRegistration';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useDriverRegistration } from '@/hooks/useDriverRegistration';

interface DifferentiatedDriverRegistrationProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const DifferentiatedDriverRegistration: React.FC<DifferentiatedDriverRegistrationProps> = ({
  onSuccess,
  onBack,
}) => {
  const [step, setStep] = useState<'category' | 'form'>('category');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  
  const { registerDriver, isRegistering } = useDriverRegistration();

  const handleCategorySelect = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setSelectedService(null);
    setStep('form');
  };

  const handleServiceSelect = (serviceType: string) => {
    setSelectedService(serviceType);
  };

  const handleRegistrationSubmit = async (formData: DriverRegistrationData) => {
    if (!selectedCategory || !selectedService) return;

    try {
      await registerDriver(formData);
      onSuccess();
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'form':
        setStep('category');
        setSelectedCategory(null);
        setSelectedService(null);
        break;
      default:
        onBack();
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'category':
        return selectedCategory !== null;
      case 'form':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-2">
        <div className={`h-2 w-12 rounded-full ${step === 'category' ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`h-2 w-12 rounded-full ${step === 'form' ? 'bg-primary' : 'bg-muted'}`} />
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {step === 'category' && (
          <ServiceCategorySelector
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            disabled={isRegistering}
          />
        )}

        {step === 'form' && selectedCategory && (
          <SimplifiedDriverRegistration 
            serviceCategory={selectedCategory}
            onBack={handleBack}
            onSuccess={onSuccess}
          />
        )}
      </div>

      {/* Navigation buttons - only show for category and service steps */}
      {step !== 'form' && (
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isRegistering}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          <Button
            onClick={() => {
              if (step === 'category' && selectedCategory) {
                setStep('form');
              }
            }}
            disabled={!canProceed() || isRegistering}
            className="flex items-center gap-2"
          >
            Continuer
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};