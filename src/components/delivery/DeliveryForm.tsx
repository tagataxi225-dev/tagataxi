import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, 
  User, 
  Phone, 
  Package, 
  Camera, 
  Upload,
  X,
  Plus,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PackageType {
  id: string;
  name: string;
  basePrice: number;
}

interface DeliveryFormProps {
  selectedPackage: PackageType;
  onSubmit: (formData: DeliveryFormData) => void;
  onCancel: () => void;
}

export interface DeliveryFormData {
  // Expéditeur
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderInstructions: string;
  
  // Destinataire
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverInstructions: string;
  
  // Colis
  packageDescription: string;
  packageValue: string;
  packageWeight: string;
  packagePhotos: File[];
  
  // Options
  urgent: boolean;
  fragile: boolean;
  requireSignature: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}

const DeliveryForm = ({ selectedPackage, onSubmit, onCancel }: DeliveryFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<DeliveryFormData>({
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    senderInstructions: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    receiverInstructions: '',
    packageDescription: '',
    packageValue: '',
    packageWeight: '',
    packagePhotos: [],
    urgent: false,
    fragile: false,
    requireSignature: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  const handleInputChange = (field: keyof DeliveryFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Format invalide",
          description: "Seules les images sont acceptées",
          variant: "destructive"
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Fichier trop volumineux",
          description: "Les photos doivent faire moins de 5MB",
          variant: "destructive"
        });
        return false;
      }
      return true;
    });

    if (formData.packagePhotos.length + validFiles.length > 5) {
      toast({
        title: "Limite atteinte",
        description: "Maximum 5 photos autorisées",
        variant: "destructive"
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      packagePhotos: [...prev.packagePhotos, ...validFiles]
    }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      packagePhotos: prev.packagePhotos.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.senderName) newErrors.senderName = 'Nom requis';
      if (!formData.senderPhone) newErrors.senderPhone = 'Téléphone requis';
      if (!formData.senderAddress) newErrors.senderAddress = 'Adresse requise';
    }

    if (step === 2) {
      if (!formData.receiverName) newErrors.receiverName = 'Nom requis';
      if (!formData.receiverPhone) newErrors.receiverPhone = 'Téléphone requis';
      if (!formData.receiverAddress) newErrors.receiverAddress = 'Adresse requise';
    }

    if (step === 3) {
      if (!formData.packageDescription) newErrors.packageDescription = 'Description requise';
      if (formData.packagePhotos.length === 0) newErrors.packagePhotos = 'Au moins une photo requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSubmit = () => {
    if (validateStep(3)) {
      onSubmit(formData);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === currentStep 
              ? 'bg-primary text-white' 
              : step < currentStep 
                ? 'bg-green-500 text-white'
                : 'bg-grey-200 text-grey-600'
          }`}>
            {step < currentStep ? '✓' : step}
          </div>
          {step < 3 && (
            <div className={`w-12 h-0.5 mx-2 ${
              step < currentStep ? 'bg-green-500' : 'bg-grey-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  if (currentStep === 1) {
    return (
      <div className="space-y-6">
        {renderStepIndicator()}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Informations expéditeur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="senderName">Nom complet *</Label>
              <Input
                id="senderName"
                value={formData.senderName}
                onChange={(e) => handleInputChange('senderName', e.target.value)}
                placeholder="Votre nom complet"
                className={errors.senderName ? 'border-red-500' : ''}
              />
              {errors.senderName && (
                <p className="text-sm text-red-500 mt-1">{errors.senderName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="senderPhone">Numéro de téléphone *</Label>
              <Input
                id="senderPhone"
                value={formData.senderPhone}
                onChange={(e) => handleInputChange('senderPhone', e.target.value)}
                placeholder="+243 xxx xxx xxx"
                className={errors.senderPhone ? 'border-red-500' : ''}
              />
              {errors.senderPhone && (
                <p className="text-sm text-red-500 mt-1">{errors.senderPhone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="senderAddress">Adresse de retrait *</Label>
              <div className="relative">
                <Input
                  id="senderAddress"
                  value={formData.senderAddress}
                  onChange={(e) => handleInputChange('senderAddress', e.target.value)}
                  placeholder="Adresse complète avec commune"
                  className={errors.senderAddress ? 'border-red-500' : 'pr-10'}
                />
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey-400" />
              </div>
              {errors.senderAddress && (
                <p className="text-sm text-red-500 mt-1">{errors.senderAddress}</p>
              )}
            </div>

            <div>
              <Label htmlFor="senderInstructions">Instructions de retrait (optionnel)</Label>
              <Textarea
                id="senderInstructions"
                value={formData.senderInstructions}
                onChange={(e) => handleInputChange('senderInstructions', e.target.value)}
                placeholder="Points de repère, étage, code d'accès..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleNext} className="flex-1">
            Suivant
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="space-y-6">
        {renderStepIndicator()}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-secondary" />
              Informations destinataire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receiverName">Nom complet *</Label>
              <Input
                id="receiverName"
                value={formData.receiverName}
                onChange={(e) => handleInputChange('receiverName', e.target.value)}
                placeholder="Nom du destinataire"
                className={errors.receiverName ? 'border-red-500' : ''}
              />
              {errors.receiverName && (
                <p className="text-sm text-red-500 mt-1">{errors.receiverName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="receiverPhone">Numéro de téléphone *</Label>
              <Input
                id="receiverPhone"
                value={formData.receiverPhone}
                onChange={(e) => handleInputChange('receiverPhone', e.target.value)}
                placeholder="+243 xxx xxx xxx"
                className={errors.receiverPhone ? 'border-red-500' : ''}
              />
              {errors.receiverPhone && (
                <p className="text-sm text-red-500 mt-1">{errors.receiverPhone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="receiverAddress">Adresse de livraison *</Label>
              <div className="relative">
                <Input
                  id="receiverAddress"
                  value={formData.receiverAddress}
                  onChange={(e) => handleInputChange('receiverAddress', e.target.value)}
                  placeholder="Adresse complète avec commune"
                  className={errors.receiverAddress ? 'border-red-500' : 'pr-10'}
                />
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey-400" />
              </div>
              {errors.receiverAddress && (
                <p className="text-sm text-red-500 mt-1">{errors.receiverAddress}</p>
              )}
            </div>

            <div>
              <Label htmlFor="receiverInstructions">Instructions de livraison (optionnel)</Label>
              <Textarea
                id="receiverInstructions"
                value={formData.receiverInstructions}
                onChange={(e) => handleInputChange('receiverInstructions', e.target.value)}
                placeholder="Points de repère, étage, heures de disponibilité..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
            Précédent
          </Button>
          <Button onClick={handleNext} className="flex-1">
            Suivant
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="space-y-6">
        {renderStepIndicator()}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Détails du colis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="packageDescription">Description du contenu *</Label>
              <Textarea
                id="packageDescription"
                value={formData.packageDescription}
                onChange={(e) => handleInputChange('packageDescription', e.target.value)}
                placeholder="Décrivez précisément le contenu du colis"
                rows={3}
                className={errors.packageDescription ? 'border-red-500' : ''}
              />
              {errors.packageDescription && (
                <p className="text-sm text-red-500 mt-1">{errors.packageDescription}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="packageWeight">Poids approximatif</Label>
                <Input
                  id="packageWeight"
                  value={formData.packageWeight}
                  onChange={(e) => handleInputChange('packageWeight', e.target.value)}
                  placeholder="2 kg"
                />
              </div>
              <div>
                <Label htmlFor="packageValue">Valeur (optionnel)</Label>
                <Input
                  id="packageValue"
                  value={formData.packageValue}
                  onChange={(e) => handleInputChange('packageValue', e.target.value)}
                  placeholder="50,000 FC"
                />
              </div>
            </div>

            <div>
              <Label>Photos du colis * (max 5)</Label>
              <div className="mt-2">
                {formData.packagePhotos.length === 0 ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-grey-300 border-dashed rounded-lg cursor-pointer bg-grey-50 hover:bg-grey-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-8 h-8 mb-2 text-grey-500" />
                      <p className="text-sm text-grey-600">Cliquez pour ajouter des photos</p>
                      <p className="text-xs text-grey-500">PNG, JPG jusqu'à 5MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {formData.packagePhotos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {formData.packagePhotos.length < 5 && (
                      <label className="flex items-center justify-center w-full h-12 border border-grey-300 border-dashed rounded-lg cursor-pointer bg-grey-50 hover:bg-grey-100 transition-colors">
                        <Plus className="w-4 h-4 mr-2 text-grey-500" />
                        <span className="text-sm text-grey-600">Ajouter une photo</span>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    )}
                  </div>
                )}
                {errors.packagePhotos && (
                  <p className="text-sm text-red-500 mt-1">{errors.packagePhotos}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Options de livraison</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.fragile}
                    onChange={(e) => handleInputChange('fragile', e.target.checked)}
                    className="w-4 h-4 text-primary border-grey-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm">Colis fragile (+500 FC)</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.urgent}
                    onChange={(e) => handleInputChange('urgent', e.target.checked)}
                    className="w-4 h-4 text-primary border-grey-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm">Livraison urgente (+1000 FC)</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.requireSignature}
                    onChange={(e) => handleInputChange('requireSignature', e.target.checked)}
                    className="w-4 h-4 text-primary border-grey-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm">Signature requise</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">Important</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Vérifiez que toutes les informations sont correctes</li>
                <li>• Les photos permettent d'identifier votre colis</li>
                <li>• Un SMS sera envoyé pour confirmer la prise en charge</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
            Précédent
          </Button>
          <Button onClick={handleSubmit} className="flex-1 bg-gradient-primary text-white">
            Confirmer la livraison
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default DeliveryForm;