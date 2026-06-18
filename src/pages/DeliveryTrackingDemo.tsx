import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import DeliveryStatusModal from '@/components/delivery/DeliveryStatusModal';
import UniversalTracker from '@/components/tracking/UniversalTracker';
import SimpleDeliveryNotificationCenter from '@/components/delivery/SimpleDeliveryNotificationCenter';
import SimpleDeliveryChat from '@/components/delivery/SimpleDeliveryChat';
import EnhancedDeliveryTimeline from '@/components/delivery/EnhancedDeliveryTimeline';
import DeliveryValidationInterface from '@/components/delivery/DeliveryValidationInterface';
import DeliveryProofViewer from '@/components/delivery/DeliveryProofViewer';
import { 
  Package, 
  MapPin, 
  Phone, 
  MessageCircle,
  BarChart3,
  CheckCircle2,
  Camera,
  Star
} from 'lucide-react';

export default function DeliveryTrackingDemo() {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showProofViewer, setShowProofViewer] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Données de démonstration
  const demoOrderId = 'demo-order-123';
  const demoUserId = 'demo-user-456';
  
  const demoOrderData = {
    pickup_location: 'Avenue Université, Kinshasa',
    delivery_location: 'Boulevard du 30 Juin, Kinshasa', 
    recipient_name: 'Marie Kabila',
    recipient_phone: '+243 123 456 789',
    package_description: 'Documents importants',
    delivery_type: 'flash',
    estimated_price: 15000
  };

  const demoTimeline = [
    {
      id: '1',
      status: 'pending',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      notes: 'Commande reçue et en cours de traitement'
    },
    {
      id: '2', 
      status: 'confirmed',
      timestamp: new Date(Date.now() - 3000000).toISOString(),
      notes: 'Commande confirmée, recherche de chauffeur'
    },
    {
      id: '3',
      status: 'driver_assigned', 
      timestamp: new Date(Date.now() - 2400000).toISOString(),
      notes: 'Jean-Pierre Mvuemba assigné à votre livraison',
      changed_by: 'Système'
    },
    {
      id: '4',
      status: 'picked_up',
      timestamp: new Date(Date.now() - 1800000).toISOString(), 
      notes: 'Colis récupéré avec succès',
      photo_url: '/placeholder-package.jpg',
      location: {
        lat: -4.3917,
        lng: 15.2941,
        address: 'Avenue Université, Kinshasa'
      }
    }
  ];

  const demoProof = {
    orderId: demoOrderId,
    deliveryPhoto: '/placeholder-delivery.jpg',
    recipientName: 'Marie Kabila',
    deliveredAt: new Date().toISOString(),
    deliveryLocation: 'Boulevard du 30 Juin, Kinshasa',
    driverName: 'Jean-Pierre Mvuemba',
    packageDescription: 'Documents importants',
    notes: 'Livraison effectuée en mains propres'
  };

  const handleTrack = () => {
    setSelectedTab('timeline');
  };

  const handleContact = () => {
    setSelectedTab('chat');
  };

  const handleNotificationClick = () => {
    setShowStatusModal(true);
  };

  const handleViewPhoto = (url: string) => {
    console.log('Viewing photo:', url);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Démo Suivi de Livraison TAGA
          </h1>
          <p className="text-muted-foreground">
            Système complet de suivi de livraison avec validation étape par étape
          </p>
        </div>

        {/* Demo Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Actions de Démonstration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setShowStatusModal(true)}>
                <Package className="h-4 w-4 mr-2" />
                Modal de Statut
              </Button>
              <Button variant="outline" onClick={() => setShowProofViewer(true)}>
                <Camera className="h-4 w-4 mr-2" />
                Preuve de Livraison
              </Button>
              <Button variant="outline" onClick={() => setSelectedTab('validation')}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Interface Chauffeur
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tracker Universel - Mode Compact */}
              <UniversalTracker 
                orderId={demoOrderId}
                orderType="delivery"
                compact={true}
                showMap={false}
                showChat={false}
              />
              
              {/* Info Commande */}
              <Card>
                <CardHeader>
                  <CardTitle>Détails de la Commande</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">De: {demoOrderData.pickup_location}</p>
                      <p className="text-sm text-muted-foreground">Vers: {demoOrderData.delivery_location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{demoOrderData.package_description}</p>
                      <p className="text-sm text-muted-foreground">Type: {demoOrderData.delivery_type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Prix estimé:</span>
                    <Badge variant="outline">{demoOrderData.estimated_price.toLocaleString()} CDF</Badge>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleTrack} className="flex-1">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Voir Timeline
                    </Button>
                    <Button variant="outline" onClick={handleContact}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <EnhancedDeliveryTimeline
              orderId={demoOrderId}
              currentStatus="picked_up"
              timeline={demoTimeline}
              driverInfo={{
                name: 'Jean-Pierre Mvuemba',
                phone: '+243 987 654 321',
                vehicle: 'Moto Honda 125cc',
                rating: 4.8
              }}
              onContactDriver={() => setSelectedTab('chat')}
              onViewMap={() => console.log('Ouvrir carte')}
              onViewPhoto={handleViewPhoto}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <SimpleDeliveryNotificationCenter
              userId={demoUserId}
              onNotificationClick={handleNotificationClick}
            />
          </TabsContent>

          <TabsContent value="chat">
            <SimpleDeliveryChat
              orderId={demoOrderId}
              userType="client"
              userId={demoUserId}
              partnerName="Jean-Pierre Mvuemba"
              partnerPhone="+243 987 654 321"
              onCall={() => console.log('Appel chauffeur')}
            />
          </TabsContent>

          <TabsContent value="validation">
            <DeliveryValidationInterface
              orderId={demoOrderId}
              orderData={demoOrderData}
              onValidationComplete={(data) => {
                console.log('Validation complète:', data);
                setShowProofViewer(true);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Status Modal */}
        <DeliveryStatusModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          orderId={demoOrderId}
          status="picked_up"
          amount={demoOrderData.estimated_price}
          estimatedTime="15 minutes"
          driverName="Jean-Pierre Mvuemba"
          driverPhone="+243 987 654 321"
          onTrack={handleTrack}
          onContact={handleContact}
        />

        {/* Proof Viewer */}
        <DeliveryProofViewer
          isOpen={showProofViewer}
          onClose={() => setShowProofViewer(false)}
          proof={demoProof}
        />
      </div>
    </div>
  );
}