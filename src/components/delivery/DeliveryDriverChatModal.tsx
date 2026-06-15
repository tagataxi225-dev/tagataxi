/**
 * Modal de chat temps réel avec le livreur
 * Permet la communication directe pendant la livraison
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  MapPin,
  Clock,
  X,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'driver';
  message: string;
  timestamp: Date;
  type?: 'text' | 'location' | 'photo';
}

interface DeliveryDriverChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverData: {
    driver_id: string;
    driver_profile: {
      display_name: string;
      phone_number: string;
      rating_average: number;
      vehicle_type: string;
      vehicle_plate: string;
    };
    distance: number;
    estimated_arrival: number;
  };
  orderId: string;
  deliveryPrice: number;
}

export const DeliveryDriverChatModal: React.FC<DeliveryDriverChatModalProps> = ({
  isOpen,
  onClose,
  driverData,
  orderId,
  deliveryPrice
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Messages automatiques initiaux
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessages: ChatMessage[] = [
        {
          id: '1',
          sender: 'driver',
          message: `Bonjour ! Je suis ${driverData.driver_profile.display_name}, votre livreur. J'arrive dans ${driverData.estimated_arrival} minutes.`,
          timestamp: new Date()
        },
        {
          id: '2',
          sender: 'driver',
          message: `Véhicule: ${driverData.driver_profile.vehicle_type} (${driverData.driver_profile.vehicle_plate})`,
          timestamp: new Date(Date.now() + 1000)
        }
      ];
      setMessages(welcomeMessages);
    }
  }, [isOpen, driverData]);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageToSend = newMessage.trim();
    
    try {
      // Ajouter le message localement immédiatement
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        message: messageToSend,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');

      // Simuler l'envoi du message (à remplacer par une vraie API)
      setTimeout(() => {
        // Réponse automatique du livreur (à remplacer par un vrai système)
        const driverResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'driver',
          message: 'Message reçu ! Je vous tiens au courant.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, driverResponse]);
      }, 1500);

    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCallDriver = () => {
    if (driverData.driver_profile.phone_number) {
      window.location.href = `tel:${driverData.driver_profile.phone_number}`;
    } else {
      toast.error('Numéro de téléphone non disponible');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="w-full max-w-md h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="flex-1 flex flex-col">
              {/* Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {driverData.driver_profile.display_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          En ligne
                        </Badge>
                        <span>•</span>
                        <span>{driverData.estimated_arrival} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCallDriver}
                      className="p-2"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onClose}
                      className="p-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Infos livraison */}
                <div className="bg-muted/30 rounded-lg p-3 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="font-medium">Commande #{orderId.slice(-8)}</span>
                    </div>
                    <span className="font-semibold text-primary">
                      {formatCurrency(deliveryPrice)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{driverData.distance.toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Arrive dans {driverData.estimated_arrival} min</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'user' 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Zone de saisie */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                    className="px-3"
                  >
                    {sending ? (
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeliveryDriverChatModal;