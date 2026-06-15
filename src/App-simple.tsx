import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import AuthPage from '@/pages/AuthPage';
import StepByStepDeliveryInterface from '@/components/delivery/StepByStepDeliveryInterface';
import DeliveryServiceManager from '@/components/admin/DeliveryServiceManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Settings, Users, BarChart } from 'lucide-react';

function App() {
  const handleDeliverySubmit = (data: any) => {
    console.log('Delivery submitted:', data);
  };

  const handleDeliveryCancel = () => {
    console.log('Delivery cancelled');
  };

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Page d'authentification admin */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Interface de livraison principale */}
          <Route path="/delivery" element={
            <div className="container mx-auto p-4">
              <StepByStepDeliveryInterface 
                onSubmit={handleDeliverySubmit}
                onCancel={handleDeliveryCancel}
              />
            </div>
          } />
          
          {/* Interface d'administration des services */}
          <Route path="/admin/services" element={
            <div className="container mx-auto p-4">
              <DeliveryServiceManager />
            </div>
          } />
          
          {/* Page d'accueil avec navigation */}
          <Route path="/" element={
            <div className="container mx-auto p-4 space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold">Tembea</h1>
                <p className="text-xl text-muted-foreground">
                  Plateforme de transport et livraison
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {/* Service de livraison */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/delivery'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Service de Livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Commandez une livraison express, standard ou gros volume
                    </p>
                    <Button className="w-full">
                      Commander une livraison
                    </Button>
                  </CardContent>
                </Card>

                {/* Administration */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/auth'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Administration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Accès administrateur pour gérer les services et tarifs
                    </p>
                    <Button variant="outline" className="w-full">
                      Accès Admin
                    </Button>
                  </CardContent>
                </Card>

                {/* Gestion des services */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/services'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5" />
                      Gestion Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Configurer les services de livraison et tarifs par ville
                    </p>
                    <Button variant="secondary" className="w-full">
                      Gérer les services
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  🌍 Service disponible à Kinshasa, Lubumbashi, Kolwezi et Abidjan
                </p>
              </div>
            </div>
          } />
          
          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster />
      </div>
    </Router>
  );
}

export default App;