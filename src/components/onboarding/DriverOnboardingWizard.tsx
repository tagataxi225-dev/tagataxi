import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, Camera, FileText, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DriverDocuments {
  licensePhoto?: File;
  vehicleFrontPhoto?: File;
  vehicleBackPhoto?: File;
  vehicleInteriorPhoto?: File;
  insuranceDocument?: File;
}

export const DriverOnboardingWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<DriverDocuments>({});
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const uploadDocument = async (file: File, category: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const fileName = `${user.id}/${category}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('driver-documents')
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('driver-documents')
        .getPublicUrl(data.path);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docType: keyof DriverDocuments) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocuments({ ...documents, [docType]: file });
    }
  };

  const handleStepSubmit = async () => {
    setUploading(true);
    
    try {
      switch (step) {
        case 1: // License upload
          if (!documents.licensePhoto) {
            toast.error('Veuillez télécharger une photo de votre permis de conduire');
            return;
          }
          const licenseUrl = await uploadDocument(documents.licensePhoto, 'license');
          if (licenseUrl) {
            await supabase
              .from('chauffeurs')
              .update({ documents: { license_url: licenseUrl } })
              .eq('user_id', user?.id);
            toast.success('Permis de conduire enregistré');
          }
          break;
          
        case 2: // Vehicle photos
          if (!documents.vehicleFrontPhoto || !documents.vehicleBackPhoto) {
            toast.error('Veuillez télécharger au moins 2 photos du véhicule (avant et arrière)');
            return;
          }
          const frontUrl = await uploadDocument(documents.vehicleFrontPhoto, 'vehicle');
          const backUrl = await uploadDocument(documents.vehicleBackPhoto, 'vehicle');
          const interiorUrl = documents.vehicleInteriorPhoto 
            ? await uploadDocument(documents.vehicleInteriorPhoto, 'vehicle')
            : null;
          
          await supabase
            .from('chauffeurs')
            .update({ 
              vehicle_photo_url: frontUrl,
              documents: { 
                vehicle_front: frontUrl, 
                vehicle_back: backUrl,
                vehicle_interior: interiorUrl 
              }
            })
            .eq('user_id', user?.id);
          toast.success('Photos du véhicule enregistrées');
          break;
          
        case 3: // Insurance
          if (!documents.insuranceDocument) {
            toast.error('Veuillez télécharger votre attestation d\'assurance');
            return;
          }
          const insuranceUrl = await uploadDocument(documents.insuranceDocument, 'insurance');
          if (insuranceUrl) {
            await supabase
              .from('chauffeurs')
              .update({ documents: { insurance_url: insuranceUrl } })
              .eq('user_id', user?.id);
            toast.success('Assurance enregistrée');
          }
          break;
          
        case 4: // Phone verification (simplified)
          if (!phoneNumber || phoneNumber.length < 10) {
            toast.error('Numéro de téléphone invalide');
            return;
          }
          await supabase
            .from('chauffeurs')
            .update({ phone_number: phoneNumber, verification_status: 'pending' })
            .eq('user_id', user?.id);
          
          toast.success(
            'Profil complet ! Votre compte sera vérifié sous 24-48h',
            { description: 'Vous recevrez une notification dès activation' }
          );
          navigate('/driver');
          return;
      }
      
      setStep(step + 1);
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Configuration Chauffeur</CardTitle>
          <Progress value={progress} className="mt-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Étape {step} sur {totalSteps}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Étape 1: Permis de conduire */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Permis de conduire</h3>
                <p className="text-sm text-muted-foreground">
                  Téléchargez une photo claire de votre permis de conduire valide
                </p>
              </div>
              
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'licensePhoto')}
                  className="hidden"
                  id="license-upload"
                />
                <Label htmlFor="license-upload" className="cursor-pointer">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {documents.licensePhoto ? documents.licensePhoto.name : 'Cliquez pour télécharger'}
                  </p>
                </Label>
              </div>
            </div>
          )}

          {/* Étape 2: Photos véhicule */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <Camera className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Photos du véhicule</h3>
                <p className="text-sm text-muted-foreground">
                  Téléchargez des photos claires de votre véhicule
                </p>
              </div>
              
              <div className="space-y-3">
                {['vehicleFrontPhoto', 'vehicleBackPhoto', 'vehicleInteriorPhoto'].map((key, index) => (
                  <div key={key} className="border rounded-lg p-3">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, key as keyof DriverDocuments)}
                      className="hidden"
                      id={`vehicle-${key}`}
                    />
                    <Label htmlFor={`vehicle-${key}`} className="cursor-pointer flex items-center justify-between">
                      <span className="text-sm">
                        {index === 0 && 'Vue avant'}
                        {index === 1 && 'Vue arrière'}
                        {index === 2 && 'Intérieur (optionnel)'}
                      </span>
                      {documents[key as keyof DriverDocuments] ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Upload className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Étape 3: Assurance */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Attestation d'assurance</h3>
                <p className="text-sm text-muted-foreground">
                  Téléchargez votre attestation d'assurance valide
                </p>
              </div>
              
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileSelect(e, 'insuranceDocument')}
                  className="hidden"
                  id="insurance-upload"
                />
                <Label htmlFor="insurance-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {documents.insuranceDocument ? documents.insuranceDocument.name : 'Cliquez pour télécharger'}
                  </p>
                </Label>
              </div>
            </div>
          )}

          {/* Étape 4: Vérification téléphone */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <Phone className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Vérification téléphone</h3>
                <p className="text-sm text-muted-foreground">
                  Confirmez votre numéro de téléphone
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+243 XX XXX XXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Retour
              </Button>
            )}
            <Button 
              className="flex-1" 
              onClick={handleStepSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : step === totalSteps ? (
                'Terminer'
              ) : (
                'Continuer'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
