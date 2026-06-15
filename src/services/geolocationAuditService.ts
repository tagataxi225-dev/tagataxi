/**
 * Service d'audit trail avancé pour la géolocalisation
 * Surveillance et traçabilité des accès aux données sensibles
 */

import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  userId: string;
  actionType: string;
  resourceType: string;
  resourceId?: string;
  locationData?: any;
  encryptedPayload?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  riskScore: number;
  success: boolean;
  errorMessage?: string;
  metadata: any;
  createdAt: string;
}

export interface SecurityMetrics {
  totalAccess: number;
  riskySessions: number;
  failedAttempts: number;
  uniqueUsers: number;
  averageRiskScore: number;
  recentAlerts: number;
}

export interface RiskProfile {
  userId: string;
  totalRequests: number;
  riskScore: number;
  suspiciousActivity: boolean;
  lastActivity: string;
  flaggedActions: string[];
}

class GeolocationAuditService {
  private static instance: GeolocationAuditService;
  private sessionId: string;

  static getInstance(): GeolocationAuditService {
    if (!this.instance) {
      this.instance = new GeolocationAuditService();
    }
    return this.instance;
  }

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Logger un accès à des données de géolocalisation
   */
  async logLocationAccess(
    actionType: string,
    resourceType: string,
    resourceId?: string,
    locationData?: any,
    encryptedPayload?: string,
    metadata: any = {}
  ): Promise<void> {
    try {
      // Calculer le score de risque
      const riskScore = await this.calculateRiskScore(actionType, resourceType);
      
      // Enrichir les métadonnées
      const enrichedMetadata = {
        ...metadata,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        browserInfo: this.getBrowserInfo(),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // Utiliser la fonction de base de données pour l'audit
      await supabase.rpc('log_geolocation_access', {
        p_action_type: actionType,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_location_data: locationData,
        p_encrypted_payload: encryptedPayload,
        p_metadata: enrichedMetadata
      });

      // Si score de risque élevé, déclencher des alertes
      if (riskScore >= 7) {
        await this.triggerSecurityAlert(actionType, resourceType, riskScore, enrichedMetadata);
      }

    } catch (error) {
      console.error('Erreur logging audit géolocalisation:', error);
      // Ne pas faire échouer l'opération principale si l'audit échoue
    }
  }

  /**
   * Calculer le score de risque pour une action
   */
  private async calculateRiskScore(actionType: string, resourceType: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_risk_score', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_action_type: actionType,
        p_time_window_hours: 24
      });

