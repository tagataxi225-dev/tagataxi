import React, { useState } from 'react';
import { LegalAcceptanceCheckbox } from '@/components/shared/LegalAcceptanceCheckbox';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Building2, Mail, Phone, MapPin, FileText, CreditCard, Upload, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const PublicPartnerRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [applicationId, setApplicationId] = useState<string>('');
  
  const [legalSheet, setLegalSheet] = useState<'terms' | 'privacy' | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    phone: '',
    address: '',
    business_type: 'individual',
    service_areas: ['Kinshasa'],
    business_license: '',
    tax_number: '',
    commission_rate: 15.00,
    password: '',
    confirm_password: '',
    accept_terms: false,
    documents: [] as File[]
  });

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.company_name && formData.contact_email && formData.phone);
      case 2:
        return !!(formData.business_type && formData.address);
      case 3:
        return !!(formData.password && formData.confirm_password && 
                 formData.password === formData.confirm_password && 
                 formData.accept_terms);
      default:
        return false;
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setFormData(prev => ({ ...prev, documents: [...prev.documents, ...fileArray] }));
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Créer le compte utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.contact_email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/partner/auth`,
          data: {
            display_name: formData.company_name,
            phone: formData.phone,
            role: 'partner'
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte');
      }

      // 2. Créer le profil partenaire
      const { data: partnerData, error: partnerError } = await supabase
        .from('partenaires')
        .insert([{
          user_id: authData.user.id,
          display_name: formData.company_name,
          phone_number: formData.phone,
          email: formData.contact_email,
          address: formData.address,
          business_type: formData.business_type,
          company_name: formData.company_name,
          commission_rate: formData.commission_rate,
          verification_status: 'pending',
          is_active: false,
          service_areas: formData.service_areas,
          business_license: formData.business_license,
          tax_number: formData.tax_number
        }])
        .select()
        .single();

      if (partnerError) throw partnerError;

      // 3. Upload des documents si fournis
      if (formData.documents.length > 0) {
        for (const doc of formData.documents) {
          const fileExt = doc.name.split('.').pop();
          const fileName = `${authData.user.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('partner-documents')
            .upload(fileName, doc);

          if (uploadError) {
            console.error('Erreur upload document:', uploadError);
          }
        }
      }

      setApplicationId(partnerData.id);
      setRegistrationStatus('success');
      
      toast.success('Demande de partenariat envoyée avec succès!');

    } catch (error: any) {
      console.error('Erreur inscription partenaire:', error);
      setRegistrationStatus('error');
      toast.error(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (registrationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card className="shadow-xl border-0">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Demande envoyée avec succès!</h2>
              <p className="text-gray-600 mb-6">
                Votre demande de partenariat a été reçue et est en cours d'examen.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm font-medium text-blue-900">Numéro de référence:</p>
                <p className="text-blue-700 font-mono">{applicationId}</p>
              </div>

              <Alert className="mb-6">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Nous examinerons votre dossier sous 24-48h. Vous recevrez un email de confirmation
                  à {formData.contact_email} avec les prochaines étapes.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: "Informations générales", icon: Building2 },
    { id: 2, title: "Détails commerciaux", icon: FileText },
    { id: 3, title: "Compte et validation", icon: CheckCircle2 }
  ];

  const progress = (currentStep / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Devenir Partenaire Tembea</CardTitle>
            <CardDescription className="text-blue-100">
              Rejoignez notre réseau de partenaires et développez votre activité
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                {steps.map((step) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <step.icon className={`h-5 w-5 mb-1 ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={currentStep >= step.id ? 'text-blue-600 font-medium' : ''}>{step.title}</span>
                  </div>
                ))}
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Informations générales */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Informations générales</h3>
                  
                  <div>
                    <Label htmlFor="company_name" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Nom de l'entreprise *
                    </Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      placeholder="Ex: Transport Kinshasa SARL"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email de contact *
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleChange('contact_email', e.target.value)}
                      placeholder="contact@entreprise.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Téléphone *
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+243 900 000 000"
                      required
                    />
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button 
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!validateStep(1)}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Détails commerciaux */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Détails commerciaux</h3>
                  
                  <div>
                    <Label htmlFor="business_type">Type d'activité *</Label>
                    <Select value={formData.business_type} onValueChange={(value) => handleChange('business_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre type d'activité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Entrepreneur individuel</SelectItem>
                        <SelectItem value="company">Société (SARL, SA, etc.)</SelectItem>
                        <SelectItem value="cooperative">Coopérative</SelectItem>
                        <SelectItem value="association">Association</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Adresse complète *
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Adresse complète de votre entreprise"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="business_license" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Numéro de licence d'entreprise
                    </Label>
                    <Input
                      id="business_license"
                      value={formData.business_license}
                      onChange={(e) => handleChange('business_license', e.target.value)}
                      placeholder="Ex: LIC-2024-001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tax_number" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Numéro fiscal (NIF)
                    </Label>
                    <Input
                      id="tax_number"
                      value={formData.tax_number}
                      onChange={(e) => handleChange('tax_number', e.target.value)}
                      placeholder="Ex: A0000000000000X"
                    />
                  </div>

                  {/* Upload des documents */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Documents justificatifs (optionnel)
                    </Label>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formats acceptés: PDF, JPG, PNG (max 5MB par fichier)
                    </p>
                    
                    {formData.documents.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {formData.documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>{doc.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(index)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                    >
                      Précédent
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      disabled={!validateStep(2)}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Compte et validation */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Création de compte</h3>
                  
                  <div>
                    <Label htmlFor="password">Mot de passe *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Minimum 8 caractères"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirm_password">Confirmer le mot de passe *</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={formData.confirm_password}
                      onChange={(e) => handleChange('confirm_password', e.target.value)}
                      placeholder="Retapez votre mot de passe"
                      required
                    />
                    {formData.password && formData.confirm_password && formData.password !== formData.confirm_password && (
                      <p className="text-sm text-red-600 mt-1">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Commission partenaire</h4>
                    <p className="text-sm text-blue-700">
                      Taux de commission standard: <strong>{formData.commission_rate}%</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Ce taux peut être négocié en fonction du volume d'affaires
                    </p>
                  </div>

                  <LegalAcceptanceCheckbox
                    checked={formData.accept_terms}
                    onCheckedChange={(checked) => handleChange('accept_terms', checked)}
                    accentColor="blue"
                    id="accept_terms"
                  />

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Après soumission, vous recevrez un email de vérification. 
                      Votre demande sera examinée par notre équipe sous 24-48h.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-between mt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                    >
                      Précédent
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading || !validateStep(3)}
                      className="min-w-[140px]"
                    >
                      {loading ? 'Envoi en cours...' : 'Soumettre la demande'}
                    </Button>
                  </div>
                </div>
              )}
            </form>


            {/* Info section */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Avantages partenaire Tembea:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Accès à notre plateforme de gestion complète</li>
                <li>• Support technique 24/7</li>
                <li>• Commissions attractives et négociables</li>
                <li>• Formation et accompagnement personnalisé</li>
                <li>• Visibilité maximale sur notre application</li>
                <li>• Outils d'analyse et de reporting avancés</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicPartnerRegistration;