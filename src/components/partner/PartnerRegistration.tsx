import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Building2, Mail, Phone, MapPin, FileText, CreditCard, Lock } from 'lucide-react';
import { usePartnerRegistrationSecure, PartnerRegistrationData } from '@/hooks/usePartnerRegistrationSecure';

const PartnerRegistration = () => {
  const navigate = useNavigate();
  const { registerPartner, loading } = usePartnerRegistrationSecure();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PartnerRegistrationData>({
    company_name: '',
    contact_email: '',
    phone: '',
    address: '',
    business_type: 'individual',
    service_areas: ['Kinshasa'],
    tax_number: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < 2) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    // Validation des champs requis
    if (!formData.company_name || !formData.contact_email || !formData.phone || !formData.password) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const result = await registerPartner(formData);
    if (result.success) {
      navigate('/partner/auth');
    }
  };

  const handleChange = (field: keyof PartnerRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
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

        <div>
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Mot de passe *
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="Minimum 6 caractères"
            required
            minLength={6}
          />
        </div>

        <div>
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Adresse
          </Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Adresse complète de votre entreprise"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="business_type">Type d'entreprise</Label>
        <Select value={formData.business_type} onValueChange={(value: any) => handleChange('business_type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez votre type d'entreprise" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Individuel</SelectItem>
            <SelectItem value="company">Entreprise</SelectItem>
            <SelectItem value="cooperative">Coopérative</SelectItem>
            <SelectItem value="association">Association</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="tax_number" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Numéro fiscal (NIF/RCCM)
        </Label>
        <Input
          id="tax_number"
          value={formData.tax_number}
          onChange={(e) => handleChange('tax_number', e.target.value)}
          placeholder="Ex: NIF A1234567X ou RCCM CD/KIN/12345"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Optionnel mais recommandé pour accélérer la validation
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Zones de service</h4>
        <Badge variant="secondary" className="mb-2">Kinshasa</Badge>
        <p className="text-xs text-blue-600">
          Zones de service supplémentaires peuvent être ajoutées après validation
        </p>
      </div>
    </div>
  );

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
            {/* Indicateur d'étapes */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  1
                </div>
                <div className={`w-12 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  2
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {currentStep === 1 && (
                <>
                  <h3 className="text-lg font-semibold mb-4">Informations générales</h3>
                  {renderStep1()}
                  <div className="flex justify-end mt-6">
                    <Button 
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!formData.company_name || !formData.contact_email || !formData.phone || !formData.password}
                    >
                      Suivant
                    </Button>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <h3 className="text-lg font-semibold mb-4">Détails de l'entreprise</h3>
                  {renderStep2()}
                  <div className="flex justify-between mt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                    >
                      Précédent
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Inscription en cours...' : 'Créer le compte partenaire'}
                    </Button>
                  </div>
                </>
              )}
            </form>

            {/* Info section */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Après inscription:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Votre demande sera examinée par nos équipes</li>
                <li>• Vous recevrez une réponse sous 24-48h</li>
                <li>• Une fois validé, vous aurez accès à votre espace partenaire</li>
                <li>• Support et formation seront fournis</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/partner/auth')}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Déjà partenaire ? Se connecter
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/auth')}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegistration;