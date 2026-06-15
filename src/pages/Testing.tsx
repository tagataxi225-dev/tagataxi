import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phase6TestingDashboard } from '@/components/testing/Phase6TestingDashboard';
import { PartnerSystemValidationDashboard } from '@/components/testing/PartnerSystemValidationDashboard';
import { Users, TestTube, Zap, ShieldCheck, CheckCircle, UtensilsCrossed, Ticket } from 'lucide-react';
import DispatcherValidation from './test/DispatcherValidation';
import AdminValidationTest from './test/AdminValidationTest';
import SystemValidation from './test/SystemValidation';
import RestaurantSystemValidation from './test/RestaurantSystemValidation';
import { LotteryAdminDashboard } from '@/components/admin/LotteryAdminDashboard';

const TestingPage = () => {
  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="validation" className="w-full">
        <TabsList className="grid w-full grid-cols-7 mb-6">
          <TabsTrigger value="validation" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Validation
          </TabsTrigger>
          <TabsTrigger value="restaurant" className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            Restaurant
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Admin
          </TabsTrigger>
          <TabsTrigger value="dispatcher" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Dispatcher
          </TabsTrigger>
          <TabsTrigger value="partner" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Partenaire
          </TabsTrigger>
          <TabsTrigger value="lottery" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Tombola
          </TabsTrigger>
          <TabsTrigger value="phase6" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Phase 6
          </TabsTrigger>
        </TabsList>

        <TabsContent value="validation">
          <SystemValidation />
        </TabsContent>

        <TabsContent value="restaurant">
          <RestaurantSystemValidation />
        </TabsContent>

        <TabsContent value="admin">
          <AdminValidationTest />
        </TabsContent>

        <TabsContent value="dispatcher">
          <DispatcherValidation />
        </TabsContent>

        <TabsContent value="partner">
          <PartnerSystemValidationDashboard />
        </TabsContent>

        <TabsContent value="lottery">
          <LotteryAdminDashboard />
        </TabsContent>

        <TabsContent value="phase6">
          <Phase6TestingDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestingPage;
