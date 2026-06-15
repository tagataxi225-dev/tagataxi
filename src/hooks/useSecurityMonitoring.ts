/**
 * Hook pour le monitoring de sécurité automatique
 * Surveille les accès aux données sensibles et génère des alertes
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityAlert {
  id: string;
  type: 'access_violation' | 'failed_auth' | 'suspicious_activity' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  metadata?: any;
}

interface SecurityMetrics {
  totalAccesses: number;
  failedAttempts: number;
  suspiciousActivities: number;
  dataExposureRisk: number;
  lastSecurityScan: string | null;
}

interface UseSecurityMonitoringOptions {
  enableRealTimeAlerts?: boolean;
  alertThreshold?: number;
  monitoringInterval?: number;
}

export function useSecurityMonitoring(options: UseSecurityMonitoringOptions = {}) {
  const {
    enableRealTimeAlerts = true,
    alertThreshold = 5,
    monitoringInterval = 30000 // 30 secondes
  } = options;

  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalAccesses: 0,
    failedAttempts: 0,
    suspiciousActivities: 0,
    dataExposureRisk: 0,
    lastSecurityScan: null
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  // Analyser les logs de sécurité pour détecter des anomalies
  const analyzeSecurity = useCallback(async () => {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Récupérer les logs d'audit récents
      const { data: auditLogs, error: auditError } = await supabase
        .from('security_audit_logs')
        .select('*')
        .gte('created_at', last24h.toISOString())
        .order('created_at', { ascending: false });

      if (auditError) {
        console.error('Erreur lors de l\'analyse des logs d\'audit:', auditError);
        return;
      }

      // Récupérer les logs d'accès aux données sensibles
      const { data: accessLogs, error: accessError } = await supabase
        .from('sensitive_data_access_audit')
        .select('*')
        .gte('created_at', last24h.toISOString())
        .order('created_at', { ascending: false });

      if (accessError) {
        console.error('Erreur lors de l\'analyse des logs d\'accès:', accessError);
      }

      const auditData = auditLogs || [];
      const accessData = accessLogs || [];

      // Calculer les métriques
      const failedAttempts = auditData.filter(log => !log.success).length;
      const suspiciousActivities = auditData.filter(log => 
        log.error_message?.includes('Access denied') || 
        log.action_type.includes('unauthorized')
      ).length;

      const newMetrics: SecurityMetrics = {
        totalAccesses: auditData.length + accessData.length,
        failedAttempts,
        suspiciousActivities,
        dataExposureRisk: accessData.length > 10 ? Math.min(accessData.length / 10, 10) : 0,
        lastSecurityScan: now.toISOString()
      };

      setMetrics(newMetrics);
      setLastScanTime(now);

      // Détecter les alertes de sécurité
      const newAlerts: SecurityAlert[] = [];

      // Alerte pour trop de tentatives échouées
      if (failedAttempts > alertThreshold) {
        newAlerts.push({
          id: `failed_attempts_${now.getTime()}`,
          type: 'failed_auth',
          severity: failedAttempts > alertThreshold * 2 ? 'high' : 'medium',
          message: `${failedAttempts} tentatives d'authentification échouées détectées`,
          timestamp: now.toISOString(),
          metadata: { count: failedAttempts, threshold: alertThreshold }
        });
      }

      // Alerte pour activité suspecte
      if (suspiciousActivities > 0) {
        newAlerts.push({
          id: `suspicious_${now.getTime()}`,
          type: 'suspicious_activity',
          severity: suspiciousActivities > 3 ? 'high' : 'medium',
          message: `${suspiciousActivities} activités suspectes détectées`,
          timestamp: now.toISOString(),
          metadata: { count: suspiciousActivities }
        });
      }

      // Alerte pour accès excessif aux données sensibles
      if (accessData.length > 20) {
        newAlerts.push({
          id: `data_access_${now.getTime()}`,
          type: 'data_breach',
          severity: 'medium',
          message: `Accès excessif aux données sensibles: ${accessData.length} accès`,
          timestamp: now.toISOString(),
          metadata: { accessCount: accessData.length }
        });
      }

      // Ajouter les nouvelles alertes
      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Garder les 50 dernières alertes

        // Afficher les alertes en temps réel
        if (enableRealTimeAlerts) {
          newAlerts.forEach(alert => {
            const toastFunction = alert.severity === 'high' || alert.severity === 'critical' 
              ? toast.error 
              : toast.warning;
            
            toastFunction(`Alerte de sécurité: ${alert.message}`, {
              description: `Sévérité: ${alert.severity.toUpperCase()}`,
              duration: alert.severity === 'high' ? 10000 : 5000
            });
          });
        }
      }

    } catch (error) {
      console.error('Erreur lors de l\'analyse de sécurité:', error);
    }
  }, [alertThreshold, enableRealTimeAlerts]);

  // Démarrer le monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    analyzeSecurity(); // Première analyse immédiate
  }, [analyzeSecurity]);

  // Arrêter le monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Effacer les alertes
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Marquer une alerte comme résolue
  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Exécuter un scan de sécurité manuel
  const runSecurityScan = useCallback(async () => {
    try {
      toast.info('Exécution du scan de sécurité...');
      
      await analyzeSecurity();
      
      // Appeler la fonction de maintenance de la sécurité
      const { data, error } = await supabase.rpc('maintain_security_compliance');
      
      if (error) {
        console.error('Erreur lors du scan de sécurité:', error);
        toast.error('Erreur lors du scan de sécurité');
        return;
      }

      const results = data || [];
      const criticalIssues = results.filter((result: any) => 
        result.status.includes('REQUIRES') || result.status.includes('CRITICAL')
      );

      if (criticalIssues.length > 0) {
        toast.warning(`Scan terminé: ${criticalIssues.length} problème(s) détecté(s)`);
      } else {
        toast.success('Scan de sécurité terminé: Aucun problème détecté');
      }

    } catch (error) {
      console.error('Erreur lors du scan de sécurité:', error);
      toast.error('Erreur lors du scan de sécurité');
    }
  }, [analyzeSecurity]);

  // Surveillance automatique
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(analyzeSecurity, monitoringInterval);
    return () => clearInterval(interval);
  }, [isMonitoring, analyzeSecurity, monitoringInterval]);

  // Configuration d'un listener en temps réel pour les nouveaux logs
  useEffect(() => {
    if (!enableRealTimeAlerts) return;

    const channel = supabase
      .channel('security-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_audit_logs'
        },
        (payload) => {
          // Analyser le nouveau log immédiatement
          const log = payload.new as any;
          if (!log.success) {
            const alert: SecurityAlert = {
              id: `realtime_${Date.now()}`,
              type: 'failed_auth',
              severity: log.error_message?.includes('Access denied') ? 'high' : 'medium',
              message: `Nouvelle tentative d'accès échouée: ${log.action_type}`,
              timestamp: log.created_at,
              metadata: log
            };

            setAlerts(prev => [alert, ...prev].slice(0, 50));
            
            if (alert.severity === 'high') {
              toast.error(`Alerte de sécurité: ${alert.message}`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealTimeAlerts]);

  return {
    alerts,
    metrics,
    isMonitoring,
    lastScanTime,
    startMonitoring,
    stopMonitoring,
    clearAlerts,
    resolveAlert,
    runSecurityScan,
    analyzeSecurity
  };
}