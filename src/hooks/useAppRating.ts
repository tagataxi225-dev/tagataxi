/**
 * ⭐ Hook système de notation app intelligent
 * - In-App Review natif via @capacitor-community/in-app-review
 * - Tracking engagement via Supabase (user_engagement)
 * - Fallback localStorage pour utilisateurs non-connectés
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { inAppReviewService } from '@/services/inAppReviewService';

const MIN_ORDERS_BEFORE_PROMPT = 3;
const MIN_APP_OPENS_BEFORE_PROMPT = 5;
const MIN_DAYS_BETWEEN_PROMPTS = 30;
const LOCAL_STORAGE_KEY = 'kwenda_rating_preferences';

interface EngagementData {
  app_opens: number;
  total_orders: number;
  last_review_request: string | null;
  has_rated: boolean;
  never_ask_again: boolean;
}

const DEFAULT_ENGAGEMENT: EngagementData = {
  app_opens: 0,
  total_orders: 0,
  last_review_request: null,
  has_rated: false,
  never_ask_again: false,
};

// Fallback localStorage for non-authenticated users
const getLocalEngagement = (): EngagementData => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? { ...DEFAULT_ENGAGEMENT, ...JSON.parse(stored) } : { ...DEFAULT_ENGAGEMENT };
  } catch {
    return { ...DEFAULT_ENGAGEMENT };
  }
};

const saveLocalEngagement = (data: EngagementData) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch { /* Safari private mode */ }
};

export const useAppRating = () => {
  const [engagement, setEngagement] = useState<EngagementData>(DEFAULT_ENGAGEMENT);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');
  const userIdRef = useRef<string | null>(null);
  const loadedRef = useRef(false);

  // Detect platform
  useEffect(() => {
    setPlatform(
      Capacitor.getPlatform() === 'ios' ? 'ios' :
      Capacitor.getPlatform() === 'android' ? 'android' : 'web'
    );
  }, []);

  // Load engagement data from Supabase or localStorage
  useEffect(() => {
    if (loadedRef.current) return;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        userIdRef.current = user.id;
        const { data } = await supabase
          .from('user_engagement')
          .select('app_opens, total_orders, last_review_request, has_rated, never_ask_again')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setEngagement({
            app_opens: data.app_opens ?? 0,
            total_orders: data.total_orders ?? 0,
            last_review_request: data.last_review_request,
            has_rated: data.has_rated ?? false,
            never_ask_again: data.never_ask_again ?? false,
          });
        } else {
          // Create row for this user
          await supabase.from('user_engagement').insert({ user_id: user.id });
          setEngagement({ ...DEFAULT_ENGAGEMENT });
        }
      } else {
        setEngagement(getLocalEngagement());
      }
      loadedRef.current = true;
    };

    load().catch(e => logger.error('[AppRating] Load failed', e));
  }, []);

  // Persist engagement to Supabase or localStorage
  const persist = useCallback(async (data: EngagementData) => {
    setEngagement(data);
    saveLocalEngagement(data);

    if (userIdRef.current) {
      await supabase
        .from('user_engagement')
        .update({
          app_opens: data.app_opens,
          total_orders: data.total_orders,
          last_review_request: data.last_review_request,
          has_rated: data.has_rated,
          never_ask_again: data.never_ask_again,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userIdRef.current);
    }
  }, []);

  // Check if we can show the prompt
  const canShowPrompt = useCallback((): boolean => {
    if (engagement.has_rated) return false;
    if (engagement.never_ask_again) return false;
    if (engagement.total_orders < MIN_ORDERS_BEFORE_PROMPT) return false;
    if (engagement.app_opens < MIN_APP_OPENS_BEFORE_PROMPT) return false;

    if (engagement.last_review_request) {
      const lastDate = new Date(engagement.last_review_request);
      const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince < MIN_DAYS_BETWEEN_PROMPTS) return false;
    }

    return true;
  }, [engagement]);

  // Increment app opens
  const incrementAppOpens = useCallback(async () => {
    const updated = { ...engagement, app_opens: engagement.app_opens + 1 };
    await persist(updated);

    // Check if we should show prompt after incrementing
    if (updated.total_orders >= MIN_ORDERS_BEFORE_PROMPT &&
        updated.app_opens >= MIN_APP_OPENS_BEFORE_PROMPT &&
        !updated.has_rated && !updated.never_ask_again) {
      
      // Check days since last prompt
      if (updated.last_review_request) {
        const daysSince = Math.floor((Date.now() - new Date(updated.last_review_request).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince < MIN_DAYS_BETWEEN_PROMPTS) return;
      }
      
      setTimeout(() => setShowPrompt(true), 3000);
    }
  }, [engagement, persist]);

  // Record a successful trip/order
  const recordSuccessfulTrip = useCallback(async () => {
    const updated = { ...engagement, total_orders: engagement.total_orders + 1 };
    await persist(updated);

    if (canShowPrompt()) {
      setTimeout(() => setShowPrompt(true), 2000);
    }
  }, [engagement, persist, canShowPrompt]);

  // Request In-App Review (native) or open store
  const requestInAppReview = useCallback(async () => {
    const success = await inAppReviewService.requestReview();
    
    if (!success) {
      // Fallback: open store URL
      openAppStore();
      return;
    }

    await persist({
      ...engagement,
      has_rated: true,
      last_review_request: new Date().toISOString(),
    });
    setShowPrompt(false);
    toast.success('Merci pour votre évaluation ! 🌟');
  }, [engagement, persist]);

  // Open store URL
  const openAppStore = useCallback(() => {
    const iosUrl = 'https://apps.apple.com/ci/app/kwenda-taxi/id6759842295';
    const androidUrl = 'https://play.google.com/store/apps/details?id=cd.kwenda.app';

    if (platform === 'android') {
      try {
        window.open('market://details?id=cd.kwenda.app', '_system');
      } catch {
        window.open(androidUrl, '_blank');
      }
    } else if (platform === 'ios') {
      window.open(iosUrl, '_blank');
    } else {
      window.open(androidUrl, '_blank');
    }

    persist({
      ...engagement,
      has_rated: true,
      last_review_request: new Date().toISOString(),
    });
    setShowPrompt(false);
  }, [platform, engagement, persist]);

  // Defer rating
  const deferRating = useCallback(async () => {
    await persist({
      ...engagement,
      last_review_request: new Date().toISOString(),
    });
    setShowPrompt(false);
    toast.info('Nous vous le demanderons plus tard');
  }, [engagement, persist]);

  // Never ask again
  const neverAskAgain = useCallback(async () => {
    await persist({ ...engagement, never_ask_again: true });
    setShowPrompt(false);
  }, [engagement, persist]);

  // Force show prompt (from settings)
  const triggerPrompt = useCallback(() => {
    if (!engagement.has_rated) {
      setShowPrompt(true);
    } else {
      openAppStore();
    }
  }, [engagement.has_rated, openAppStore]);

  return {
    showPrompt,
    setShowPrompt,
    isNative: Capacitor.isNativePlatform(),
    platform,
    canShowPrompt: canShowPrompt(),
    recordSuccessfulTrip,
    requestInAppReview,
    openAppStore,
    deferRating,
    neverAskAgain,
    triggerPrompt,
    incrementAppOpens,
  };
};
