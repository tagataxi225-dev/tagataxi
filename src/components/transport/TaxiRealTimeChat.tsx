import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Phone, Navigation, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  message: string;
  sender_type: 'client' | 'driver';
  sender_name: string;
  timestamp: string;
  message_type?: 'text' | 'location' | 'system';
  metadata?: any;
}

interface Driver {
  id: string;
  display_name: string;
  phone_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  rating_average: number;
  current_location?: { lat: number; lng: number };
}

interface TaxiRealTimeChatProps {
  bookingId: string;
  driver?: Driver;
  isActive: boolean;
  onClose?: () => void;
}

const quickMessages = [
  { text: "J'arrive dans 5 minutes", icon: Clock },
  { text: "Je suis arrivé", icon: Navigation },
  { text: "Où êtes-vous exactement ?", icon: User },
  { text: "Problème de circulation", icon: MessageCircle }
];

export const TaxiRealTimeChat: React.FC<TaxiRealTimeChatProps> = ({
  bookingId,
  driver,
  isActive,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Charger l'historique des messages
  useEffect(() => {
    if (!bookingId) return;

    loadChatHistory();
    subscribeToMessages();
  }, [bookingId]);

  const loadChatHistory = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setMessages(data.map(msg => ({
          id: msg.id,
          message: msg.content,
          sender_type: msg.sender_id === userId ? 'client' : 'driver',
          sender_name: msg.sender_id === userId ? 'Vous' : 'Chauffeur',
          timestamp: msg.created_at,
          message_type: msg.message_type as any,
          metadata: msg.metadata
        })));
      }
    } catch (error) {
      console.error('Erreur chargement historique chat:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${bookingId}`
        },
        async (payload) => {
          const newMsg = payload.new as any;
          const { data: user } = await supabase.auth.getUser();
          const userId = user.user?.id;
          setMessages(prev => [...prev, {
            id: newMsg.id,
            message: newMsg.content,
            sender_type: newMsg.sender_id === userId ? 'client' : 'driver',
            sender_name: newMsg.sender_id === userId ? 'Vous' : 'Chauffeur',
            timestamp: newMsg.created_at,
            message_type: newMsg.message_type,
            metadata: newMsg.metadata
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (messageText: string, messageType: 'text' | 'location' = 'text') => {
    if (!messageText.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: bookingId,
          sender_id: user.user?.id,
          content: messageText,
          message_type: messageType,
          metadata: messageType === 'location' ? { 
            location: messageText,
            timestamp: new Date().toISOString()
          } : null
        });

      if (error) throw error;

      setNewMessage('');
      
      // Notification toast pour le client
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé au chauffeur",
      });

    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickMessage = (message: string) => {
    sendMessage(message);
  };

  const shareLocation = async () => {
    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      sendMessage(
        `📍 Ma position: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
        'location'
      );
    } catch (error) {
      toast({
        title: "Erreur géolocalisation",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
    }
  };

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 w-80 h-96 bg-background border border-border rounded-lg shadow-xl z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5 rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-medium text-sm">Chat avec {driver?.display_name || 'Chauffeur'}</h3>
            {driver && (
              <p className="text-xs text-muted-foreground">
                {driver.vehicle_make} {driver.vehicle_model} • {driver.vehicle_plate}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {driver && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(`tel:${driver.phone_number}`)}
              className="h-8 w-8 p-0"
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 h-56">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, x: message.sender_type === 'client' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${message.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-2 rounded-lg text-sm ${
                  message.sender_type === 'client'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <p>{message.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-secondary text-secondary-foreground p-2 rounded-lg text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Messages rapides */}
      <div className="px-3 py-2 border-t border-border">
        <div className="flex flex-wrap gap-1">
          {quickMessages.slice(0, 2).map((quick, index) => (
            <Button
              key={index}
              size="sm"
              variant="outline"
              onClick={() => handleQuickMessage(quick.text)}
              className="text-xs h-7 flex items-center gap-1"
            >
              <quick.icon className="h-3 w-3" />
              <span className="truncate">{quick.text}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(newMessage);
              }
            }}
          />
          <Button
            size="sm"
            onClick={() => sendMessage(newMessage)}
            disabled={!newMessage.trim() || isLoading}
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex justify-between mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={shareLocation}
            className="text-xs h-7"
          >
            <Navigation className="h-3 w-3 mr-1" />
            Partager position
          </Button>
          
          <Badge variant="secondary" className="text-xs">
            En ligne
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};