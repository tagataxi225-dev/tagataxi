import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DriverProfilEdit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('display_name, phone_number, profile_photo_url')
        .eq('user_id', user.id)
        .single();

      if (cancelled) return;

      if (error) {
        console.error('Error loading chauffeur profile:', error);
        toast.error('Impossible de charger le profil');
      } else if (data) {
        setDisplayName(data.display_name ?? '');
        setPhoneNumber(data.phone_number ?? '');
        setProfilePhotoUrl(data.profile_photo_url ?? null);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-sélectionner le même fichier
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop volumineuse (max 5 Mo)');
      return;
    }

    setUploadingPhoto(true);
    try {
      const path = `${user.id}/profile.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          upsert: true,
          contentType: file.type || 'image/jpeg',
          cacheControl: '3600',
        });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
      // Cache-bust pour forcer le rechargement immédiat
      const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('chauffeurs')
        .update({ profile_photo_url: publicUrl })
        .eq('user_id', user.id);
      if (updateError) throw updateError;

      setProfilePhotoUrl(publicUrl);
      toast.success('Photo de profil mise à jour');
    } catch (err: any) {
      console.error('[Avatar upload]', err);
      toast.error(err?.message || "Impossible de mettre à jour la photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('chauffeurs')
      .update({ display_name: displayName.trim() })
      .eq('user_id', user.id);
    setSaving(false);

    if (error) {
      console.error('Error saving chauffeur profile:', error);
      toast.error('Erreur lors de la mise à jour');
      return;
    }

    toast.success('Profil mis à jour');
  };

  const initials = (displayName || user?.email || '?')
    .split(' ')
    .map((s) => s.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="p-2 rounded-full hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-base">Informations personnelles</span>
      </div>

      {loading ? (
        <div className="flex-1 px-4 py-6 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ) : (
        <div className="flex-1 px-4 py-6 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt={displayName}
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-semibold text-gray-500 border-2 border-gray-100">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                aria-label="Changer la photo de profil"
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-red-600 text-white border-2 border-white flex items-center justify-center shadow-md active:scale-90 transition-transform disabled:opacity-60"
                style={{ touchAction: 'manipulation' }}
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handlePhotoSelected}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-sm text-gray-600">
                Nom complet
              </Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-sm text-gray-600">
                Numéro de téléphone
              </Label>
              <Input
                id="phone_number"
                value={phoneNumber}
                readOnly
                className="bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                Modifiable dans Numéro de téléphone
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-xl"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DriverProfilEdit;
