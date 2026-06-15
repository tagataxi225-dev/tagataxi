import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NotificationStats {
  total_sent: number;
  total_read: number;
  total_pending: number;
  total_failed: number;
  read_rate: number;
}

export interface NotificationType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface NotificationTemplate {
  id: string;
  type_id: string;
  name: string;
  title_template: string;
  content_template: string;
  is_active: boolean;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

export const useAdminNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<NotificationType[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total_sent: 0,
    total_read: 0,
    total_pending: 0,
    total_failed: 0,
    read_rate: 0
  });
  const { toast } = useToast();

  const loadNotificationTypes = async () => {
    const { data, error } = await supabase
      .from('admin_notification_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    setTypes(data || []);
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('admin_notification_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    setTemplates(data || []);
  };

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    setNotifications(data || []);
  };

  const loadStats = async () => {
    try {
      // Calculate stats from notification_campaign_history
      const { data: campaigns, error } = await supabase
        .from('notification_campaign_history')
        .select('sent_count, delivered_count, status');

      if (error) throw error;

      const total_sent = campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0;
      const total_delivered = campaigns?.reduce((sum, c) => sum + (c.delivered_count || 0), 0) || 0;
      const total_pending = total_sent - total_delivered;

      // Get read count from admin_notifications
      const { count: readCount } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', true);

      const total_failed = total_sent - total_delivered;
      const read_rate = total_sent > 0 ? Math.round(((readCount || 0) / total_sent) * 100) : 0;

      setStats({
        total_sent,
        total_read: readCount || 0,
        total_pending: Math.max(0, total_pending),
        total_failed,
        read_rate
      });
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  };

  const sendNotification = async (notificationData: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('push-notifications-broadcast', {
        body: notificationData
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: data.message || "Notification envoyée avec succès",
      });

      await Promise.all([loadNotifications(), loadStats()]);
      return { success: true, data };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'envoi",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const renderTemplate = async (templateId: string, variables: Record<string, any>) => {
    try {
      // Render template locally instead of calling non-existent edge function
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template non trouvé');

      let renderedTitle = template.title_template;
      let renderedContent = template.content_template;

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        renderedTitle = renderedTitle.replace(regex, String(value));
        renderedContent = renderedContent.replace(regex, String(value));
      });

      return { title: renderedTitle, content: renderedContent };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du rendu du template",
        variant: "destructive"
      });
      throw error;
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadNotificationTypes(),
        loadTemplates(),
        loadNotifications(),
        loadStats()
      ]);
    } catch (error: any) {
      console.error('Error loading admin notifications data:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    loading,
    types,
    templates,
    notifications,
    stats,
    sendNotification,
    renderTemplate,
    loadData,
    refreshData: loadData
  };
};
