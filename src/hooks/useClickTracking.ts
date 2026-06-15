/**
 * Hook pour tracker les clics utilisateurs pour heatmaps
 * Utilise un buffer pour optimiser les envois vers Supabase
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClickData {
  page: string;
  element_type: string;
  element_id?: string;
  element_class?: string;
  element_text?: string;
  x: number;
  y: number;
  relative_x: number;
  relative_y: number;
  viewport_width: number;
  viewport_height: number;
  device_type: 'mobile' | 'tablet' | 'desktop';
}

const BATCH_SIZE = 20;
const BATCH_INTERVAL = 10000; // 10 secondes

let clickBuffer: ClickData[] = [];
let sessionId: string = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const detectDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const getElementText = (element: HTMLElement): string => {
  // Récupérer le texte visible (max 100 chars)
  const text = element.textContent || element.innerText || '';
  return text.trim().substring(0, 100);
};

// ✅ PHASE 1: Filtrer clics invalides avant envoi
const sendClickBatch = async () => {
  if (clickBuffer.length === 0) return;

  const validClicks = clickBuffer.filter(click => 
    typeof click.x === 'number' && 
    typeof click.y === 'number' && 
    !isNaN(click.x) && 
    !isNaN(click.y)
  );

  if (validClicks.length === 0) {
    clickBuffer = [];
    return;
  }

  const batch = [...validClicks];
  clickBuffer = [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const records = batch.map(click => ({
      user_id: user?.id || null,
      session_id: sessionId,
      ...click
    }));

    const { error } = await supabase
      .from('heatmap_clicks')
      .insert(records);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur envoi clics heatmap:', error);
  }
};

export const useClickTracking = (options: { enabled?: boolean; ignoredSelectors?: string[] } = {}) => {
  // Désactiver en production pour économiser data mobile
  const prodDisabled = import.meta.env.PROD;
  const { enabled = !prodDisabled, ignoredSelectors = ['.no-track', '[data-no-track]'] } = options;
  const intervalRef = useRef<NodeJS.Timeout>();

  const shouldIgnoreElement = useCallback((element: HTMLElement): boolean => {
    // Vérifier si l'élément ou un parent doit être ignoré
    return ignoredSelectors.some(selector => element.closest(selector) !== null);
  }, [ignoredSelectors]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!enabled) return;

    const target = e.target as HTMLElement;
    if (!target || shouldIgnoreElement(target)) return;

    // ✅ PHASE 1: Validation coordonnées
    const x = e.clientX;
    const y = e.clientY;
    
    if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const clickData: ClickData = {
      page: window.location.pathname,
      element_type: target.tagName.toLowerCase(),
      element_id: target.id || undefined,
      element_class: target.className || undefined,
      element_text: getElementText(target),
      x,
      y,
      relative_x: Math.round((x / viewportWidth) * 10000) / 100,
      relative_y: Math.round((y / viewportHeight) * 10000) / 100,
      viewport_width: viewportWidth,
      viewport_height: viewportHeight,
      device_type: detectDeviceType()
    };

    clickBuffer.push(clickData);

    if (clickBuffer.length >= BATCH_SIZE) {
      sendClickBatch();
    }
  }, [enabled, shouldIgnoreElement]);

  useEffect(() => {
    if (!enabled) return;

    // Écouter les clics
    document.addEventListener('click', handleClick, true);

    // Envoyer le buffer périodiquement
    intervalRef.current = setInterval(() => {
      sendClickBatch();
    }, BATCH_INTERVAL);

    // Envoyer avant de quitter la page
    const handleBeforeUnload = () => {
      sendClickBatch();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Envoyer le buffer restant
      sendClickBatch();
    };
  }, [enabled, handleClick]);

  return {
    sessionId,
    flushBuffer: sendClickBatch,
    getBufferSize: () => clickBuffer.length
  };
};