      if (error) throw error;
      return data || 1;
    } catch (error) {
      console.error('Erreur calcul score de risque:', error);
      return 1; // Score par défaut
    }
  }

  /**
   * Déclencher une alerte de sécurité
   */
  private async triggerSecurityAlert(
    actionType: string,
    resourceType: string,
    riskScore: number,
    metadata: any
  ): Promise<void> {
    try {
      await supabase.functions.invoke('security-alert-dispatcher', {
        body: {
          alert_type: 'high_risk_geolocation_access',
          action_type: actionType,
          resource_type: resourceType,
          risk_score: riskScore,
          metadata: metadata,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erreur déclenchement alerte sécurité:', error);
    }
  }

  /**
   * Récupérer les métriques de sécurité
   */
  async getSecurityMetrics(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<SecurityMetrics> {
    try {
      const hoursBack = timeRange === 'hour' ? 1 : timeRange === 'day' ? 24 : 168;
      
      const { data, error } = await supabase
        .from('geolocation_audit_trail')
        .select('*')
        .gte('created_at', new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const logs = data || [];
      
      return {
        totalAccess: logs.length,
        riskySessions: logs.filter(log => log.risk_score >= 7).length,
        failedAttempts: logs.filter(log => !log.success).length,
        uniqueUsers: new Set(logs.map(log => log.user_id)).size,
        averageRiskScore: logs.reduce((sum, log) => sum + (log.risk_score || 0), 0) / logs.length,
        recentAlerts: logs.filter(log => log.risk_score >= 9).length
      };
    } catch (error) {
      console.error('Erreur récupération métriques sécurité:', error);
      return {
        totalAccess: 0,
        riskySessions: 0,
        failedAttempts: 0,
        uniqueUsers: 0,
        averageRiskScore: 0,
        recentAlerts: 0
      };
    }
  }

  /**
   * Récupérer les profils de risque des utilisateurs
   */
  async getUserRiskProfiles(limit: number = 20): Promise<RiskProfile[]> {
    try {
      const { data, error } = await supabase
        .from('geolocation_audit_trail')
        .select('user_id, risk_score, action_type, created_at, success')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Grouper par utilisateur et calculer les profils de risque
      const userProfiles = new Map<string, any>();
      
      (data || []).forEach(log => {
        if (!userProfiles.has(log.user_id)) {
          userProfiles.set(log.user_id, {
            userId: log.user_id,
            requests: [],
            riskScores: [],
            failedAttempts: 0,
            flaggedActions: new Set()
          });
        }
        
        const profile = userProfiles.get(log.user_id);
        profile.requests.push(log);
        profile.riskScores.push(log.risk_score || 0);
        
        if (!log.success) {
          profile.failedAttempts++;
        }
        
        if (log.risk_score >= 7) {
          profile.flaggedActions.add(log.action_type);
        }
      });

      // Convertir en profils de risque
      const riskProfiles: RiskProfile[] = Array.from(userProfiles.values())
        .map(profile => ({
          userId: profile.userId,
          totalRequests: profile.requests.length,
          riskScore: profile.riskScores.reduce((sum: number, score: number) => sum + score, 0) / profile.riskScores.length,
          suspiciousActivity: profile.riskScores.some((score: number) => score >= 8) || profile.failedAttempts > 5,
          lastActivity: new Date(Math.max(...profile.requests.map((r: any) => new Date(r.created_at).getTime()))).toISOString(),
          flaggedActions: Array.from(profile.flaggedActions) as string[]
        }))
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, limit);

      return riskProfiles;
    } catch (error) {
      console.error('Erreur récupération profils de risque:', error);
      return [];
    }
  }

  /**
   * Récupérer les logs d'audit pour un utilisateur
   */
  async getUserAuditLogs(userId?: string, limit: number = 100): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('geolocation_audit_trail')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(log => ({
        id: log.id,
        userId: log.user_id,
        actionType: log.action_type,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        locationData: log.location_data,
        encryptedPayload: log.encrypted_payload,
        ipAddress: log.ip_address?.toString() || '',
        userAgent: log.user_agent,
        sessionId: log.session_id,
        riskScore: log.risk_score || 0,
        success: log.success,
        errorMessage: log.error_message,
        metadata: log.metadata || {},
        createdAt: log.created_at
      }));
    } catch (error) {
      console.error('Erreur récupération logs audit utilisateur:', error);
      return [];
    }
  }

  /**
   * Rechercher dans les logs d'audit
   */
  async searchAuditLogs(searchParams: {
    actionType?: string;
    resourceType?: string;
    riskScoreMin?: number;
    dateFrom?: Date;
    dateTo?: Date;
    userAgent?: string;
    success?: boolean;
  }): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('geolocation_audit_trail')
        .select('*');

      if (searchParams.actionType) {
        query = query.eq('action_type', searchParams.actionType);
      }
      if (searchParams.resourceType) {
        query = query.eq('resource_type', searchParams.resourceType);
      }
      if (searchParams.riskScoreMin) {
        query = query.gte('risk_score', searchParams.riskScoreMin);
      }
      if (searchParams.dateFrom) {
        query = query.gte('created_at', searchParams.dateFrom.toISOString());
      }
      if (searchParams.dateTo) {
        query = query.lte('created_at', searchParams.dateTo.toISOString());
      }
      if (searchParams.success !== undefined) {
        query = query.eq('success', searchParams.success);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      return (data || []).map(log => ({
        id: log.id,
        userId: log.user_id,
        actionType: log.action_type,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        locationData: log.location_data,
        encryptedPayload: log.encrypted_payload,
        ipAddress: log.ip_address?.toString() || '',
        userAgent: log.user_agent,
        sessionId: log.session_id,
        riskScore: log.risk_score || 0,
        success: log.success,
        errorMessage: log.error_message,
        metadata: log.metadata || {},
        createdAt: log.created_at
      }));
    } catch (error) {
      console.error('Erreur recherche logs audit:', error);
      return [];
    }
  }

  /**
   * Nettoyer les anciens logs d'audit
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_old_audit_logs', {
        retention_days: retentionDays
      });

      if (error) throw error;
      return (data as number) || 0;
    } catch (error) {
      console.error('Erreur nettoyage anciens logs:', error);
      return 0;
    }
  }

  /**
   * Générer un ID de session unique
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtenir des informations sur le navigateur
   */
  private getBrowserInfo(): any {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency
    };
  }
}

export const geolocationAuditService = GeolocationAuditService.getInstance();