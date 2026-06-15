import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, Store } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface VendorProfileData {
  shop_name: string;
  shop_description: string;
  shop_logo_url: string;
  shop_banner_url: string;
}

export const VendorProfileSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [profile, setProfile] = useState<VendorProfileData>({
    shop_name: '',
    shop_description: '',
    shop_logo_url: '',
    shop_banner_url: ''
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        shop_name: data.shop_name || '',
        shop_description: data.shop_description || '',
        shop_logo_url: data.shop_logo_url || '',
        shop_banner_url: data.shop_banner_url || ''
      });
    }
  };

  const uploadImage = async (file: File, type: 'logo' | 'banner') => {
    if (!user) return;

    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-assets')
        .getPublicUrl(fileName);

      setProfile(prev => ({
        ...prev,
        [type === 'logo' ? 'shop_logo_url' : 'shop_banner_url']: publicUrl
      }));

      toast({
        title: "Image uploadée",
        description: `${type === 'logo' ? 'Logo' : 'Bannière'} uploadé(e) avec succès`
      });
    } catch (error: any) {
      toast({
        title: "Erreur d'upload",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .upsert({
          user_id: user.id,
          shop_name: profile.shop_name,
          shop_description: profile.shop_description,
          shop_logo_url: profile.shop_logo_url,
          shop_banner_url: profile.shop_banner_url,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Profil sauvegardé",
        description: "Votre profil boutique a été mis à jour avec succès"
      });
    } catch (error: any) {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (type: 'logo' | 'banner') => {
    setProfile(prev => ({
      ...prev,
      [type === 'logo' ? 'shop_logo_url' : 'shop_banner_url']: ''
    }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Configuration du Profil Boutique
          </CardTitle>
          <CardDescription>
            Renseignez les informations de votre boutique pour que vos clients puissent vous identifier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nom de la boutique */}
          <div className="space-y-2">
            <Label htmlFor="shop_name">Nom de la boutique *</Label>
            <Input
              id="shop_name"
              placeholder="Ex: Restaurant Chez Marie"
              value={profile.shop_name}
              onChange={(e) => setProfile(prev => ({ ...prev, shop_name: e.target.value }))}
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="shop_description">Description</Label>
            <Textarea
              id="shop_description"
              placeholder="Décrivez votre boutique en quelques mots..."
              value={profile.shop_description}
              onChange={(e) => setProfile(prev => ({ ...prev, shop_description: e.target.value }))}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {profile.shop_description.length}/500 caractères
            </p>
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo de la boutique</Label>
            <div className="flex items-center gap-4">
              {profile.shop_logo_url ? (
                <div className="relative">
                  <img 
                    src={profile.shop_logo_url} 
                    alt="Logo" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => removeImage('logo')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <Store className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <Button
                  variant="outline"
                  disabled={uploading === 'logo'}
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  {uploading === 'logo' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploading === 'logo' ? 'Upload...' : 'Choisir un logo'}
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file, 'logo');
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format carré recommandé (max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Bannière */}
          <div className="space-y-2">
            <Label>Bannière de la boutique</Label>
            <div className="space-y-2">
              {profile.shop_banner_url ? (
                <div className="relative">
                  <img 
                    src={profile.shop_banner_url} 
                    alt="Bannière" 
                    className="w-full h-32 rounded-lg object-cover border-2 border-border"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={() => removeImage('banner')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Aucune bannière</p>
                </div>
              )}
              <Button
                variant="outline"
                disabled={uploading === 'banner'}
                onClick={() => document.getElementById('banner-upload')?.click()}
              >
                {uploading === 'banner' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading === 'banner' ? 'Upload...' : 'Choisir une bannière'}
              </Button>
              <input
                id="banner-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file, 'banner');
                }}
              />
              <p className="text-xs text-muted-foreground">
                Format 16:9 recommandé (max 5MB)
              </p>
            </div>
          </div>

          {/* Bouton Sauvegarder */}
          <Button
            onClick={handleSave}
            disabled={loading || !profile.shop_name}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Sauvegarder le profil
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
