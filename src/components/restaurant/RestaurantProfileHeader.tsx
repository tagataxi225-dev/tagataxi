import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, Clock, Camera } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RestaurantImageSettings } from './RestaurantImageSettings';

interface RestaurantProfile {
  id: string;
  restaurant_name: string;
  phone_number: string;
  email: string;
  city: string;
  address: string;
  logo_url: string | null;
  verification_status: string;
  created_at: string;
}

export function RestaurantProfileHeader() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImageEditor, setShowImageEditor] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center py-8">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-6 w-48 mt-4" />
        <Skeleton className="h-5 w-24 mt-2" />
        <Skeleton className="h-4 w-32 mt-2" />
      </div>
    );
  }

  if (!profile) return null;

  const isVerified = profile.verification_status === 'verified' || profile.verification_status === 'approved';
  const isPending = profile.verification_status === 'pending';

  const memberSince = new Date(profile.created_at).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <div className="flex flex-col items-center py-6 px-4">
        {/* Avatar avec bouton d'édition */}
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-lg ring-2 ring-gray-100 dark:ring-gray-700">
            <AvatarImage src={profile.logo_url || ''} alt={profile.restaurant_name} />
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-3xl font-bold">
              {profile.restaurant_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Overlay d'édition */}
          <button
            onClick={() => setShowImageEditor(true)}
            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Modifier le logo"
          >
            <Camera className="h-6 w-6 text-white" />
          </button>

          {/* Badge "Ajouter" si pas de logo */}
          {!profile.logo_url && (
            <button
              onClick={() => setShowImageEditor(true)}
              className="absolute -bottom-1 -right-1 bg-orange-500 text-white p-1.5 rounded-full shadow-md hover:bg-orange-600 transition-colors"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Nom du restaurant */}
        <h1 className="text-2xl font-bold mt-4 text-center">
          {profile.restaurant_name}
        </h1>

        {/* Badge de vérification */}
        {isVerified && (
          <Badge className="mt-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100 border-0">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Vérifié
          </Badge>
        )}
        {isPending && (
          <Badge variant="secondary" className="mt-2">
            <Clock className="h-3.5 w-3.5 mr-1" />
            En attente de vérification
          </Badge>
        )}

        {/* Date d'inscription */}
        <p className="text-sm text-muted-foreground mt-2">
          Membre depuis {memberSince}
        </p>
      </div>

      {/* Dialog pour modifier les images */}
      <Dialog open={showImageEditor} onOpenChange={setShowImageEditor}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier les images</DialogTitle>
          </DialogHeader>
          <RestaurantImageSettings 
            onImageUpdate={() => {
              loadProfile();
              setShowImageEditor(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
