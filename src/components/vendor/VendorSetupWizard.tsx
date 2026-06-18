import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Store, ShoppingCart } from 'lucide-react';

const VendorSetupWizard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'type' | 'form'>('type');
  const [formData, setFormData] = useState({
    shop_name: '',
    shop_description: '',
    shop_type: 'boutique' as 'boutique' | 'supermarket'
  });

  useEffect(() => {
    checkExistingProfile();
  }, [user]);

  const checkExistingProfile = async () => {
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    // Vérifier si un profil existe déjà
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('id, shop_name, shop_description')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setFormData({
        shop_name: data.shop_name || '',
        shop_description: data.shop_description || '',
        shop_type: (data as any).shop_type || 'boutique'
      });
      setStep('form');
    }
    
    setLoading(false);
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!formData.shop_name.trim()) {
      toast({
        title: "❌ Champ requis",
        description: "Le nom de la boutique est obligatoire",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .upsert({
          user_id: user.id,
          shop_name: formData.shop_name.trim(),
          shop_description: formData.shop_description.trim() || null,
          shop_type: formData.shop_type
        } as any, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "✅ Profil vendeur activé !",
        description: "Vous pouvez maintenant publier des produits"
      });

      navigate('/vendeur');
    } catch (error: any) {
      console.error('Erreur création profil vendeur:', error);
      toast({
        title: "❌ Erreur",
        description: error.message || "Impossible de créer le profil",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === 'type') {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">🎉 Bienvenue chez TAGA Vendeurs</CardTitle>
            <CardDescription>Quel type d'espace souhaitez-vous créer ?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Boutique */}
              <button
                type="button"
                onClick={() => { setFormData(f => ({ ...f, shop_type: 'boutique' })); setStep('form'); }}
                className={`relative rounded-xl border-2 p-6 text-left transition-all hover:shadow-md ${
                  formData.shop_type === 'boutique' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Boutique</h3>
                <p className="text-sm text-muted-foreground">Vendez vos produits en ligne : mode, électronique, artisanat...</p>
              </button>

              {/* Supermarché */}
              <button
                type="button"
                onClick={() => { setFormData(f => ({ ...f, shop_type: 'supermarket' })); setStep('form'); }}
                className={`relative rounded-xl border-2 p-6 text-left transition-all hover:shadow-md ${
                  formData.shop_type === 'supermarket' ? 'border-emerald-500 bg-emerald-500/5' : 'border-border hover:border-emerald-500/50'
                }`}
              >
                <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                  <ShoppingCart className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Supermarché</h3>
                <p className="text-sm text-muted-foreground">Gérez votre supermarché sur TAGA : alimentaire, boissons, hygiène...</p>
              </button>
            </div>

            <Button variant="outline" onClick={() => navigate('/marketplace')} className="w-full mt-4">
              Annuler
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
              formData.shop_type === 'supermarket' ? 'bg-emerald-500/10' : 'bg-primary/10'
            }`}>
              {formData.shop_type === 'supermarket' 
                ? <ShoppingCart className="h-8 w-8 text-emerald-600" />
                : <Store className="h-8 w-8 text-primary" />
              }
            </div>
          </div>
          <CardTitle className="text-2xl">
            {formData.shop_type === 'supermarket' ? '🛒 Créer mon supermarché' : '🏪 Créer ma boutique'}
          </CardTitle>
          <CardDescription>
            Complétez votre profil pour commencer à vendre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleComplete} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="shop_name">
                Nom {formData.shop_type === 'supermarket' ? 'du supermarché' : 'de la boutique'} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="shop_name"
                placeholder={formData.shop_type === 'supermarket' ? 'Ex: Super Kin Market' : 'Ex: Électronique Plus'}
                value={formData.shop_name}
                onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shop_description">Description</Label>
              <Textarea
                id="shop_description"
                placeholder={formData.shop_type === 'supermarket' 
                  ? 'Décrivez vos rayons et spécialités...' 
                  : 'Décrivez vos produits et services...'}
                value={formData.shop_description}
                onChange={(e) => setFormData({ ...formData, shop_description: e.target.value })}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.shop_description.length}/500 caractères
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('type')} className="flex-1" disabled={submitting}>
                Retour
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting || !formData.shop_name.trim()}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  formData.shop_type === 'supermarket' ? 'Créer mon supermarché' : 'Créer ma boutique'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorSetupWizard;
