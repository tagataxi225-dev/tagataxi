import React from 'react';
import { TestSuite } from '@/components/testing/TestSuite';
import { MobilePerformanceMonitor } from '@/components/testing/MobilePerformanceMonitor';
import { RLSTestingPanel } from '@/components/testing/RLSTestingPanel';
import { ChatCriticalScenariosPanel } from '@/components/testing/ChatCriticalScenariosPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Smartphone, Zap, Shield, MessageCircle } from 'lucide-react';

export const Phase6TestingDashboard = () => {
  const testingPhases = [
    {
      name: "Workflow Taxi",
      description: "Test complet du processus de réservation → dispatch → course",
      status: "ready",
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      name: "Livraison E2E",
      description: "Test livraison end-to-end avec vraie géolocalisation",
      status: "ready", 
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      name: "Performance",
      description: "Temps de réponse < 2s pour toutes les opérations",
      status: "monitoring",
      icon: <Zap className="h-4 w-4" />
    },
    {
      name: "Mobile Responsive",
      description: "Interface mobile responsive et fluide",
      status: "active",
      icon: <Smartphone className="h-4 w-4" />
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'monitoring': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ready': return 'Prêt';
      case 'monitoring': return 'Surveillance';
      case 'active': return 'Actif';
      default: return 'En attente';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête Phase 6 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Phase 6 - Tests et Optimisation</h1>
        <p className="text-muted-foreground">
          Validation complète du système VTC multimodal KwendaTaxi
        </p>
      </div>

      {/* Vue d'ensemble des tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {testingPhases.map((phase, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                {phase.icon}
                <Badge className={getStatusColor(phase.status)}>
                  {getStatusLabel(phase.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">{phase.name}</CardTitle>
              <CardDescription className="text-sm">
                {phase.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tests" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Tests E2E</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" />
            <span>Chat Critique</span>
          </TabsTrigger>
          <TabsTrigger value="rls" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>RLS Security</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Smartphone className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="mt-6">
          <TestSuite />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <ChatCriticalScenariosPanel />
        </TabsContent>

        <TabsContent value="rls" className="mt-6">
          <RLSTestingPanel />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <MobilePerformanceMonitor />
        </TabsContent>
      </Tabs>

      {/* Résumé des objectifs Phase 6 */}
      <Card>
        <CardHeader>
          <CardTitle>Objectifs Phase 6</CardTitle>
          <CardDescription>
            Critères de validation pour la mise en production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Tests Fonctionnels</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Workflow taxi complet</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Livraison avec géolocalisation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Dispatch automatique</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Notifications push</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Performance & UX</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span>Temps de réponse &lt; 2s</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  <span>Interface mobile fluide</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Responsive design</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Optimisation mobile</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};