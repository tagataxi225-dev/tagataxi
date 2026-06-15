import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, ArrowLeft, Store, MapPin, Sparkles, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SUPPORTED_CITIES } from '@/constants/cities';
import { RestaurantImageSettings } from '@/components/restaurant/RestaurantImageSettings';

interface RestaurantProfile {
  id: string;
  user_id: string;
  restaurant_name: string;
  phone_number: string;
  email: string;
  address: string;
  city: string;
  quartier: string | null;
  logo_url: string | null;
  banner_url: string | null;
  minimum_order_amount: number;
  verification_status: string;
  description: string | null;
}

export default function RestaurantProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/restaurant/auth');
        return;
      }

      const { data, error } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le profil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('restaurant_profiles')
        .update({
          restaurant_name: profile.restaurant_name,
          phone_number: profile.phone_number,
          email: profile.email,
          address: profile.address,
          city: profile.city,
          quartier: profile.quartier,
          description: profile.description,
          minimum_order_amount: profile.minimum_order_amount,
        })
        .eq('id', profile.id);

      if (error) throw error;

      // ✅ FORCER LE RECHARGEMENT
      await loadProfile();

      toast({
        title: '✅ Profil mis à jour',
        description: 'Vos modifications ont été enregistrées avec succès',
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/restaurant')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Mon Profil Restaurant</h1>
            <p className="text-muted-foreground">Gérez les informations de votre restaurant</p>
          </div>
          <Badge variant={profile.verification_status === 'verified' ? 'default' : 'secondary'}>
            {profile.verification_status === 'verified' ? '✓ Vérifié' : 'En attente'}
          </Badge>
        </div>

        {/* Alerte vérification */}
        {profile.verification_status === 'pending' && (
          <Alert>
            <AlertDescription>
              Votre restaurant est en attente de vérification. Un administrateur validera votre profil sous peu.
            </AlertDescription>
          </Alert>
        )}

        {/* Section Informations Générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restaurant_name">Nom du restaurant *</Label>
                <Input
                  id="restaurant_name"
                  value={profile.restaurant_name}
                  onChange={(e) => setProfile({ ...profile, restaurant_name: e.target.value })}
                  placeholder="Ex: Chez Maman Pauline"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone_number}
                  onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                  placeholder="+243 XX XXX XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email de contact</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="contact@restaurant.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Select 
                  value={profile.city} 
                  onValueChange={(value) => setProfile({ ...profile, city: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CITIES.map(city => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète *</Label>
              <Textarea
                id="address"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Ex: Avenue des Aviateurs, Gombe"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description du restaurant</Label>
              <Textarea
                id="description"
                value={profile.description || ''}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                placeholder="Décrivez votre restaurant, vos spécialités..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Images */}
        <Alert className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            💡 <strong>Conseil :</strong> Vos images (logo et bannière) apparaissent dans Tembea Food. 
            Modifiez-les ici pour mettre à jour votre vitrine instantanément !
          </AlertDescription>
        </Alert>
        
        <RestaurantImageSettings onImageUpdate={loadProfile} />
        
        {/* Bouton Preview Tembea Food */}
        <Card className="bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  🍽️ Aperçu dans Tembea Food
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Visualisez comment votre restaurant apparaît aux clients
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => window.open(`/food?restaurant=${profile.id}`, '_blank')}
                className="w-full sm:w-auto shadow-sm hover:shadow-md transition-shadow"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir ma vitrine
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section Livraison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Configuration de livraison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="min_order">Montant minimum de commande (CDF)</Label>
              <Input
                id="min_order"
                type="number"
                value={profile.minimum_order_amount}
                onChange={(e) => setProfile({ ...profile, minimum_order_amount: parseInt(e.target.value) || 0 })}
                placeholder="5000"
                min="0"
                step="1000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
