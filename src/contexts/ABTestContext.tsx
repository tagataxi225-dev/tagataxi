/**
 * Contexte React pour gérer les expériences A/B Testing
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { assignVariant, generateSessionId } from '@/utils/abTesting';
import { useToast } from '@/hooks/use-toast';

interface ABVariantConfig {
  weight: number;
  config: Record<string, any>;
}

interface ABExperiment {
  id: string;
  experiment_id: string;
  name: string;
  description?: string;
  variants: {
    control: ABVariantConfig;
    variant: ABVariantConfig;
  };
  is_active: boolean;
  start_date: string;
  end_date?: string;
}

interface ABTestContextValue {
  experiments: ABExperiment[];
  loading: boolean;
  getVariant: (experimentId: string) => 'control' | 'variant' | null;
  getConfig: (experimentId: string) => Record<string, any> | null;
  trackEvent: (experimentId: string, eventType: 'view' | 'click' | 'conversion' | 'custom', eventData?: Record<string, any>) => Promise<void>;
  refreshExperiments: () => Promise<void>;
}

const ABTestContext = createContext<ABTestContextValue | undefined>(undefined);

export const ABTestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [experiments, setExperiments] = useState<ABExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(generateSessionId());
  const [userAssignments, setUserAssignments] = useState<Map<string, 'control' | 'variant'>>(new Map());
  const { toast } = useToast();

  // Charger les expériences actives
  const loadExperiments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ab_experiments')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExperiments((data || []) as unknown as ABExperiment[]);
    } catch (error) {
      console.error('Erreur chargement expériences A/B:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les assignations existantes de l'utilisateur
  const loadUserAssignments = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ab_user_assignments')
        .select('experiment_id, variant')
        .eq('user_id', user.id);

      if (error) throw error;

      const assignments = new Map<string, 'control' | 'variant'>();
      data?.forEach(assignment => {
        assignments.set(assignment.experiment_id, assignment.variant as 'control' | 'variant');
      });
      
      setUserAssignments(assignments);
    } catch (error) {
      console.error('Erreur chargement assignations:', error);
    }
  }, []);

  useEffect(() => {
    loadExperiments();
    loadUserAssignments();
  }, [loadExperiments, loadUserAssignments]);

  // Obtenir ou créer l'assignation de variant pour un utilisateur
  const getVariant = useCallback((experimentId: string): 'control' | 'variant' | null => {
    const experiment = experiments.find(exp => exp.experiment_id === experimentId);
    if (!experiment || !experiment.is_active) return null;

    // Vérifier si déjà assigné
    if (userAssignments.has(experimentId)) {
      return userAssignments.get(experimentId)!;
    }

    // Créer nouvelle assignation
    const createAssignment = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || sessionId;

      const variant = assignVariant(
        userId,
        experimentId,
        {
          control: experiment.variants.control.weight,
          variant: experiment.variants.variant.weight
        }
      );

      // Sauvegarder en DB si utilisateur connecté
      if (user?.id) {
        try {
          await supabase
            .from('ab_user_assignments')
            .upsert({
              user_id: user.id,
              experiment_id: experimentId,
              variant
            });
        } catch (error) {
          console.error('Erreur sauvegarde assignation:', error);
        }
      }

      // Mettre à jour le cache local
      setUserAssignments(prev => new Map(prev).set(experimentId, variant));

      return variant;
    };

    createAssignment();

    // Retour temporaire le temps du calcul async
    return assignVariant(
      sessionId,
      experimentId,
      {
        control: experiment.variants.control.weight,
        variant: experiment.variants.variant.weight
      }
    );
  }, [experiments, userAssignments, sessionId]);

  // Obtenir la configuration du variant assigné
  const getConfig = useCallback((experimentId: string): Record<string, any> | null => {
    const experiment = experiments.find(exp => exp.experiment_id === experimentId);
    if (!experiment) return null;

    const variant = getVariant(experimentId);
    if (!variant) return null;

    return experiment.variants[variant].config;
  }, [experiments, getVariant]);

  // Tracker un événement
  const trackEvent = useCallback(async (
    experimentId: string,
    eventType: 'view' | 'click' | 'conversion' | 'custom',
    eventData?: Record<string, any>
  ) => {
    const variant = getVariant(experimentId);
    if (!variant) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('ab_test_events')
        .insert({
          user_id: user?.id || null,
          session_id: sessionId,
          experiment_id: experimentId,
          variant,
          event_type: eventType,
          event_data: eventData || {},
          page_path: window.location.pathname
        });

      if (error) throw error;
      
      console.log(`📊 A/B Event tracked: ${experimentId} - ${variant} - ${eventType}`);
    } catch (error) {
      console.error('Erreur tracking A/B event:', error);
    }
  }, [getVariant, sessionId]);

  const value: ABTestContextValue = {
    experiments,
    loading,
    getVariant,
    getConfig,
    trackEvent,
    refreshExperiments: loadExperiments
  };

  return <ABTestContext.Provider value={value}>{children}</ABTestContext.Provider>;
};

export const useABTest = (experimentId: string) => {
  const context = useContext(ABTestContext);
  if (!context) {
    throw new Error('useABTest doit être utilisé dans un ABTestProvider');
  }

  const { getVariant, getConfig, trackEvent } = context;
  
  const variant = getVariant(experimentId);
  const config = getConfig(experimentId);

  // Auto-track view au montage
  useEffect(() => {
    if (variant) {
      trackEvent(experimentId, 'view');
    }
  }, [experimentId, variant, trackEvent]);

  const trackClick = useCallback((eventData?: Record<string, any>) => {
    return trackEvent(experimentId, 'click', eventData);
  }, [experimentId, trackEvent]);

  const trackConversion = useCallback((eventData?: Record<string, any>) => {
    return trackEvent(experimentId, 'conversion', eventData);
  }, [experimentId, trackEvent]);

  const trackCustom = useCallback((eventData?: Record<string, any>) => {
    return trackEvent(experimentId, 'custom', eventData);
  }, [experimentId, trackEvent]);

  return {
    variant,
    config,
    trackClick,
    trackConversion,
    trackCustom,
    isControl: variant === 'control',
    isVariant: variant === 'variant'
  };
};

export const useABTestContext = () => {
  const context = useContext(ABTestContext);
  if (!context) {
    throw new Error('useABTestContext doit être utilisé dans un ABTestProvider');
  }
  return context;
};
