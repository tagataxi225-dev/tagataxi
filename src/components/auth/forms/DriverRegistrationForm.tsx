import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { logger } from '@/utils/logger';

interface DriverRegistrationFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const DriverRegistrationForm = ({ onSuccess, onBack }: DriverRegistrationFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phoneNumber: '',
    licenseNumber: '',
    licenseExpiry: '',
    vehicleType: '',
    vehiclePlate: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    bankAccountNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    deliveryCapacity: ''
  });

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
    
  //   if (formData.password !== formData.confirmPassword) {
  //     toast({
  //       title: "Erreur",
  //       description: "Les mots de passe ne correspondent pas",
  //       variant: "destructive"
  //     });
  //     return;
  //   }

  //   if (formData.password.length < 6) {
  //     toast({
  //       title: "Erreur",
  //       description: "Le mot de passe doit contenir au moins 6 caractères",
  //       variant: "destructive"
  //     });
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     // Créer le compte utilisateur
  //     const { data: authData, error: authError } = await supabase.auth.signUp({
  //       email: formData.email,
  //       password: formData.password,
  //       options: {
  //         emailRedirectTo: `${window.location.origin}/`,
  //         data: {
  //           display_name: formData.displayName,
  //           role: 'chauffeur'
  //         }
  //       }
  //     });

  //     if (authError) {
  //       throw authError;
  //     }

  //     if (authData.user) {
  //       // Créer le profil chauffeur
  //       const { error: profileError } = await supabase
  //         .from('chauffeurs')
  //         .insert({
  //           user_id: authData.user.id,
  //           display_name: formData.displayName,
  //           phone_number: formData.phoneNumber,
  //           email: formData.email,
  //           license_number: formData.licenseNumber,
  //           license_expiry: formData.licenseExpiry,
  //           vehicle_type: formData.vehicleType,
  //           vehicle_plate: formData.vehiclePlate,
  //           vehicle_model: formData.vehicleModel,
  //           vehicle_year: parseInt(formData.vehicleYear),
  //           vehicle_color: formData.vehicleColor,
  //           insurance_number: formData.insuranceNumber,
  //           insurance_expiry: formData.insuranceExpiry,
  //           bank_account_number: formData.bankAccountNumber || null,
  //           emergency_contact_name: formData.emergencyContactName || null,
  //           emergency_contact_phone: formData.emergencyContactPhone || null,
  //           verification_status: 'pending',
  //           is_active: false
  //         });

  //       if (profileError) {
  //         throw profileError;
  //       }

  //       toast({
  //         title: "Succès !",
  //         description: "Votre demande de chauffeur a été soumise. Vous serez contacté pour la vérification.",
  //       });

  //       onSuccess();
  //     }
  //   } catch (error: any) {
  //     console.error('Registration error:', error);
  //     toast({
  //       title: "Erreur",
  //       description: error.message || "Une erreur est survenue lors de l'inscription",
  //       variant: "destructive"
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    toast({
      title: "Erreur",
      description: "Les mots de passe ne correspondent pas",
      variant: "destructive"
    });
    return;
  }

  if (formData.password.length < 6) {
    toast({
      title: "Erreur",
      description: "Le mot de passe doit contenir au moins 6 caractères",
      variant: "destructive"
    });
    return;
  }

  setLoading(true);
  logger.info("Driver registration payload", formData);
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `https://tagago.app/`,
        data: {
          role: "chauffeur",
          display_name: formData.displayName,
          phone_number: formData.phoneNumber,
          license_number: formData.licenseNumber,
          license_expiry: formData.licenseExpiry,
          ...(formData.vehicleType && { vehicle_type: formData.vehicleType }),
          ...(formData.vehiclePlate && { vehicle_plate: formData.vehiclePlate }),
          ...(formData.vehicleModel && { vehicle_model: formData.vehicleModel }),
          ...(formData.vehicleYear && { vehicle_year: formData.vehicleYear }),
          ...(formData.vehicleColor && { vehicle_color: formData.vehicleColor }),
          ...(formData.insuranceNumber && { insurance_number: formData.insuranceNumber }),
          ...(formData.insuranceExpiry && { insurance_expiry: formData.insuranceExpiry }),
          ...(formData.bankAccountNumber && { bank_account_number: formData.bankAccountNumber }),
          ...(formData.emergencyContactName && { emergency_contact_name: formData.emergencyContactName }),
          ...(formData.emergencyContactPhone && { emergency_contact_phone: formData.emergencyContactPhone }),
          ...(formData.deliveryCapacity && { delivery_capacity: formData.deliveryCapacity }),
        }
      }
    });

    if (authError) {
      throw authError;
    }

    if (authData.user) {
      toast({
        title: "Succès !",
        description: "Votre demande de chauffeur a été soumise. Vous serez contacté pour la vérification.",
      });
      onSuccess();
    }
  } catch (error: any) {
    logger.error("Driver registration error", error);
    const friendlyMessage = error.message?.toLowerCase().includes('weak')
      ? "Le mot de passe est trop simple. Utilisez au moins 8 caractères avec des lettres et des chiffres."
      : error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('user already registered')
      ? "Cette adresse email est déjà utilisée. Connectez-vous ou utilisez une autre adresse."
      : error.message || "Une erreur est survenue lors de l'inscription";
    toast({
      title: "Erreur",
      description: friendlyMessage,
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Inscription Chauffeur</CardTitle>
          <CardDescription>
            Rejoignez notre équipe de chauffeurs partenaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Téléphone *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Nom complet *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Informations du permis */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Permis de conduire</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Numéro de permis *</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseExpiry">Date d'expiration *</Label>
                  <Input
                    id="licenseExpiry"
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Informations du véhicule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Véhicule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Type de véhicule</Label>
                  <Select value={formData.vehicleType} onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="taxi">Taxi</SelectItem>
                      <SelectItem value="moto">Moto</SelectItem>
                      <SelectItem value="camionnette">Camionnette</SelectItem>
                      <SelectItem value="truck">Camion</SelectItem>
                      <SelectItem value="voiture">Voiture personnelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehiclePlate">Plaque d'immatriculation</Label>
                  <Input
                    id="vehiclePlate"
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleModel">Modèle</Label>
                  <Input
                    id="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleYear">Année</Label>
                  <Input
                    id="vehicleYear"
                    type="number"
                    min="1990"
                    max="2025"
                    value={formData.vehicleYear}
                    onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleColor">Couleur</Label>
                  <Input
                    id="vehicleColor"
                    value={formData.vehicleColor}
                    onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                  />
                </div>
              </div>
              
              {/* Capacité de livraison */}
              <div className="space-y-2">
                <Label htmlFor="deliveryCapacity">Capacité de livraison</Label>
                <Select value={formData.deliveryCapacity} onValueChange={(value) => setFormData({ ...formData, deliveryCapacity: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner votre capacité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flash">
                      <div className="flex flex-col">
                        <span className="font-medium">Flash (Moto)</span>
                        <span className="text-xs text-muted-foreground">Colis de 1 à 5 kg</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="flex">
                      <div className="flex flex-col">
                        <span className="font-medium">Flex (Camionnette)</span>
                        <span className="text-xs text-muted-foreground">Colis de 6 à 50 kg</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="maxicharge">
                      <div className="flex flex-col">
                        <span className="font-medium">MaxiCharge (Camion)</span>
                        <span className="text-xs text-muted-foreground">Colis de plus de 50 kg</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assurance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Assurance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insuranceNumber">Numéro d'assurance</Label>
                  <Input
                    id="insuranceNumber"
                    value={formData.insuranceNumber}
                    onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insuranceExpiry">Date d'expiration assurance</Label>
                  <Input
                    id="insuranceExpiry"
                    type="date"
                    value={formData.insuranceExpiry}
                    onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations supplémentaires</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Compte bancaire</Label>
                  <Input
                    id="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Contact d'urgence (nom)</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Contact d'urgence (téléphone)</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                Retour
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Soumettre ma candidature
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};