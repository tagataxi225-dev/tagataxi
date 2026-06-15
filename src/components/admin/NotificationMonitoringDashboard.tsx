/**
 * Interface admin pour le monitoring des notifications push
 * Tableau de bord complet avec statistiques, queue et logs
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Send, Bell, AlertTriangle, CheckCircle, Clock, XCircle, Users, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { pushNotificationService } from '@/services/pushNotificationService';

interface NotificationStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  retry: number;
  total: number;
}

interface QueueItem {
  id: string;
  type: string;
  title: string;
  body: string;
  priority: string;
  status: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  scheduled_for?: string;
  sent_at?: string;
  error_message?: string;
}

interface UserToken {
  user_id: string;
  token: string;
  platform: string;
  is_active: boolean;
  created_at: string;
  last_used: string;
}

export const NotificationMonitoringDashboard: React.FC = () => {
  const [stats, setStats] = useState<NotificationStats>({
    pending: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    retry: 0,
    total: 0
  });

  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [userTokens, setUserTokens] = useState<UserToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Formulaire d'envoi
  const [sendForm, setSendForm] = useState({
    type: 'broadcast',
    recipients: 'all_drivers',
    title: '',
    body: '',
    priority: 'normal'
  });

  const { toast } = useToast();

  /**
   * Charger les statistiques
   */
  const loadStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('notification-dispatcher/status');
      
      if (error) {
        console.error('Erreur chargement stats:', error);
        return;
      }
      
      setStats(data?.stats || {});
    } catch (error) {
      console.error('Erreur appel stats:', error);
    }
  };

  /**
   * Charger la queue de notifications
   */
  const loadQueue = async () => {
    try {
      // Utiliser Edge Function pour obtenir les données de queue
      const { data, error } = await supabase.functions.invoke('notification-dispatcher/queue');
      
      if (error) {
        console.error('Erreur chargement queue:', error);
        return;
      }

      setQueueItems(data?.queue || []);
    } catch (error) {
      console.error('Erreur chargement queue:', error);
    }
  };

  /**
   * Charger les tokens utilisateurs
   */
  const loadUserTokens = async () => {
    try {
      // Utiliser Edge Function pour obtenir les tokens
      const { data, error } = await supabase.functions.invoke('notification-dispatcher/tokens');
      
      if (error) {
        console.error('Erreur chargement tokens:', error);
        return;
      }

      setUserTokens(data?.tokens || []);
    } catch (error) {
      console.error('Erreur chargement tokens:', error);
    }
  };

  /**
   * Traiter la queue manuellement
   */
  const processQueue = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('notification-dispatcher/process-queue');
      
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de traiter la queue.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Queue traitée",
        description: `${data.processed} notifications envoyées, ${data.failed} échecs.`,
      });
      
      // Recharger les données
      await Promise.all([loadStats(), loadQueue()]);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Réessayer les notifications échouées
   */
  const retryFailed = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('notification-dispatcher/retry-failed');
      
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de relancer les notifications.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Notifications relancées",
        description: `${data.retried} notifications remises en queue.`,
      });
      
      await Promise.all([loadStats(), loadQueue()]);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du relancement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Envoyer une notification personnalisée
   */
  const handleSendNotification = async () => {
    if (!sendForm.title || !sendForm.body) {
      toast({
        title: "Champs requis",
        description: "Titre et message sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let recipients = [];
      
      if (sendForm.recipients === 'all_drivers') {
        recipients = ['all_drivers'];
      } else if (sendForm.recipients === 'all_clients') {
        recipients = ['all_clients'];
      } else {
        // IDs spécifiques séparés par des virgules
        recipients = sendForm.recipients.split(',').map(id => id.trim()).filter(Boolean);
      }

      // Simplifié : utiliser pushNotificationService directement
      await pushNotificationService.showNotification(sendForm.title, {
        body: sendForm.body,
      });

      const success = true;

      if (success) {
        setSendForm({
          type: 'broadcast',
          recipients: 'all_drivers',
          title: '',
          body: '',
          priority: 'normal'
        });
        
        // Recharger les données
        await Promise.all([loadStats(), loadQueue()]);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualiser toutes les données
   */
  const refreshAll = async () => {
    setLoading(true);
    
    try {
      await Promise.all([
        loadStats(),
        loadQueue(),
        loadUserTokens()
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtenir la couleur du badge selon le statut
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'processing': return 'bg-info text-info-foreground';
      case 'failed': return 'bg-destructive text-destructive-foreground';
      case 'retry': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  /**
   * Obtenir l'icône selon le statut
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'retry': return <RefreshCw className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  // Initialiser et configurer l'auto-refresh
  useEffect(() => {
    refreshAll();
    
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(() => {
      loadStats();
      loadQueue();
    }, 30000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Cleanup interval
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Monitoring Notifications Push</h2>
          <p className="text-muted-foreground">
            Surveillance et gestion des notifications push en temps réel
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshAll}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button 
            onClick={processQueue}
            disabled={loading}
          >
            <Send className="w-4 h-4 mr-2" />
            Traiter Queue
          </Button>
          
          <Button 
            variant="secondary"
            onClick={retryFailed}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Relancer Échecs
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold text-info">{stats.processing}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-info animate-spin" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Envoyées</p>
                <p className="text-2xl font-bold text-success">{stats.sent}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Échecs</p>
                <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Retry</p>
                <p className="text-2xl font-bold text-secondary">{stats.retry}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total 24h</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="send" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="send">Envoyer</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Onglet Envoi */}
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Envoyer une notification</CardTitle>
              <CardDescription>
                Créer et envoyer une notification push personnalisée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={sendForm.type} onValueChange={(value) => setSendForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="broadcast">Diffusion</SelectItem>
                      <SelectItem value="driver_assignment">Affectation chauffeur</SelectItem>
                      <SelectItem value="order_update">Mise à jour commande</SelectItem>
                      <SelectItem value="emergency">Urgence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipients">Destinataires</Label>
                  <Select value={sendForm.recipients} onValueChange={(value) => setSendForm(prev => ({ ...prev, recipients: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_drivers">Tous les chauffeurs</SelectItem>
                      <SelectItem value="all_clients">Tous les clients</SelectItem>
                      <SelectItem value="custom">IDs personnalisés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select value={sendForm.priority} onValueChange={(value) => setSendForm(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="normal">Normale</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sendForm.recipients === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-recipients">IDs utilisateurs (séparés par des virgules)</Label>
                  <Input
                    id="custom-recipients"
                    placeholder="uuid1, uuid2, uuid3..."
                    value={sendForm.recipients}
                    onChange={(e) => setSendForm(prev => ({ ...prev, recipients: e.target.value }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  placeholder="Titre de la notification"
                  value={sendForm.title}
                  onChange={(e) => setSendForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  placeholder="Contenu de la notification"
                  value={sendForm.body}
                  onChange={(e) => setSendForm(prev => ({ ...prev, body: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleSendNotification}
                disabled={loading || !sendForm.title || !sendForm.body}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Envoi...' : 'Envoyer la notification'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Queue */}
        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Queue des notifications</CardTitle>
              <CardDescription>
                Liste des notifications en attente et historique récent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queueItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.title}</h4>
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusIcon(item.status)}
                            <span className="ml-1">{item.status}</span>
                          </Badge>
                          <Badge variant="outline">{item.priority}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.body}</p>
                        <p className="text-xs text-muted-foreground">Type: {item.type}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Créé: {new Date(item.created_at).toLocaleString()}</span>
                      {item.scheduled_for && (
                        <span>Programmé: {new Date(item.scheduled_for).toLocaleString()}</span>
                      )}
                      {item.sent_at && (
                        <span>Envoyé: {new Date(item.sent_at).toLocaleString()}</span>
                      )}
                      <span>Retry: {item.retry_count}/{item.max_retries}</span>
                      {item.error_message && (
                        <span className="text-destructive">Erreur: {item.error_message}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {queueItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune notification dans la queue</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Tokens */}
        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle>Tokens des utilisateurs</CardTitle>
              <CardDescription>
                Liste des tokens push actifs par plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Statistiques des tokens */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Smartphone className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-sm text-muted-foreground">iOS</p>
                      <p className="text-xl font-bold">
                        {userTokens.filter(t => t.platform === 'ios' && t.is_active).length}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Smartphone className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p className="text-sm text-muted-foreground">Android</p>
                      <p className="text-xl font-bold">
                        {userTokens.filter(t => t.platform === 'android' && t.is_active).length}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                      <p className="text-sm text-muted-foreground">Web</p>
                      <p className="text-xl font-bold">
                        {userTokens.filter(t => t.platform === 'web' && t.is_active).length}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Liste des tokens */}
                <div className="space-y-3">
                  {userTokens.slice(0, 20).map((token) => (
                    <div key={token.user_id + token.token} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            User: {token.user_id.substring(0, 8)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Token: {token.token.substring(0, 30)}...
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={token.platform === 'ios' ? 'default' : token.platform === 'android' ? 'secondary' : 'outline'}>
                            {token.platform}
                          </Badge>
                          
                          <Badge variant={token.is_active ? 'default' : 'destructive'}>
                            {token.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                        <span>Créé: {new Date(token.created_at).toLocaleDateString()}</span>
                        {token.last_used && (
                          <span>Dernière utilisation: {new Date(token.last_used).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {userTokens.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun token push enregistré</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Analytics */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics des notifications</CardTitle>
              <CardDescription>
                Statistiques d'utilisation et de performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Taux de réussite */}
                <div>
                  <h4 className="font-medium mb-3">Taux de réussite (24h)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Notifications envoyées</span>
                      <span className="font-medium text-success">{stats.sent}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Échecs</span>
                      <span className="font-medium text-destructive">{stats.failed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taux de réussite</span>
                      <span className="font-medium">
                        {stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Distribution par plateforme */}
                <div>
                  <h4 className="font-medium mb-3">Distribution par plateforme</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>iOS</span>
                      <span className="font-medium">
                        {userTokens.filter(t => t.platform === 'ios' && t.is_active).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Android</span>
                      <span className="font-medium">
                        {userTokens.filter(t => t.platform === 'android' && t.is_active).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Web</span>
                      <span className="font-medium">
                        {userTokens.filter(t => t.platform === 'web' && t.is_active).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div>
                  <h4 className="font-medium mb-3">Performance du système</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-warning">{stats.pending}</p>
                        <p className="text-sm text-muted-foreground">En attente</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-secondary">{stats.retry}</p>
                        <p className="text-sm text-muted-foreground">En retry</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};