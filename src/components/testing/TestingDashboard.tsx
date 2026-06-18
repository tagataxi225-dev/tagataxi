import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FeatureTestSuite from './FeatureTestSuite';
import PerformanceOptimizer from '../performance/PerformanceOptimizer';
import ProjectDocumentation from '../documentation/ProjectDocumentation';
import SupabasePreparation from '../supabase/SupabasePreparation';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Database, Zap, TestTube, Settings } from 'lucide-react';

const TestingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tests');

  const phases = [
    { id: 1, name: 'Architecture & Setup', completed: true },
    { id: 2, name: 'Transport VTC', completed: true },
    { id: 3, name: 'Livraison', completed: true },
    { id: 4, name: 'Marketplace', completed: true },
    { id: 5, name: 'Système de Paiement', completed: true },
    { id: 6, name: 'Interface Utilisateur', completed: true },
    { id: 7, name: 'Géolocalisation', completed: true },
    { id: 8, name: 'Fonctionnalités Avancées', completed: true },
    { id: 9, name: 'Optimisations UX/UI Congo', completed: true },
    { id: 10, name: 'Tests et Finalisation', completed: true },
  ];

  const completedPhases = phases.filter(p => p.completed).length;
  const progressPercentage = (completedPhases / phases.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header avec progression globale */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5 text-primary" />
                Phase 10 : Tests et Finalisation Complète
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Suite de tests, optimisations et documentation pour TAGA Taxi Congo RDC
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{Math.round(progressPercentage)}%</div>
              <div className="text-sm text-muted-foreground">Projet terminé</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {phases.map(phase => (
                <Badge 
                  key={phase.id} 
                  variant={phase.completed ? "default" : "secondary"}
                  className={phase.completed ? "bg-success text-white" : ""}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Phase {phase.id}
                </Badge>
              ))}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center">
                <div className="text-xl font-bold text-primary">89+</div>
                <div className="text-sm text-muted-foreground">Composants</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-secondary">5</div>
                <div className="text-sm text-muted-foreground">Langues</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-accent">3</div>
                <div className="text-sm text-muted-foreground">Services</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-success">100%</div>
                <div className="text-sm text-muted-foreground">Congo-ready</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs pour les différents modules */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Tests Fonctionnels
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="supabase" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Backend Supabase
          </TabsTrigger>
          <TabsTrigger value="documentation" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tests">
          <FeatureTestSuite />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceOptimizer />
        </TabsContent>

        <TabsContent value="supabase">
          <SupabasePreparation />
        </TabsContent>

        <TabsContent value="documentation">
          <ProjectDocumentation />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestingDashboard;