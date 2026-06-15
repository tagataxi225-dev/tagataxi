import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useDriverRegistration } from '@/hooks/useDriverRegistration';
import { VehicleOwnershipSelector } from './VehicleOwnershipSelector';
import { ServiceSpecificFields } from './ServiceSpecificFields';
import { PartnerRequestForm } from './PartnerRequestForm';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface DriverRegistrationFormProps {
  serviceCategory: 'taxi' | 'delivery';
}

export const DriverRegistrationForm: React.FC<DriverRegistrationFormProps> = ({
  serviceCategory
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { registerDriver, isRegistering } = useDriverRegistration();
  
  const [step, setStep] = useState(1);
  const [vehicleMode, setVehicleMode] = useState<'own' | 'partner' | null>(null);
  
  const [formData, setFormData] = useState({
    serviceCategory,
    serviceType: '',
    displayName: '',
    phoneNumber: '',
    email: '',
    password: '',
    licenseNumber: '',
    licenseExpiry: '',
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: 2020,
    vehiclePlate: '',
    vehicleColor: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    deliveryCapacity: '',
    bankAccountNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    acceptsTerms: false,
    hasOwnVehicle: false
  });

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVehicleModeSelect = (mode: 'own' | 'partner') => {
    setVehicleMode(mode);
    setFormData(prev => ({
      ...prev,
      hasOwnVehicle: mode === 'own'
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return vehicleMode !== null;
      case 2:
        return !!(formData.displayName && formData.phoneNumber && formData.email && formData.password);
      case 3:
        return !!(formData.licenseNumber && formData.licenseExpiry && formData.serviceType);
      case 4:
        if (vehicleMode === 'own') {
          return !!(formData.vehicleType && formData.vehicleMake && formData.vehicleModel && 
                   formData.vehiclePlate && formData.insuranceNumber);
        }
        return true; // Pour mode partenaire, pas de validation véhicule
      case 5:
        return formData.acceptsTerms;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      toast.error(t('auth.accept_terms_required'));
      return;
    }

    try {
      await registerDriver(formData);

      toast.success('Compte créé ! Vérifiez votre email puis connectez-vous.');
      navigate('/driver/auth');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <VehicleOwnershipSelector
            selectedMode={vehicleMode}
            onModeSelect={handleVehicleModeSelect}
            serviceCategory={serviceCategory}
          />
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('auth.personal_info')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayName">{t('auth.full_name_required')}</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => handleFieldChange('displayName', e.target.value)}
                  placeholder={t('auth.name_placeholder')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">{t('auth.phone_required')}</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                  placeholder={t('auth.phone_placeholder_intl')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">{t('auth.email_required')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder={t('auth.email_placeholder')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">{t('auth.password_required')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  placeholder={t('auth.secure_password_placeholder')}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('auth.driving_license')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseNumber">{t('auth.license_number_required')}</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
                  placeholder={t('auth.license_number_placeholder')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="licenseExpiry">{t('auth.expiry_date_required')}</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => handleFieldChange('licenseExpiry', e.target.value)}
                  required
                />
              </div>
            </div>
            <ServiceSpecificFields
              serviceCategory={serviceCategory}
              hasOwnVehicle={false} // On affiche juste le type de service ici
              formData={formData}
              onFieldChange={handleFieldChange}
            />
          </div>
        );

      case 4:
        if (vehicleMode === 'own') {
          return (
            <ServiceSpecificFields
              serviceCategory={serviceCategory}
              hasOwnVehicle={true}
              formData={formData}
              onFieldChange={handleFieldChange}
            />
          );
        } else {
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('auth.partner_mode')}</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800">
                  {t('auth.partner_mode_info')}
                </p>
              </div>
            </div>
          );
        }

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('auth.additional_info')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContactName">{t('auth.emergency_contact')}</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleFieldChange('emergencyContactName', e.target.value)}
                  placeholder={t('auth.emergency_contact_name_placeholder')}
                />
              </div>
              <div>
                <Label htmlFor="emergencyContactPhone">{t('auth.emergency_phone')}</Label>
                <Input
                  id="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleFieldChange('emergencyContactPhone', e.target.value)}
                  placeholder={t('auth.phone_placeholder_intl')}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="bankAccountNumber">{t('auth.bank_account_optional')}</Label>
                <Input
                  id="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={(e) => handleFieldChange('bankAccountNumber', e.target.value)}
                  placeholder={t('auth.for_payments')}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="acceptsTerms"
                checked={formData.acceptsTerms}
                onCheckedChange={(checked) => handleFieldChange('acceptsTerms', checked)}
              />
              <Label htmlFor="acceptsTerms" className="text-sm">
                {t('auth.accept_terms_full')}
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">
              {serviceCategory === 'taxi' ? t('auth.driver_deliverer') : t('auth.become_deliverer')}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((stepNumber) => (
                  <React.Fragment key={stepNumber}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                      step >= stepNumber ? 'bg-primary text-white' : 'bg-gray-200'
                    }`}>
                      {stepNumber}
                    </div>
                    {stepNumber < 5 && (
                      <div className={`w-8 h-1 ${step > stepNumber ? 'bg-primary' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {renderStepContent()}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
              >
                {t('common.previous')}
              </Button>

              {step < 5 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!validateStep(step)}
                >
                  {t('common.next')}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!validateStep(5) || isRegistering}
                >
                  {isRegistering ? t('auth.registering') : t('auth.finalize_registration')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};