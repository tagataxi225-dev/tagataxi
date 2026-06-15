/**
 * Centre de Notifications Centralisé - Version corrigée
 * Interface complète pour la gestion des notifications multicanal
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Bell,
  Send,
  Mail,
  MessageSquare,
  Smartphone,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  Plus,
  ArrowLeft,
  Play,
  Settings,
  Target,
  TrendingUp,
  Copy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NotificationAnalytics } from './NotificationAnalytics';
import { AudienceSegments } from './AudienceSegments';
import { NotificationSender } from './NotificationSender';

interface NotificationTemplate {
  id: string;
  template_name: string;
  template_type: string;
  subject_template?: string;
  content_template: string;
  variables: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationCampaign {
  id: string;
  campaign_name: string;
  template_id: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  failed_count: number;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  notification_templates?: {
    template_name: string;
    template_type: string;
  };
}

interface CentralizedNotificationCenterProps {
  onBack: () => void;
}

export const CentralizedNotificationCenterFixed: React.FC<CentralizedNotificationCenterProps> = ({ onBack }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);

  // Mock data pour les tests
  const mockTemplates: NotificationTemplate[] = [
    {
      id: '1',
      template_name: 'welcome_email',
      template_type: 'email',
      subject_template: 'Bienvenue sur Tembea Taxi, {{user_name}}!',
      content_template: 'Bonjour {{user_name}}, bienvenue sur notre plateforme!',
      variables: ['user_name'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      template_name: 'booking_confirmed',
      template_type: 'push',
      subject_template: 'Course confirmée',
      content_template: 'Votre course vers {{destination}} a été confirmée.',
      variables: ['destination'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const mockCampaigns: NotificationCampaign[] = [
    {
      id: '1',
      campaign_name: 'Campagne de bienvenue',
      template_id: '1',
      status: 'sent',
      total_recipients: 150,
      sent_count: 148,
      delivered_count: 142,
      opened_count: 89,
      clicked_count: 23,
      failed_count: 2,
      created_at: new Date().toISOString(),
      notification_templates: {
        template_name: 'welcome_email',
        template_type: 'email'
      }
    }
  ];

  // Envoyer une notification test via edge function
  const sendTestNotificationMutation = useMutation({
    mutationFn: async ({ templateName, variables }: { templateName: string, variables: any }) => {
      const { data, error } = await supabase.functions.invoke('notification-dispatcher', {
        body: {
          template_name: templateName,
          recipient_ids: [(await supabase.auth.getUser()).data.user?.id],
          variables: variables,
          campaign_name: `Test: ${templateName}`
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Notification test envoyée',
        description: 'La notification de test a été envoyée avec succès'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer la notification test',
        variant: 'destructive'
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'draft': return 'secondary';
      case 'scheduled': return 'secondary';
      case 'sending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      case 'sending': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Smartphone className="h-4 w-4" />;
      case 'in_app': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  // Mock statistics
  const mockStats = {
    total_sent: 1250,
    total_delivered: 1198,
    total_opened: 756,
    total_clicked: 234,
    total_failed: 52,
    delivery_rate: 95.8,
    open_rate: 63.1,
    click_rate: 31.0
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Centre de Notifications</h1>
              <p className="text-sm text-muted-foreground">
                Système centralisé de gestion des notifications multicanal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreateTemplate(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Template
            </Button>
            <Button size="sm" onClick={() => setActiveTab('sender')}>
              <Send className="h-4 w-4 mr-1" />
              Envoi Rapide
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-1" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Mail className="h-4 w-4 mr-1" />
              Templates ({mockTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="campaigns">
              <Send className="h-4 w-4 mr-1" />
              Campagnes ({mockCampaigns.length})
            </TabsTrigger>
            <TabsTrigger value="segments">
              <Target className="h-4 w-4 mr-1" />
              Segments (4)
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-1" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="sender">
              <Send className="h-4 w-4 mr-1" />
              Envoi Rapide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Métriques générales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Envoyées</p>
                      <p className="text-2xl font-bold">{mockStats.total_sent.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">7 derniers jours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Livrées</p>
                      <p className="text-2xl font-bold">{mockStats.total_delivered.toLocaleString()}</p>
                      <p className="text-xs text-green-600">{mockStats.delivery_rate}% taux</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ouvertes</p>
                      <p className="text-2xl font-bold">{mockStats.total_opened.toLocaleString()}</p>
                      <p className="text-xs text-purple-600">{mockStats.open_rate}% taux</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Échecs</p>
                      <p className="text-2xl font-bold">{mockStats.total_failed}</p>
                      <p className="text-xs text-red-600">4.2% taux</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Templates actifs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Templates Actifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockTemplates.filter(t => t.is_active).map((template) => (
                    <div key={template.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(template.template_type)}
                          <span className="font-medium">{template.template_name}</span>
                        </div>
                        <Badge variant="secondary">{template.template_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {template.content_template.substring(0, 100)}...
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => sendTestNotificationMutation.mutate({
                            templateName: template.template_name,
                            variables: { user_name: 'Test User', destination: 'Kinshasa' }
                          })}
                          disabled={sendTestNotificationMutation.isPending}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Test
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Campagnes récentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Campagnes Récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockCampaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(campaign.status)}
                        <div>
                          <p className="font-medium">{campaign.campaign_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {campaign.notification_templates?.template_name} • {campaign.total_recipients} destinataires
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="font-medium">{campaign.sent_count}/{campaign.total_recipients}</p>
                          <p className="text-muted-foreground">
                            {campaign.total_recipients > 0 
                              ? ((campaign.sent_count / campaign.total_recipients) * 100).toFixed(0)
                              : 0}% envoyé
                          </p>
                        </div>
                        
                        <Badge variant={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            {/* Liste des templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(template.template_type)}
                        <CardTitle className="text-lg">{template.template_name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Badge variant="outline">{template.template_type}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {template.subject_template && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">SUJET</Label>
                        <p className="text-sm">{template.subject_template}</p>
                      </div>
                    )}
                    
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">CONTENU</Label>
                      <p className="text-sm text-muted-foreground">
                        {template.content_template.substring(0, 120)}...
                      </p>
                    </div>
                    
                    {Array.isArray(template.variables) && template.variables.length > 0 && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">VARIABLES</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.variables.slice(0, 3).map((variable: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => sendTestNotificationMutation.mutate({
                          templateName: template.template_name,
                          variables: { user_name: 'Test User', destination: 'Kinshasa' }
                        })}
                        disabled={sendTestNotificationMutation.isPending}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Campagnes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interface complète de gestion des campagnes en cours de développement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="segments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Segments d'Audience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Tous les utilisateurs</h4>
                      <p className="text-sm text-muted-foreground">Tous les utilisateurs actifs de la plateforme</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">2,347 utilisateurs</p>
                      <Badge variant="default">Dynamique</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Chauffeurs actifs</h4>
                      <p className="text-sm text-muted-foreground">Chauffeurs avec au moins une course ce mois</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">156 utilisateurs</p>
                      <Badge variant="default">Dynamique</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Clients premium</h4>
                      <p className="text-sm text-muted-foreground">Clients avec plus de 10 commandes</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">89 utilisateurs</p>
                      <Badge variant="default">Dynamique</Badge>
                    </div>
                  </div>
                 </div>
               </CardContent>
             </Card>
           </TabsContent>

           <TabsContent value="analytics" className="space-y-4">
             <NotificationAnalytics />
           </TabsContent>

           <TabsContent value="sender" className="space-y-4">
             <NotificationSender />
           </TabsContent>
         </Tabs>
       </div>
     </div>
   );
 };