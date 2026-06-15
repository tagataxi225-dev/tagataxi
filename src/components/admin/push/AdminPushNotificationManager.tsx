import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, History, FileText, BarChart3 } from 'lucide-react';
import { NotificationSendForm } from './NotificationSendForm';
import { NotificationHistory } from './NotificationHistory';
import { NotificationTemplates } from './NotificationTemplates';
import { NotificationStatistics } from './NotificationStatistics';

export const AdminPushNotificationManager = () => {
  const [activeTab, setActiveTab] = useState('send');

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold">Notifications Push</h2>
        <p className="text-muted-foreground mt-2">
          Envoyez des notifications ciblées aux utilisateurs de l'application
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="send" className="gap-2">
            <Send className="w-4 h-4" />
            Envoyer
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="mt-6">
          <NotificationSendForm />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <NotificationHistory />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <NotificationTemplates />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <NotificationStatistics />
        </TabsContent>
      </Tabs>
    </div>
  );
};
