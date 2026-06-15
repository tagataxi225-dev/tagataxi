import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PromoPopup {
  id: string;
  image_url: string;
  title: string;
  description: string;
  cta_text: string;
  cta_action: string | null;
}

const SESSION_KEY = 'promo_popup_shown';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h
const INITIAL_DELAY_MS = 3000;

const getCooldownKey = (id: string) => `promo_popup_${id}_last_shown`;

const isOnCooldown = (id: string): boolean => {
  const last = localStorage.getItem(getCooldownKey(id));
  if (!last) return false;
  return Date.now() - parseInt(last, 10) < COOLDOWN_MS;
};

export const usePromoPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePopup, setActivePopup] = useState<PromoPopup | null>(null);

  const { data: popups } = useQuery({
    queryKey: ['promo-popups-active'],
    queryFn: async (): Promise<PromoPopup[]> => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotional_ads')
        .select('id, image_url, title, description, cta_text, cta_action')
        .eq('is_active', true)
        .eq('placement', 'popup')
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_priority', { ascending: true })
        .limit(5);

      if (error || !data) return [];
      return data.filter((ad) => ad.image_url) as PromoPopup[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!popups || popups.length === 0) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Find first popup not on cooldown
    const eligible = popups.find((p) => !isOnCooldown(p.id));
    if (!eligible) return;

    const timer = setTimeout(async () => {
      setActivePopup(eligible);
      setIsOpen(true);
      sessionStorage.setItem(SESSION_KEY, '1');
      localStorage.setItem(getCooldownKey(eligible.id), String(Date.now()));

      // Increment impression count
      const { data: current } = await supabase
        .from('promotional_ads')
        .select('impression_count')
        .eq('id', eligible.id)
        .single();

      if (current) {
        supabase
          .from('promotional_ads')
          .update({ impression_count: (current.impression_count || 0) + 1 })
          .eq('id', eligible.id)
          .then(() => {});
      }
    }, INITIAL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [popups]);

  const dismiss = useCallback(() => {
    setIsOpen(false);
    // Small delay to let exit animation play
    setTimeout(() => setActivePopup(null), 300);
  }, []);

  return { popup: activePopup, isOpen, dismiss };
};
