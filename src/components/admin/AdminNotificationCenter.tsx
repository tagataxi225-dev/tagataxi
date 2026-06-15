import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  TrendingUp,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface NotificationType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface NotificationTemplate {
  id: string;
  type_id: string;
  name: string;
  title_template: string;
  content_template: string;
  is_active: boolean;
}

// Mapped from notification_campaign_history table
interface CampaignHistoryItem {
  id: string;
  campaign_title: string;
  message_content: string;
  target_type: string;
  priority: string;
  status: string;
  sent_count: number;
  delivered_count: number;
  sent_at: string | null;
  created_at: string;
}

interface NotificationStats {
  total_sent: number;
  total_read: number;
  total_pending: number;
  total_failed: number;
  read_rate: number;
}

const mapTargetType = (t: string): string => {
  const map: Record<string, string> = {
    'all_users': 'all',
    'user_role': 'clients',
    'specific_users': 'all',
    'zone_users': 'clients'
  };
  return map[t] || 'all';
};

export const AdminNotificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('send');
  const [types, setTypes] = useState<NotificationType[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignHistoryItem[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total_sent: 0,
    total_read: 0,
    total_pending: 0,
    total_failed: 0,
    read_rate: 0
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    type_id: '',
    template_id: '',
    title: '',
    content: '',
    target_type: 'all_users',
    priority: 'normal',
    scheduled_for: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Use allSettled so one failure doesn't crash everything
    await Promise.allSettled([
      loadNotificationTypes(),
      loadTemplates(),
      loadCampaigns(),
      loadStats()
    ]);
    setLoading(false);
  };

  const loadNotificationTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notification_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setTypes(data || []);
    } catch (e) {
      console.error('Error loading notification types:', e);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notification_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setTemplates(data || []);
    } catch (e) {
      console.error('Error loading templates:', e);
    }
  };

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_campaign_history')
        .select('id, campaign_title, message_content, target_type, priority, status, sent_count, delivered_count, sent_at, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setCampaigns((data as CampaignHistoryItem[]) || []);
    } catch (e) {
      console.error('Error loading campaigns:', e);
    }
  };

  const loadStats = async () => {
    try {
      const { data: campaignData, error: cErr } = await supabase
        .from('notification_campaign_history')
        .select('sent_count, delivered_count, status');
      if (cErr) throw cErr;

      const total_sent = campaignData?.reduce((s, c) => s + (c.sent_count || 0), 0) || 0;
      const total_delivered = campaignData?.reduce((s, c) => s + (c.delivered_count || 0), 0) || 0;
      const total_pending = campaignData?.filter(c => c.status === 'pending' || c.status === 'sending').length || 0;

      const { count: readCount } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', true);

      const total_failed = Math.max(0, total_sent - total_delivered);
      const read_rate = total_sent > 0 ? Math.round(((readCount || 0) / total_sent) * 100) : 0;

      setStats({
        total_sent,
        total_read: readCount || 0,
        total_pending,
        total_failed,
        read_rate: Math.min(read_rate, 100)
      });
    } catch (e) {
      console.error('Error loading stats:', e);
    }
  };

  const handleSendNotification = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le titre et le contenu",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      // 1. Log campaign in history
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { error: insertErr } = await supabase
        .from('notification_campaign_history')
        .insert([{
          campaign_title: formData.title,
          message_content: formData.content,
          target_type: formData.target_type,
          priority: formData.priority,
          sent_by: userData.user.id,
          status: formData.scheduled_for ? 'pending' : 'sending',
          scheduled_for: formData.scheduled_for || null,
          target_criteria: {}
        }]);
      if (insertErr) throw insertErr;

      // 2. Broadcast via existing edge function
      if (!formData.scheduled_for) {
        const { error: fnErr } = await supabase.functions.invoke('push-notifications-broadcast', {
          body: {
            title: formData.title,
            message: formData.content,
            target_audience: mapTargetType(formData.target_type),
            priority: formData.priority,
            type: 'announcement'
          }
        });
        if (fnErr) console.warn('Broadcast warning:', fnErr);
      }

      toast({
        title: "Succès",
        description: formData.scheduled_for 
          ? "Campagne programmée avec succès" 
          : "Notification envoyée avec succès",
      });

      setFormData({
        type_id: '',
        template_id: '',
        title: '',
        content: '',
        target_type: 'all_users',
        priority: 'normal',
        scheduled_for: '',
      });

      await Promise.allSettled([loadCampaigns(), loadStats()]);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'envoi",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    if (!templateId || templateId === 'none') {
      setFormData(prev => ({ ...prev, template_id: '', title: '', content: '' }));
      return;
    }
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        template_id: templateId,
        title: template.title_template,
        content: template.content_template,
        type_id: template.type_id
      }));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'normal': return 'bg-primary text-primary-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-600 text-white';
      case 'sending': return 'bg-yellow-500 text-white';
      case 'pending': return 'bg-blue-500 text-white';
      case 'failed': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Envoyées</p>
                <p className="text-2xl font-bold">{stats.total_sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lues</p>
                <p className="text-2xl font-bold">{stats.total_read}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{stats.total_pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux lecture</p>
                <p className="text-2xl font-bold">{stats.read_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="send">Envoyer</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* ===== SEND TAB ===== */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Nouvelle Notification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Type de notification</Label>
                  <Select value={formData.type_id} onValueChange={(v) => setFormData(p => ({ ...p, type_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un type" /></SelectTrigger>
                    <SelectContent>
                      {types.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Template (optionnel)</Label>
                  <Select value={formData.template_id || 'none'} onValueChange={handleTemplateChange}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un template" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun template</SelectItem>
                      {templates.filter(t => !formData.type_id || t.type_id === formData.type_id).map(tpl => (
                        <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Titre *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="Titre de la notification"
                />
              </div>

              <div>
                <Label>Contenu *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
                  placeholder="Contenu de la notification"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Ciblage</Label>
                  <Select value={formData.target_type} onValueChange={(v) => setFormData(p => ({ ...p, target_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">Tous les utilisateurs</SelectItem>
                      <SelectItem value="user_role">Par rôle</SelectItem>
                      <SelectItem value="specific_users">Spécifiques</SelectItem>
                      <SelectItem value="zone_users">Par zone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priorité</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData(p => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Programmée pour</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_for}
                    onChange={(e) => setFormData(p => ({ ...p, scheduled_for: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSendNotification} disabled={sending}>
                  {sending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Envoyer la notification</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== HISTORY TAB ===== */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des campagnes</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune campagne envoyée</p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map(c => (
                    <div key={c.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{c.campaign_title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{c.message_content}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                          <Badge className={getPriorityColor(c.priority)}>{c.priority}</Badge>
                          <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{c.sent_count} envoyées</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>{c.delivered_count} délivrées</span>
                          </span>
                          {c.sent_count - c.delivered_count > 0 && (
                            <span className="flex items-center space-x-1">
                              <XCircle className="h-4 w-4 text-destructive" />
                              <span>{c.sent_count - c.delivered_count} échouées</span>
                            </span>
                          )}
                        </div>
                        <span>
                          {c.sent_at
                            ? format(new Date(c.sent_at), 'dd/MM/yyyy HH:mm')
                            : format(new Date(c.created_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TEMPLATES TAB ===== */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates de notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucun template configuré</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(tpl => (
                    <div key={tpl.id} className="border rounded-lg p-4">
                      <h4 className="font-medium">{tpl.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Type: {types.find(t => t.id === tpl.type_id)?.name || '—'}
                      </p>
                      <div className="mt-2 text-sm">
                        <p><strong>Titre:</strong> {tpl.title_template}</p>
                        <p className="mt-1"><strong>Contenu:</strong> {tpl.content_template}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
