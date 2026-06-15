import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  X, 
  Clock,
  Check,
  CheckCheck,
  MapPin,
  Phone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TaxiChatProps {
  bookingId: string;
  driverId: string;
  onClose: () => void;
}

interface Message {
  id: string;
  sender_id: string;
  sender_type: 'client' | 'driver';
  message: string;
  sent_at: string;
  read_at?: string;
  message_type: 'text' | 'location' | 'quick_reply';
  metadata?: any;
}

const QUICK_MESSAGES = [
  "Je suis prêt",
  "Où êtes-vous ?",
  "Je suis en retard de 5 min",
  "Merci !",
  "Pouvez-vous m'attendre ?",
  "J'arrive tout de suite"
];

const TaxiChat: React.FC<TaxiChatProps> = ({ bookingId, driverId, onClose }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    
    // Écouter les nouveaux messages
    const messagesSubscription = supabase
      .channel('taxi_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transport_chat_messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          console.log('📨 Nouveau message:', payload);
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          
          // Marquer comme lu si c'est un message du chauffeur
          if (newMsg.sender_type === 'driver' && user) {
            markMessageAsRead(newMsg.id);
          }
          
          // Notification pour les messages du chauffeur
          if (newMsg.sender_type === 'driver') {
            toast({
              title: "Nouveau message",
              description: newMsg.message.length > 50 
                ? newMsg.message.substring(0, 50) + "..."
                : newMsg.message,
            });

            // Vibration tactile
            if ('vibrate' in navigator) {
              navigator.vibrate([200]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [bookingId, user]);

  // Auto-scroll vers le bas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('transport_chat_messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('sent_at', { ascending: true });

      if (error) throw error;

      setMessages((data || []) as Message[]);

      // Marquer les messages du chauffeur comme lus
      const unreadMessages = data?.filter(msg => 
        msg.sender_type === 'driver' && !msg.read_at
      ) || [];
      
      for (const msg of unreadMessages) {
        await markMessageAsRead(msg.id);
      }

    } catch (error) {
      console.error('Erreur chargement messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('transport_chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  const sendMessage = async (messageText: string, messageType: 'text' | 'location' | 'quick_reply' = 'text') => {
    if (!messageText.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('transport_chat_messages')
        .insert({
          booking_id: bookingId,
          sender_id: user.id,
          sender_type: 'client',
          message: messageText,
          message_type: messageType
        });

      if (error) throw error;

      if (messageType === 'text') {
        setNewMessage('');
      }

    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const sendLocation = async () => {
    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      });
      
      const locationMessage = `📍 Ma position: https://maps.google.com/?q=${position.lat},${position.lng}`;
      await sendMessage(locationMessage, 'location');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStatus = (message: Message) => {
    if (message.sender_type === 'driver') return null;
    
    if (message.read_at) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    } else {
      return <Check className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <Card className="w-full max-w-md h-[80vh] sm:h-[600px] flex flex-col glassmorphism">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Chat avec le chauffeur</CardTitle>
              <p className="text-sm text-muted-foreground">Réservation #{bookingId.slice(-6)}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-4" ref={scrollRef}>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun message</p>
                <p className="text-sm">Démarrez la conversation !</p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_type === 'client' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender_type === 'client'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {/* Indicateur de type de message */}
                      {message.message_type === 'location' && (
                        <div className="flex items-center gap-1 mb-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs opacity-75">Position partagée</span>
                        </div>
                      )}
                      
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <span className="text-xs opacity-75">
                          {formatTime(message.sent_at)}
                        </span>
                        {getMessageStatus(message)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Réponses rapides */}
          <div className="px-4 py-2 border-t border-border/20">
            <div className="flex gap-2 pb-2 overflow-x-auto">
              {QUICK_MESSAGES.map((quickMsg, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground whitespace-nowrap"
                  onClick={() => sendMessage(quickMsg, 'quick_reply')}
                >
                  {quickMsg}
                </Badge>
              ))}
            </div>
          </div>

          {/* Zone de saisie */}
          <div className="p-4 border-t border-border/20">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={sendLocation}
                disabled={sending}
              >
                <MapPin className="h-4 w-4" />
              </Button>
              
              <div className="flex-1 flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message..."
                  disabled={sending}
                />
                <Button
                  onClick={() => sendMessage(newMessage)}
                  disabled={sending || !newMessage.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxiChat;