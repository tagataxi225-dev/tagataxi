import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Store, Share2, Camera, ImageIcon, X } from 'lucide-react';
import { VendorShopShareButtons } from './VendorShopShareButtons';
import imageCompression from 'browser-image-compression';
import { useQueryClient } from '@tanstack/react-query';

export const VendorShopSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [vendorId, setVendorId] = useState<string>('');
  const [productCount, setProductCount] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState({
    shop_name: '',
    shop_description: '',
    shop_banner_url: '',
    shop_logo_url: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: vendorProfile, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (vendorProfile) {
        setVendorId(vendorProfile.id);
        setProfile({
          shop_name: vendorProfile.shop_name || '',
          shop_description: vendorProfile.shop_description || '',
          shop_banner_url: vendorProfile.shop_banner_url || '',
          shop_logo_url: vendorProfile.shop_logo_url || ''
        });
      }

      const { count } = await supabase
        .from('marketplace_products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .eq('moderation_status', 'approved');
      setProductCount(count || 0);

      const { data: verificationData } = await supabase
        .from('seller_verification_requests')
        .select('verification_status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (verificationData) {
        setVerificationStatus(verificationData.verification_status as 'pending' | 'approved' | 'rejected');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, type: 'logo' | 'banner') => {
    if (!userId) return;
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingBanner;
    setUploading(true);

    try {
      // Compress image
      const compressed = await imageCompression(file, {
        maxSizeMB: type === 'logo' ? 0.5 : 1,
        maxWidthOrHeight: type === 'logo' ? 400 : 1200,
        useWebWorker: true
      });

      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${userId}/${type}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-assets')
        .upload(path, compressed, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('vendor-assets').getPublicUrl(path);
      const urlKey = type === 'logo' ? 'shop_logo_url' : 'shop_banner_url';
      setProfile(prev => ({ ...prev, [urlKey]: data.publicUrl }));

      toast({ title: `${type === 'logo' ? 'Logo' : 'Bannière'} mis à jour` });
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `Impossible de télécharger ${type === 'logo' ? 'le logo' : 'la bannière'}.`
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (type: 'logo' | 'banner') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Fichier trop volumineux', description: 'Max 5 MB.' });
      return;
    }
    uploadImage(file, type);
    e.target.value = '';
  };

  const removeImage = (type: 'logo' | 'banner') => {
    const urlKey = type === 'logo' ? 'shop_logo_url' : 'shop_banner_url';
    setProfile(prev => ({ ...prev, [urlKey]: '' }));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'B';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Vous devez être connecté.' });
        return;
      }

      const { error } = await supabase
        .from('vendor_profiles')
        .upsert({
          user_id: user.id,
          shop_name: profile.shop_name,
          shop_description: profile.shop_description,
          shop_banner_url: profile.shop_banner_url,
          shop_logo_url: profile.shop_logo_url
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      // Invalidate all vendor profile queries so logo/data refreshes everywhere
      queryClient.invalidateQueries({ queryKey: ['vendor-profile-full'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-shop-name'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });

      toast({ title: 'Boutique mise à jour', description: 'Les informations ont été enregistrées.' });
      if (!vendorId) loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Configuration de la boutique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Branding preview: banner + logo overlay */}
          <div className="relative mb-14">
            {/* Banner */}
            <label htmlFor="banner-upload" className="block cursor-pointer group">
              <div className="w-full h-32 rounded-2xl overflow-hidden relative bg-muted">
                {profile.shop_banner_url ? (
                  <img
                    src={profile.shop_banner_url}
                    alt="Bannière"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium flex items-center gap-1.5 bg-black/50 rounded-full px-3 py-1.5">
                    {uploadingBanner ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    {uploadingBanner ? 'Upload...' : 'Changer la bannière'}
                  </span>
                </div>
                {profile.shop_banner_url && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); removeImage('banner'); }}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </label>
            <input id="banner-upload" type="file" accept="image/*" onChange={handleFileSelect('banner')} className="hidden" />

            {/* Logo overlapping banner */}
            <div className="absolute -bottom-10 left-4">
              <label htmlFor="logo-upload" className="block cursor-pointer group relative">
                <div className="w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-muted shadow-md">
                  {profile.shop_logo_url ? (
                    <img
                      src={profile.shop_logo_url}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary/60">
                        {getInitials(profile.shop_name)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    {uploadingLogo ? (
                      <Loader2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
                {profile.shop_logo_url && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); removeImage('logo'); }}
                    className="absolute -top-1 -right-1 bg-destructive hover:bg-destructive/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </label>
              <input id="logo-upload" type="file" accept="image/*" onChange={handleFileSelect('logo')} className="hidden" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop_name">Nom de la boutique *</Label>
            <Input
              id="shop_name"
              value={profile.shop_name}
              onChange={(e) => setProfile({ ...profile, shop_name: e.target.value })}
              placeholder="Ex: Électronique Plus"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop_description">Description</Label>
            <Textarea
              id="shop_description"
              value={profile.shop_description}
              onChange={(e) => setProfile({ ...profile, shop_description: e.target.value })}
              placeholder="Décrivez votre boutique et vos produits..."
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {profile.shop_description.length}/500 caractères
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !profile.shop_name.trim()}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {vendorId && profile.shop_name && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Partager ma boutique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VendorShopShareButtons
              vendorId={vendorId}
              vendorName={profile.shop_name}
              productCount={productCount}
              rating={0}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
