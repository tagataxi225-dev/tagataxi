import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  User, 
  Phone, 
  Package, 
  Camera, 
  X,
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  Shield
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
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderInstructions: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverInstructions: string;
  packageDescription: string;
  packageValue: string;
  packageWeight: string;
  packagePhotos: File[];
  urgent: boolean;
  fragile: boolean;
  requireSignature: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}

const ModernDeliveryForm = ({ selectedPackage, onSubmit, onCancel }: DeliveryFormProps) => {
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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Format invalide",
          description: "Seules les images sont acceptées",
          variant: "destructive"
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "Les photos doivent faire moins de 5MB",
          variant: "destructive"
        });
        return false;
      }
      return true;
    });

    if (formData.packagePhotos.length + validFiles.length > 3) {
      toast({
        title: "Limite atteinte",
        description: "Maximum 3 photos autorisées",
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

  const steps = [
    { id: 1, title: 'Expéditeur', icon: User },
    { id: 2, title: 'Destinataire', icon: MapPin },
    { id: 3, title: 'Colis', icon: Package }
  ];

  const ProgressBar = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        
        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className={`flex flex-col items-center ${index !== steps.length - 1 ? 'flex-1' : ''}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isCompleted 
                  ? 'bg-congo-green text-white' 
                  : isActive 
                    ? 'bg-primary text-white' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-sm mt-2 font-medium ${
                isActive ? 'text-primary' : isCompleted ? 'text-congo-green' : 'text-muted-foreground'
              }`}>
                {step.title}
              </span>
            </div>
            {index !== steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-4 transition-colors ${
                currentStep > step.id ? 'bg-congo-green' : 'bg-muted'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6 space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Qui envoie ?</h3>
          <p className="text-muted-foreground">Informations de l'expéditeur</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="senderName" className="text-base font-medium">Nom complet</Label>
            <Input
              id="senderName"
              value={formData.senderName}
              onChange={(e) => handleInputChange('senderName', e.target.value)}
              placeholder="Votre nom complet"
              className={`h-12 text-base ${errors.senderName ? 'border-destructive' : ''}`}
            />
            {errors.senderName && (
              <p className="text-sm text-destructive mt-1">{errors.senderName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="senderPhone" className="text-base font-medium">Téléphone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="senderPhone"
                value={formData.senderPhone}
                onChange={(e) => handleInputChange('senderPhone', e.target.value)}
                placeholder="+243 xxx xxx xxx"
                className={`h-12 pl-12 text-base ${errors.senderPhone ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.senderPhone && (
              <p className="text-sm text-destructive mt-1">{errors.senderPhone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="senderAddress" className="text-base font-medium">Adresse de retrait</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Textarea
                id="senderAddress"
                value={formData.senderAddress}
                onChange={(e) => handleInputChange('senderAddress', e.target.value)}
                placeholder="Adresse complète avec commune et points de repère"
                className={`pl-12 text-base min-h-20 ${errors.senderAddress ? 'border-destructive' : ''}`}
                rows={3}
              />
            </div>
            {errors.senderAddress && (
              <p className="text-sm text-destructive mt-1">{errors.senderAddress}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6 space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="text-xl font-semibold">Où livrer ?</h3>
          <p className="text-muted-foreground">Informations du destinataire</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="receiverName" className="text-base font-medium">Nom du destinataire</Label>
            <Input
              id="receiverName"
              value={formData.receiverName}
              onChange={(e) => handleInputChange('receiverName', e.target.value)}
              placeholder="Nom complet du destinataire"
              className={`h-12 text-base ${errors.receiverName ? 'border-destructive' : ''}`}
            />
            {errors.receiverName && (
              <p className="text-sm text-destructive mt-1">{errors.receiverName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="receiverPhone" className="text-base font-medium">Téléphone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="receiverPhone"
                value={formData.receiverPhone}
                onChange={(e) => handleInputChange('receiverPhone', e.target.value)}
                placeholder="+243 xxx xxx xxx"
                className={`h-12 pl-12 text-base ${errors.receiverPhone ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.receiverPhone && (
              <p className="text-sm text-destructive mt-1">{errors.receiverPhone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="receiverAddress" className="text-base font-medium">Adresse de livraison</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Textarea
                id="receiverAddress"
                value={formData.receiverAddress}
                onChange={(e) => handleInputChange('receiverAddress', e.target.value)}
                placeholder="Adresse complète avec commune et points de repère"
                className={`pl-12 text-base min-h-20 ${errors.receiverAddress ? 'border-destructive' : ''}`}
                rows={3}
              />
            </div>
            {errors.receiverAddress && (
              <p className="text-sm text-destructive mt-1">{errors.receiverAddress}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 space-y-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-congo-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-congo-yellow" />
            </div>
            <h3 className="text-xl font-semibold">Détails du colis</h3>
            <p className="text-muted-foreground">Que souhaitez-vous envoyer ?</p>
          </div>

          <div>
            <Label htmlFor="packageDescription" className="text-base font-medium">Description</Label>
            <Textarea
              id="packageDescription"
              value={formData.packageDescription}
              onChange={(e) => handleInputChange('packageDescription', e.target.value)}
              placeholder="Décrivez le contenu de votre colis"
              className={`text-base min-h-20 ${errors.packageDescription ? 'border-destructive' : ''}`}
              rows={3}
            />
            {errors.packageDescription && (
              <p className="text-sm text-destructive mt-1">{errors.packageDescription}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="packageWeight" className="text-base font-medium">Poids (kg)</Label>
              <Input
                id="packageWeight"
                value={formData.packageWeight}
                onChange={(e) => handleInputChange('packageWeight', e.target.value)}
                placeholder="2"
                className="h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="packageValue" className="text-base font-medium">Valeur (FC)</Label>
              <Input
                id="packageValue"
                value={formData.packageValue}
                onChange={(e) => handleInputChange('packageValue', e.target.value)}
                placeholder="50,000"
                className="h-12 text-base"
              />
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Photos (optionnel)</Label>
            <div className="mt-3">
              {formData.packagePhotos.length === 0 ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/50 rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Camera className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Ajouter des photos</p>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {formData.packagePhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {formData.packagePhotos.length < 3 && (
                    <label className="flex items-center justify-center w-full h-12 border border-dashed border-border/50 rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Plus className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Ajouter</span>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options Card */}
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Options de livraison
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-congo-red" />
                <div>
                  <p className="font-medium">Livraison urgente</p>
                  <p className="text-sm text-muted-foreground">+2,000 FC</p>
                </div>
              </div>
              <Switch
                checked={formData.urgent}
                onCheckedChange={(checked) => handleInputChange('urgent', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-congo-yellow" />
                <div>
                  <p className="font-medium">Colis fragile</p>
                  <p className="text-sm text-muted-foreground">+1,000 FC</p>
                </div>
              </div>
              <Switch
                checked={formData.fragile}
                onCheckedChange={(checked) => handleInputChange('fragile', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-congo-green" />
                <div>
                  <p className="font-medium">Signature requise</p>
                  <p className="text-sm text-muted-foreground">Gratuit</p>
                </div>
              </div>
              <Switch
                checked={formData.requireSignature}
                onCheckedChange={(checked) => handleInputChange('requireSignature', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <ProgressBar />
      
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      
      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        {currentStep > 1 ? (
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="flex-1 h-12 text-base font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Précédent
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1 h-12 text-base font-medium"
          >
            Annuler
          </Button>
        )}
        
        {currentStep < 3 ? (
          <Button 
            onClick={handleNext}
            className="flex-1 h-12 text-base font-medium bg-primary hover:bg-primary/90"
          >
            Suivant
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            className="flex-1 h-12 text-base font-medium bg-congo-green hover:bg-congo-green/90 text-white"
          >
            <Check className="w-5 h-5 mr-2" />
            Confirmer la livraison
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModernDeliveryForm;