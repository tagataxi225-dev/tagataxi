/**
 * 🎯 TRACKER DE LIVRAISON UNIFIÉ ET FONCTIONNEL
 * 
 * Interface moderne qui corrige tous les problèmes :
 * - Suivi temps réel avec position chauffeur
 * - Chat client-chauffeur intégré
 * - Appels téléphoniques fonctionnels
 * - Interface adaptée selon le rôle (client/chauffeur)
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  Navigation, 
  Clock, 
  User,
  Send,
  Package,
  Truck,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
  Star,
  AlertCircle
} from 'lucide-react';
import { useRealTimeDeliveryTracking } from '@/hooks/useRealTimeDeliveryTracking';
import { useUserRole } from '@/hooks/useUserRole';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface UnifiedDeliveryTrackerProps {
  orderId: string;
  onBack?: () => void;
}

export default function UnifiedDeliveryTracker({ orderId, onBack }: UnifiedDeliveryTrackerProps) {
  const { userRole } = useUserRole();
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  
  const {
    trackingData,
    loading,
    error,
    connectionStatus,
    sendMessage,
    callDriver,
    callClient,
    openMapsNavigation,
    refreshTracking,
    getStatusLabel
  } = useRealTimeDeliveryTracking({
    orderId,
    enableDriverTracking: true,
    enableChat: true
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_transit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'picked_up': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressPercentage = (status: string): number => {
    const progressMap: Record<string, number> = {
      'pending': 10,
      'confirmed': 25,
      'driver_assigned': 40,
      'picked_up': 60,
      'in_transit': 80,
      'delivered': 100,
      'cancelled': 0
    };
    return progressMap[status] || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
            <div className="w-32 h-6 bg-muted rounded animate-pulse" />
            <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="w-2/3 h-4 bg-muted rounded" />
                <div className="w-full h-3 bg-muted rounded" />
                <div className="w-1/2 h-3 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-destructive/5 p-4">
        <div className="max-w-md mx-auto">
          <Card className="border-destructive/20">
            <CardContent className="p-6 text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-destructive">Erreur de chargement</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={refreshTracking} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!trackingData.order) return null;

  const { order, driverProfile, clientProfile, driverLocation, chatMessages, eta, distance } = trackingData;
  const isDriver = userRole === 'chauffeur';
  const contactProfile = isDriver ? clientProfile : driverProfile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-xl border-b p-4 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-primary" />
            <span className="font-medium">Livraison {order.delivery_type}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`} />
            <Button variant="ghost" size="icon" onClick={refreshTracking}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
        {/* Statut de la commande */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{getStatusLabel(order.status)}</h2>
                    <p className="text-sm text-muted-foreground">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {getProgressPercentage(order.status)}%
                  </Badge>
                </div>
                
                {/* Barre de progression */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage(order.status)}%` }}
                  />
                </div>
                
                {/* ETA et distance */}
                {eta && distance && driverLocation && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>ETA: {eta} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{distance.toFixed(1)} km</span>
                    </div>
                  </div>
                )}
                
                {/* Prix */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Prix</span>
                  <span className="font-semibold text-primary">
                    {(order.actual_price || order.estimated_price).toLocaleString()} CDF
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profil du contact (chauffeur ou client) */}
        {contactProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {(driverProfile?.profile_photo_url && !isDriver) ? (
                        <img 
                          src={driverProfile.profile_photo_url} 
                          alt={contactProfile.display_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{contactProfile.display_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {isDriver ? 'Client' : 'Chauffeur'}
                      </p>
                      {driverProfile?.rating_average && !isDriver && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">
                            {driverProfile.rating_average.toFixed(1)} ({driverProfile.rating_count})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Informations véhicule (si chauffeur) */}
                  {driverProfile && !isDriver && (
                    <div className="text-sm space-y-1">
                      {driverProfile.vehicle_model && (
                        <p className="text-muted-foreground">
                          🚗 {driverProfile.vehicle_model}
                          {driverProfile.vehicle_color && ` ${driverProfile.vehicle_color}`}
                        </p>
                      )}
                      {driverProfile.vehicle_plate && (
                        <p className="text-muted-foreground">
                          🏷️ {driverProfile.vehicle_plate}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Actions de communication */}
                  <div className="flex space-x-2">
                    <Button 
                      onClick={isDriver ? callClient : callDriver} 
                      className="flex-1"
                      disabled={!contactProfile.phone_number}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Appeler
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowChat(!showChat)}
                      className="flex-1"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Itinéraire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-medium flex items-center">
                  <Navigation className="w-4 h-4 mr-2" />
                  Itinéraire
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Récupération</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.pickup_location}
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-1.5 border-l border-dashed border-muted-foreground/30 h-6" />
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Livraison</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.delivery_location}
                      </p>
                    </div>
                  </div>
                </div>
                
                {driverLocation && (
                  <Button 
                    onClick={openMapsNavigation} 
                    variant="outline" 
                    className="w-full"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Voir la position en temps réel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interface de chat */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Chat en direct</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Messages */}
                  <ScrollArea className="h-64 w-full border rounded-md p-4">
                    <div className="space-y-3">
                      {chatMessages.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center">
                          Aucun message encore. Commencez la conversation !
                        </p>
                      ) : (
                        chatMessages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${
                              msg.sender_type === (isDriver ? 'driver' : 'client') 
                                ? 'justify-end' 
                                : 'justify-start'
                            }`}
                          >
                            <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                              msg.sender_type === (isDriver ? 'driver' : 'client')
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}>
                              <p>{msg.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.sent_at).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  
                  {/* Saisie de message */}
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Tapez votre message..."
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!newMessage.trim()}
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}