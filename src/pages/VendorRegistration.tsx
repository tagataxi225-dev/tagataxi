import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Store, ArrowLeft, Loader2 } from 'lucide-react';

export const VendorRegistration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shop_name: '',
    shop_description: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // 1. Ajouter le rôle vendor dans user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'vendor',
          is_active: true
        });

      if (roleError) throw roleError;

      // 2. Créer le profil vendeur dans vendor_profiles
      const { error: profileError } = await supabase
        .from('vendor_profiles')
        .insert({
          user_id: user.id,
          shop_name: formData.shop_name,
          shop_description: formData.shop_description,
          phone: formData.phone,
          verification_status: 'pending'
        });

      if (profileError) throw profileError;

      toast({
        title: "Profil vendeur créé !",
        description: "Bienvenue dans votre espace vendeur",
      });

      navigate('/vendeur');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-950 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Store className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Devenir vendeur</h1>
              <p className="text-muted-foreground">Créez votre boutique en ligne</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nom de votre boutique *
              </label>
              <Input
                value={formData.shop_name}
                onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                placeholder="Ex: Boutique TAGA"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                value={formData.shop_description}
                onChange={(e) => setFormData({ ...formData, shop_description: e.target.value })}
                placeholder="Décrivez votre activité..."
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Téléphone de contact *
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+243 XXX XXX XXX"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Créer mon espace vendeur'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VendorRegistration;
