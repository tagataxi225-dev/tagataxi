import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { NotificationPreferencesPanel } from '@/components/notifications/NotificationPreferencesPanel';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const NotificationsPageContent: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('notifications');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Centre de notifications</h1>
              <p className="text-xs text-muted-foreground">
                Gérez vos alertes et préférences
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pb-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Préférences
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'notifications' ? (
          <NotificationCenter className="h-full" />
        ) : (
          <div className="p-4 overflow-y-auto h-full">
            <NotificationPreferencesPanel />
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationsPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <NotificationsPageContent />
    </ProtectedRoute>
  );
};

export default NotificationsPage;
