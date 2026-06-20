import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BannerPlacement = 'home' | 'marketplace';

export interface PromoBanner {
  id: string;
  image: string;
  alt: string;
  title: string;
  description: string;
}

// Pas de bannière de repli : les visuels proviennent uniquement de la table
// `promotional_ads` (Supabase). Le slider ne s'affiche pas tant qu'aucune
// bannière TAGA active n'est configurée.
const FALLBACK_HOME: PromoBanner[] = [];

const FALLBACK_MARKETPLACE: PromoBanner[] = [];

export const usePromoBanners = (placement: BannerPlacement = 'home') => {
  const fallback = placement === 'home' ? FALLBACK_HOME : FALLBACK_MARKETPLACE;

  return useQuery({
    queryKey: ['promo-banners-active', placement],
    queryFn: async (): Promise<PromoBanner[]> => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('promotional_ads')
        .select('id, image_url, title, description, placement')
        .eq('is_active', true)
        .or(`placement.eq.${placement},placement.eq.all`)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_priority', { ascending: true });

      if (error || !data || data.length === 0) {
        return fallback;
      }

      return data
        .filter((ad) => ad.image_url)
        .map((ad) => ({
          id: ad.id,
          image: ad.image_url!,
          alt: ad.title || 'Bannière promotionnelle',
          title: ad.title,
          description: ad.description,
        }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: fallback,
  });
};
