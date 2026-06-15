import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchOptimizedButton } from '@/components/ui/touch-optimized';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';

interface VendorVerificationFlowProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const VendorVerificationFlow = ({ onSuccess, onCancel }: VendorVerificationFlowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: 'individual',
    id_document_url: '',
    proof_of_address_url: '',
    company_registration_number: '',
    tax_identification_number: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_name: '',
    mobile_money_provider: '',
    mobile_money_number: ''
  });

  const handleFileUpload = async (file: File, field: string) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour uploader des documents",
        variant: "destructive"
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      // ✅ CORRECTION: Utiliser user.id au lieu de field pour éviter erreur RLS
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-documents')
        .upload(filePath, file, {
          upsert: true // ✅ Permettre le remplacement si le fichier existe
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-documents')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, [field]: publicUrl }));
      
      toast({
        title: "Document téléchargé",
        description: "Le fichier a été téléchargé avec succès"
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: "Erreur d'upload",
        description: error.message || "Impossible de télécharger le fichier",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vendor-verify-request', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "✅ Demande soumise",
        description: "Votre demande de vérification a été envoyée. Vous recevrez une réponse sous 24-48h."
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step === 1 && "📋 Informations commerciales"}
            {step === 2 && "📄 Documents requis"}
            {step === 3 && "💳 Informations de paiement"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Nom de l'entreprise *</Label>
                <Input
                  value={formData.business_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="Ex: Boutique Kinshasa"
                />
              </div>

              <div className="space-y-2">
                <Label>Type d'entreprise *</Label>
                <Select
                  value={formData.business_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, business_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individuel</SelectItem>
                    <SelectItem value="company">Société</SelectItem>
                    <SelectItem value="cooperative">Coopérative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Numéro d'enregistrement (optionnel)</Label>
                <Input
                  value={formData.company_registration_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_registration_number: e.target.value }))}
                  placeholder="RCCM ou équivalent"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Pièce d'identité *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'id_document_url')}
                  />
                  {formData.id_document_url && <CheckCircle className="text-green-500" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Carte d'identité, passeport ou permis de conduire
                </p>
              </div>

              <div className="space-y-2">
                <Label>Justificatif de domicile *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'proof_of_address_url')}
                  />
                  {formData.proof_of_address_url && <CheckCircle className="text-green-500" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Facture d'électricité, eau ou attestation de résidence
                </p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Mobile Money (recommandé)</Label>
                <Select
                  value={formData.mobile_money_provider}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, mobile_money_provider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un opérateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orange_money">Orange Money</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="airtel_money">Airtel Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Numéro Mobile Money</Label>
                <Input
                  value={formData.mobile_money_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile_money_number: e.target.value }))}
                  placeholder="+243..."
                />
              </div>

              <div className="space-y-2">
                <Label>Compte bancaire (optionnel)</Label>
                <Input
                  value={formData.bank_account_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_account_name: e.target.value }))}
                  placeholder="Nom sur le compte"
                />
              </div>

              <div className="space-y-2">
                <Input
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
                  placeholder="Numéro de compte"
                />
              </div>

              <div className="space-y-2">
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                  placeholder="Nom de la banque"
                />
              </div>
            </>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <TouchOptimizedButton
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                Précédent
              </TouchOptimizedButton>
            )}
            
            {step < 3 ? (
              <TouchOptimizedButton
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !formData.business_name) ||
                  (step === 2 && (!formData.id_document_url || !formData.proof_of_address_url))
                }
                className="ml-auto"
              >
                Suivant
              </TouchOptimizedButton>
            ) : (
              <TouchOptimizedButton
                onClick={handleSubmit}
                disabled={loading || !formData.mobile_money_number}
                className="ml-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  'Soumettre la demande'
                )}
              </TouchOptimizedButton>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
