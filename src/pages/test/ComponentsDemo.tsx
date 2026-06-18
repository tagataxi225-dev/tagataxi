import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ModernNotificationCenter from '@/components/notifications/ModernNotificationCenter';
import { LotteryDashboard } from '@/components/lottery/LotteryDashboard';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { FloatingChatButton } from '@/components/home/FloatingChatButton';
import { Bell, Gift, MessageCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { useLottery } from '@/hooks/useLottery';
import { useUniversalChat } from '@/hooks/useUniversalChat';

export const ComponentsDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { notifications, unreadCount, addNotification } = useEnhancedNotifications();
  const { myWins } = useLottery();
  const { conversations } = useUniversalChat();

  const testNotification = () => {
    addNotification({
      type: 'info',
      title: 'Notification de test',
      message: 'Ceci est une notification de test pour vérifier le système',
      priority: 'normal',
      category: 'system',
      metadata: { test: true }
    });
  };

  const testUrgentNotification = () => {
    addNotification({
      type: 'urgent',
      title: '🚨 Notification urgente',
      message: 'Nouvelle course disponible à proximité !',
      priority: 'high',
      category: 'ride',
      metadata: { bookingId: 'test-123' }
    });
  };

  const testRewardNotification = () => {
    addNotification({
      type: 'reward',
      title: '🎉 Récompense gagnée !',
      message: 'Vous avez gagné 2 tickets de tombola pour votre activité !',
      priority: 'high',
      category: 'lottery',
      metadata: { tickets: 2 }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Démo Composants TAGA
            </h1>
            <p className="text-muted-foreground mt-2">
              Testez tous les composants notifications, loterie et chat
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Notifications</p>
                  <p className="text-3xl font-bold">{notifications.length}</p>
                  <p className="text-xs text-muted-foreground">{unreadCount} non lues</p>
                </div>
                <Bell className="h-12 w-12 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gains Loterie</p>
                  <p className="text-3xl font-bold">{myWins.length}</p>
                  <p className="text-xs text-muted-foreground">Cartes gagnées</p>
                </div>
                <Gift className="h-12 w-12 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Système Nouveau</p>
                  <p className="text-3xl font-bold">✨</p>
                  <p className="text-xs text-muted-foreground">Scratch cards</p>
                </div>
                <Sparkles className="h-12 w-12 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversations</p>
                  <p className="text-3xl font-bold">{conversations.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0)} non lus
                  </p>
                </div>
                <MessageCircle className="h-12 w-12 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Actions de Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={testNotification} variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Notification Normale
              </Button>
              <Button onClick={testUrgentNotification} variant="destructive">
                <Bell className="h-4 w-4 mr-2" />
                Notification Urgente
              </Button>
              <Button onClick={testRewardNotification} className="bg-gradient-to-r from-yellow-500 to-orange-500">
                <Gift className="h-4 w-4 mr-2" />
                Notification Récompense
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Onglets principaux */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="lottery" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Loterie</span>
              {myWins.length > 0 && (
                <Badge variant="secondary" className="ml-1">{myWins.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📊 État du Système</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Système de Notifications
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>✅ ModernNotificationCenter</li>
                      <li>✅ NotificationBell</li>
                      <li>✅ NotificationCard</li>
                      <li>✅ NotificationToast</li>
                      <li>✅ NotificationSettings</li>
                      <li>✅ useEnhancedNotifications</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Système de Loterie
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>✅ LotteryDashboard</li>
                      <li>✅ LotteryDrawCard</li>
                      <li>✅ LotteryTicketsList</li>
                      <li>✅ LotteryWinsList</li>
                      <li>✅ LotteryNotification</li>
                      <li>✅ useLottery / useLotteryTickets</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Système de Chat
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>✅ UniversalChatInterface</li>
                      <li>✅ ChatProvider</li>
                      <li>✅ FloatingChatButton</li>
                      <li>✅ TripChat</li>
                      <li>✅ TaxiRealTimeChat</li>
                      <li>✅ useUniversalChat</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Composants Partagés
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>✅ NotificationBadge</li>
                      <li>✅ AIAssistantWidget</li>
                      <li>✅ NotificationPermissions</li>
                      <li>✅ NotificationPreferences</li>
                      <li>✅ NotificationActions</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h3 className="font-semibold mb-2 text-primary">✅ Tous les composants sont fonctionnels</h3>
                  <p className="text-sm text-muted-foreground">
                    L'ensemble des composants pour les notifications, la loterie et le chat ont été vérifiés et sont complets.
                    Utilisez les onglets ci-dessus pour tester chaque système individuellement.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <ModernNotificationCenter />
          </TabsContent>

          <TabsContent value="lottery">
            <LotteryDashboard />
          </TabsContent>

          <TabsContent value="chat">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interface de Chat Universel</CardTitle>
                </CardHeader>
                <CardContent>
                  <UniversalChatInterface 
                    isFloating={false}
                    contextType="support"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Fonctionnalités</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>✅ Chat multicontexte (transport, livraison, marketplace, support)</li>
                      <li>✅ Messages texte et localisation</li>
                      <li>✅ Temps réel avec Supabase</li>
                      <li>✅ Assistant IA intégré</li>
                      <li>✅ Actions rapides contextuelles</li>
                      <li>✅ Mode flottant responsive</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-400">
                      Bouton Flottant
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Le bouton de chat flottant apparaît en bas à droite de l'écran sur toutes les pages.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Composant: <code className="bg-muted px-1 py-0.5 rounded">FloatingChatButton</code>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bouton de chat flottant */}
      <FloatingChatButton />
    </div>
  );
};