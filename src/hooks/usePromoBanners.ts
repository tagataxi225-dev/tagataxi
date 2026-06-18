import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import campaignClient from '@/assets/campaign-client.png';
import campaignDelivery from '@/assets/campaign-delivery.png';

export type BannerPlacement = 'home' | 'marketplace';

export interface PromoBanner {
  id: string;
  image: string;
  alt: string;
  title: string;
  description: string;
}

const FALLBACK_HOME: PromoBanner[] = [
  {
    id: 'fallback-1',
    image: campaignClient,
    alt: 'TAGA - Simplifiez vos trajets',
    title: 'Simplifiez vos trajets',
    description: 'Profitez de chaque instant',
  },
  {
    id: 'fallback-2',
    image: campaignDelivery,
    alt: 'Devenez livreur TAGA',
    title: 'Devenez livreur',
    description: 'Gagnez plus rapidement',
  },
];

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
