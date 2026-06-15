import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  Check, 
  MapPin, 
  Package, 
  Signature, 
  Upload,
  User,
  Phone,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryValidationProps {
  orderId: string;
  orderData: {
    pickup_location: string;
    delivery_location: string;
    recipient_name?: string;
    recipient_phone?: string;
    package_description?: string;
    delivery_type: string;
    estimated_price: number;
  };
  onValidationComplete: (data: any) => void;
}

type ValidationStep = 'pickup' | 'validate' | 'arrive' | 'deliver' | 'complete';

export default function DeliveryValidationInterface({ 
  orderId, 
  orderData, 
  onValidationComplete 
}: DeliveryValidationProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<ValidationStep>('pickup');
  const [loading, setLoading] = useState(false);
  const [validationData, setValidationData] = useState({
    pickupPhoto: null as File | null,
    pickupNotes: '',
    packageCondition: 'good',
    deliveryPhoto: null as File | null,
    signature: '',
    recipientName: '',
    recipientConfirmed: false,
    deliveryNotes: ''
  });

  const pickupPhotoRef = useRef<HTMLInputElement>(null);
  const deliveryPhotoRef = useRef<HTMLInputElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  const steps = [
    { key: 'pickup', label: 'Récupération', icon: Package },
    { key: 'validate', label: 'Validation', icon: Check },
    { key: 'arrive', label: 'Arrivée', icon: MapPin },
    { key: 'deliver', label: 'Livraison', icon: Signature },
    { key: 'complete', label: 'Terminé', icon: CheckCircle2 }
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.key === currentStep);
  const getProgress = () => ((getCurrentStepIndex() + 1) / steps.length) * 100;

  const handlePickupConfirmation = async () => {
    if (!validationData.pickupPhoto) {
      toast({
        title: "Photo requise",
        description: "Veuillez prendre une photo du colis à récupérer",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Upload pickup photo
      const photoUrl = await uploadPhoto(validationData.pickupPhoto, 'pickup');
      
      // Update delivery status
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          status: 'picked_up',
          pickup_photo_url: photoUrl,
          pickup_notes: validationData.pickupNotes,
          pickup_time: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Colis récupéré",
        description: "La récupération a été confirmée avec succès"
      });

      setCurrentStep('validate');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la confirmation de récupération",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArrivalConfirmation = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          status: 'in_transit',
          arrival_time: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Arrivée confirmée",
        description: "Vous êtes arrivé à destination"
      });

      setCurrentStep('deliver');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la confirmation d'arrivée",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryCompletion = async () => {
    if (!validationData.deliveryPhoto || !validationData.recipientName) {
      toast({
        title: "Informations manquantes",
        description: "Photo de livraison et nom du destinataire requis",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Upload delivery photo
      const photoUrl = await uploadPhoto(validationData.deliveryPhoto, 'delivery');
      
      // Update delivery status
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          status: 'delivered',
          delivery_photo_url: photoUrl,
          recipient_name: validationData.recipientName,
          delivery_notes: validationData.deliveryNotes,
          completed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Livraison terminée",
        description: "La livraison a été confirmée avec succès"
      });

      setCurrentStep('complete');
      onValidationComplete({
        orderId,
        status: 'delivered',
        completedAt: new Date().toISOString()
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la finalisation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file: File, type: 'pickup' | 'delivery'): Promise<string> => {
    const fileName = `${orderId}_${type}_${Date.now()}.jpg`;
    const filePath = `delivery-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('delivery-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('delivery-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handlePhotoCapture = (type: 'pickup' | 'delivery') => {
    const input = type === 'pickup' ? pickupPhotoRef.current : deliveryPhotoRef.current;
    if (input) input.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pickup' | 'delivery') => {
    const file = e.target.files?.[0];
    if (file) {
      setValidationData(prev => ({
        ...prev,
        [type === 'pickup' ? 'pickupPhoto' : 'deliveryPhoto']: file
      }));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'pickup':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Package className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Confirmation de récupération</h3>
              <p className="text-muted-foreground">
                Prenez une photo du colis et confirmez la récupération
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Photo du colis (obligatoire)</Label>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePhotoCapture('pickup')}
                    className="w-full h-24 flex flex-col gap-2"
                  >
                    <Camera className="h-6 w-6" />
                    {validationData.pickupPhoto ? 'Photo prise ✓' : 'Prendre une photo'}
                  </Button>
                  <input
                    ref={pickupPhotoRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handlePhotoChange(e, 'pickup')}
                  />
                </div>
              </div>

              <div>
                <Label>Notes sur le colis (optionnel)</Label>
                <Textarea
                  placeholder="État du colis, observations..."
                  value={validationData.pickupNotes}
                  onChange={(e) => setValidationData(prev => ({
                    ...prev,
                    pickupNotes: e.target.value
                  }))}
                />
              </div>

              <Button
                onClick={handlePickupConfirmation}
                disabled={loading || !validationData.pickupPhoto}
                className="w-full"
                size="lg"
              >
                {loading ? 'Confirmation...' : 'Confirmer la récupération'}
              </Button>
            </div>
          </div>
        );

      case 'validate':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Colis récupéré avec succès</h3>
              <p className="text-muted-foreground">
                Direction: {orderData.delivery_location}
              </p>
            </div>

            <Button
              onClick={() => setCurrentStep('arrive')}
              className="w-full"
              size="lg"
            >
              Démarrer la livraison
            </Button>
          </div>
        );

      case 'arrive':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Arrivée à destination</h3>
              <p className="text-muted-foreground">
                {orderData.delivery_location}
              </p>
            </div>

            <Button
              onClick={handleArrivalConfirmation}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Confirmation...' : 'Confirmer l\'arrivée'}
            </Button>
          </div>
        );

      case 'deliver':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Signature className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Finaliser la livraison</h3>
              <p className="text-muted-foreground">
                Confirmez la remise du colis au destinataire
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Nom du destinataire (obligatoire)</Label>
                <Input
                  placeholder="Nom de la personne qui reçoit"
                  value={validationData.recipientName}
                  onChange={(e) => setValidationData(prev => ({
                    ...prev,
                    recipientName: e.target.value
                  }))}
                />
              </div>

              <div>
                <Label>Photo de preuve de livraison (obligatoire)</Label>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePhotoCapture('delivery')}
                    className="w-full h-24 flex flex-col gap-2"
                  >
                    <Camera className="h-6 w-6" />
                    {validationData.deliveryPhoto ? 'Photo prise ✓' : 'Prendre une photo'}
                  </Button>
                  <input
                    ref={deliveryPhotoRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handlePhotoChange(e, 'delivery')}
                  />
                </div>
              </div>

              <div>
                <Label>Notes de livraison (optionnel)</Label>
                <Textarea
                  placeholder="Observations sur la livraison..."
                  value={validationData.deliveryNotes}
                  onChange={(e) => setValidationData(prev => ({
                    ...prev,
                    deliveryNotes: e.target.value
                  }))}
                />
              </div>

              <Button
                onClick={handleDeliveryCompletion}
                disabled={loading || !validationData.deliveryPhoto || !validationData.recipientName}
                className="w-full"
                size="lg"
              >
                {loading ? 'Finalisation...' : 'Finaliser la livraison'}
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Livraison terminée !</h3>
              <p className="text-muted-foreground">
                Le colis a été livré avec succès à {validationData.recipientName}
              </p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Merci pour votre service. Le client sera notifié de la livraison.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Livraison #{orderId.slice(-8)}</span>
          <Badge variant="outline">{orderData.delivery_type}</Badge>
        </CardTitle>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={getProgress()} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === getCurrentStepIndex();
              const isCompleted = index < getCurrentStepIndex();
              
              return (
                <div key={step.key} className="flex flex-col items-center gap-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-primary text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <StepIcon className="h-3 w-3" />
                  </div>
                  <span className={`text-xs ${isActive ? 'text-primary' : ''}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Order Summary */}
        <div className="mb-6 p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">De:</span>
            <span className="text-muted-foreground">{orderData.pickup_location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Vers:</span>
            <span className="text-muted-foreground">{orderData.delivery_location}</span>
          </div>
          {orderData.recipient_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Destinataire:</span>
              <span className="text-muted-foreground">{orderData.recipient_name}</span>
            </div>
          )}
          {orderData.recipient_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Contact:</span>
              <span className="text-muted-foreground">{orderData.recipient_phone}</span>
            </div>
          )}
        </div>

        {renderStepContent()}
      </CardContent>
    </Card>
  );
}