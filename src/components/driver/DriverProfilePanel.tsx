import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Car,
  Camera,
  Star,
  TrendingUp,
  Shield,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Save
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DriverProfileData {
  // Profil personnel
  display_name: string;
  phone_number: string;
  email: string;
  profile_photo_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  
  // Profil chauffeur
  license_number: string;
  license_expiry: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_plate: string;
  vehicle_color: string;
  vehicle_class: string;
  insurance_number: string;
  insurance_expiry: string;
  
  // Statistiques
  rating_average: number;
  total_rides: number;
  verification_status: string;
  is_active: boolean;
  service_areas: string[];
}

export const DriverProfilePanel: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DriverProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Charger le profil complet
  useEffect(() => {
    const loadFullProfile = async () => {
      if (!user) return;

      try {
        // Charger depuis chauffeurs et driver_profiles
        const [chauffeurRes, profileRes] = await Promise.all([
          supabase
            .from('chauffeurs')
            .select('*')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('driver_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()
        ]);

        const chauffeurData = chauffeurRes.data;
        const profileData = profileRes.data;

        if (chauffeurData || profileData) {
          setProfile({
            // Données personnelles (chauffeurs table)
            display_name: chauffeurData?.display_name || user.user_metadata?.display_name || '',
            phone_number: chauffeurData?.phone_number || '',
            email: chauffeurData?.email || user.email || '',
            emergency_contact_name: chauffeurData?.emergency_contact_name || '',
            emergency_contact_phone: chauffeurData?.emergency_contact_phone || '',
            
            // Données professionnelles (driver_profiles)
            license_number: profileData?.license_number || chauffeurData?.license_number || '',
            license_expiry: profileData?.license_expiry || chauffeurData?.license_expiry || '',
            vehicle_make: profileData?.vehicle_make || '',
            vehicle_model: profileData?.vehicle_model || chauffeurData?.vehicle_model || '',
            vehicle_year: profileData?.vehicle_year || chauffeurData?.vehicle_year || new Date().getFullYear(),
            vehicle_plate: profileData?.vehicle_plate || chauffeurData?.vehicle_plate || '',
            vehicle_color: profileData?.vehicle_color || chauffeurData?.vehicle_color || '',
            vehicle_class: profileData?.vehicle_class || 'standard',
            insurance_number: profileData?.insurance_number || chauffeurData?.insurance_number || '',
            insurance_expiry: profileData?.insurance_expiry || chauffeurData?.insurance_expiry || '',
            profile_photo_url: profileData?.profile_photo_url || '',
            
            // Statistiques
            rating_average: profileData?.rating_average || chauffeurData?.rating_average || 0,
            total_rides: profileData?.total_rides || chauffeurData?.total_rides || 0,
            verification_status: profileData?.verification_status || chauffeurData?.verification_status || 'pending',
            is_active: profileData?.is_active || chauffeurData?.is_active || false,
            service_areas: chauffeurData?.service_areas || ['Kinshasa']
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    loadFullProfile();
  }, [user]);

  // Sauvegarder le profil
  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      // Mettre à jour chauffeurs
      const { error: chauffeurError } = await supabase
        .from('chauffeurs')
        .upsert({
          user_id: user.id,
          display_name: profile.display_name,
          phone_number: profile.phone_number,
          email: profile.email,
          emergency_contact_name: profile.emergency_contact_name,
          emergency_contact_phone: profile.emergency_contact_phone,
          license_number: profile.license_number,
          license_expiry: profile.license_expiry,
          vehicle_model: profile.vehicle_model,
          vehicle_year: profile.vehicle_year,
          vehicle_plate: profile.vehicle_plate,
          vehicle_color: profile.vehicle_color,
          insurance_number: profile.insurance_number,
          insurance_expiry: profile.insurance_expiry,
          service_areas: profile.service_areas,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      // Mettre à jour driver_profiles
      const { error: profileError } = await supabase
        .from('driver_profiles')
        .upsert({
          user_id: user.id,
          license_number: profile.license_number,
          license_expiry: profile.license_expiry,
          vehicle_make: profile.vehicle_make,
          vehicle_model: profile.vehicle_model,
          vehicle_year: profile.vehicle_year,
          vehicle_plate: profile.vehicle_plate,
          vehicle_color: profile.vehicle_color,
          vehicle_class: profile.vehicle_class,
          insurance_number: profile.insurance_number,
          insurance_expiry: profile.insurance_expiry,
          profile_photo_url: profile.profile_photo_url,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (chauffeurError || profileError) {
        throw chauffeurError || profileError;
      }

      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-700 border-green-200">✓ Vérifié</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">En attente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">Non vérifié</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="h-20 w-20 bg-muted rounded-full mx-auto animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded mx-auto animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded mx-auto animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Profil non trouvé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête du profil */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarImage src={profile.profile_photo_url} />
                <AvatarFallback className="text-xl">
                  {profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                {getVerificationBadge(profile.verification_status)}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{profile.rating_average.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{profile.total_rides} courses</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>Tembea Pro</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de profil */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du profil</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personnel
              </TabsTrigger>
              <TabsTrigger value="vehicle" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Véhicule
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Informations personnelles */}
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Nom complet</Label>
                  <Input
                    id="display_name"
                    value={profile.display_name}
                    onChange={(e) => setProfile(prev => prev ? {...prev, display_name: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Téléphone</Label>
                  <Input
                    id="phone_number"
                    value={profile.phone_number}
                    onChange={(e) => setProfile(prev => prev ? {...prev, phone_number: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => prev ? {...prev, email: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Contact d'urgence (nom)</Label>
                  <Input
                    id="emergency_contact_name"
                    value={profile.emergency_contact_name || ''}
                    onChange={(e) => setProfile(prev => prev ? {...prev, emergency_contact_name: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Contact d'urgence (téléphone)</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={profile.emergency_contact_phone || ''}
                    onChange={(e) => setProfile(prev => prev ? {...prev, emergency_contact_phone: e.target.value} : null)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Informations véhicule */}
            <TabsContent value="vehicle" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_make">Marque</Label>
                  <Input
                    id="vehicle_make"
                    value={profile.vehicle_make}
                    onChange={(e) => setProfile(prev => prev ? {...prev, vehicle_make: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_model">Modèle</Label>
                  <Input
                    id="vehicle_model"
                    value={profile.vehicle_model}
                    onChange={(e) => setProfile(prev => prev ? {...prev, vehicle_model: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_year">Année</Label>
                  <Input
                    id="vehicle_year"
                    type="number"
                    value={profile.vehicle_year}
                    onChange={(e) => setProfile(prev => prev ? {...prev, vehicle_year: parseInt(e.target.value)} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_plate">Plaque d'immatriculation</Label>
                  <Input
                    id="vehicle_plate"
                    value={profile.vehicle_plate}
                    onChange={(e) => setProfile(prev => prev ? {...prev, vehicle_plate: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_color">Couleur</Label>
                  <Input
                    id="vehicle_color"
                    value={profile.vehicle_color}
                    onChange={(e) => setProfile(prev => prev ? {...prev, vehicle_color: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_class">Classe de véhicule</Label>
                  <select
                    id="vehicle_class"
                    className="w-full px-3 py-2 border border-input rounded-md"
                    value={profile.vehicle_class}
                    onChange={(e) => setProfile(prev => prev ? {...prev, vehicle_class: e.target.value} : null)}
                  >
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="luxury">Luxe</option>
                    <option value="economy">Économique</option>
                  </select>
                </div>
              </div>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_number">Numéro de permis</Label>
                  <Input
                    id="license_number"
                    value={profile.license_number}
                    onChange={(e) => setProfile(prev => prev ? {...prev, license_number: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_expiry">Expiration permis</Label>
                  <Input
                    id="license_expiry"
                    type="date"
                    value={profile.license_expiry}
                    onChange={(e) => setProfile(prev => prev ? {...prev, license_expiry: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance_number">Numéro d'assurance</Label>
                  <Input
                    id="insurance_number"
                    value={profile.insurance_number}
                    onChange={(e) => setProfile(prev => prev ? {...prev, insurance_number: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance_expiry">Expiration assurance</Label>
                  <Input
                    id="insurance_expiry"
                    type="date"
                    value={profile.insurance_expiry}
                    onChange={(e) => setProfile(prev => prev ? {...prev, insurance_expiry: e.target.value} : null)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end pt-6 border-t">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverProfilePanel;