import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';

interface RestaurantRegistrationFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const RestaurantRegistrationForm = ({ onSuccess, onBack }: RestaurantRegistrationFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    phoneNumber: '',
    city: 'Kinshasa',
    address: '',
    cuisineType: '',
    description: ''
  });

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

    try {
      const redirectUrl = `${window.location.origin}/restaurant/verify-email`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            role: 'restaurant', // ✅ Rôle normalisé
            restaurant_name: formData.restaurantName,
            phone_number: formData.phoneNumber,
            city: formData.city,
            address: formData.address,
            cuisine_type: formData.cuisineType,
            description: formData.description
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (authData.user && !authData.session) {
        // Email confirmation requise
        logger.info('Email confirmation required for restaurant');
        toast({
          title: "Email envoyé",
          description: "Vérifiez votre email pour confirmer votre compte. Après validation admin, vous pourrez accéder à votre espace.",
        });
        navigate('/restaurant/verify-email');
      } else if (authData.session) {
        // Connexion immédiate (rare pour restaurant)
        toast({
          title: "Succès !",
          description: "Votre restaurant est en attente de validation admin.",
        });
        onSuccess();
      }
    } catch (error: any) {
      logger.error('Restaurant registration error', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'inscription",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Inscription Restaurant</CardTitle>
          <CardDescription>
            Rejoignez Tembea et proposez vos plats à des milliers de clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Nom du Restaurant *</Label>
              <Input
                id="restaurantName"
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                placeholder="Restaurant Le Gourmet"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@restaurant.com"
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
                  placeholder="+243 XXX XXX XXX"
                  required
                />
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kinshasa">Kinshasa</SelectItem>
                    <SelectItem value="Lubumbashi">Lubumbashi</SelectItem>
                    <SelectItem value="Kolwezi">Kolwezi</SelectItem>
                    
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuisineType">Type de cuisine</Label>
                <Input
                  id="cuisineType"
                  value={formData.cuisineType}
                  onChange={(e) => setFormData({ ...formData, cuisineType: e.target.value })}
                  placeholder="Africaine, Italienne, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Avenue de la Libération, Gombe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description du restaurant</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez votre restaurant, votre spécialité..."
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                Retour
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-orange-600 hover:bg-orange-700">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer mon restaurant
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};