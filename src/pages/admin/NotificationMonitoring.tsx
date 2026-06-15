/**
 * Hook pour intégrer la page admin de monitoring des notifications
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationMonitoringDashboard } from '@/components/admin/NotificationMonitoringDashboard';
import { AdminNotificationSender } from '@/components/admin/AdminNotificationSender';
import { DispatchMonitor } from '@/components/admin/DispatchMonitor';

export const AdminNotificationPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="send" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send">Envoyer Notifications</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring & Analytics</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch System</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <AdminNotificationSender />
        </TabsContent>

        <TabsContent value="monitoring">
          <NotificationMonitoringDashboard />
        </TabsContent>

        <TabsContent value="dispatch">
          <DispatchMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotificationPage;