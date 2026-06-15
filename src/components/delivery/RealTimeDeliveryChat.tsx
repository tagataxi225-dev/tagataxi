import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  MessageCircle, 
  User, 
  Truck,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_type: 'client' | 'driver' | 'system';
  message: string;
  sent_at: string;
  read_at?: string;
}

interface RealTimeDeliveryChatProps {
  orderId: string;
  userType: 'client' | 'driver';
  userId: string;
  partnerName?: string;
  partnerPhone?: string;
  onCall?: () => void;
}

export default function RealTimeDeliveryChat({
  orderId,
  userType,
  userId,
  partnerName,
  partnerPhone,
  onCall
}: RealTimeDeliveryChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_chat_messages')
          .select('*')
          .eq('delivery_order_id', orderId)
          .order('sent_at', { ascending: true });

        if (error) throw error;
        setMessages((data || []).map(item => ({
          id: item.id,
          sender_id: item.sender_id,
          sender_type: item.sender_type as 'client' | 'driver' | 'system',
          message: item.message,
          sent_at: item.sent_at,
          read_at: item.read_at
        })));
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [orderId]);

  // Real-time message subscription
  useEffect(() => {
    const channel = supabase
      .channel(`delivery-chat-${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_chat_messages',
        filter: `delivery_order_id=eq.${orderId}`
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => [...prev, newMsg]);
        
        // Show notification if message is from other party
        if (newMsg.sender_id !== userId) {
          toast({
            title: `Message de ${userType === 'client' ? 'votre chauffeur' : 'votre client'}`,
            description: newMsg.message.slice(0, 50) + (newMsg.message.length > 50 ? '...' : '')
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_chat_messages',
        filter: `delivery_order_id=eq.${orderId}`
      }, (payload) => {
        const updatedMsg = payload.new as ChatMessage;
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMsg.id ? updatedMsg : msg
        ));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, userId, userType]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('delivery_chat_messages')
        .insert({
          delivery_order_id: orderId,
          sender_id: userId,
          sender_type: userType,
          message: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi du message",
        variant: "destructive"
      });
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    try {
      const unreadMessages = messages.filter(msg => 
        msg.sender_id !== userId && !msg.read_at
      );

      if (unreadMessages.length > 0) {
        const { error } = await supabase
          .from('delivery_chat_messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(msg => msg.id));

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  useEffect(() => {
    markMessagesAsRead();
  }, [messages]);

  // Quick message templates
  const quickMessages = userType === 'driver' 
    ? [
        "Je suis en route pour récupérer votre colis",
        "Colis récupéré, en route vers la destination",
        "Je suis arrivé à destination",
        "Où puis-je vous trouver ?",
        "Livraison terminée"
      ]
    : [
        "Où êtes-vous maintenant ?",
        "Combien de temps encore ?",
        "Je vous attends à l'entrée",
        "Merci pour votre service !",
        "Pouvez-vous m'appeler ?"
      ];

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleQuickMessage = (message: string) => {
    setNewMessage(message);
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat livraison
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {partnerName && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {userType === 'client' ? (
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{partnerName}</span>
                </div>
                
                {onCall && partnerPhone && (
                  <Button size="sm" variant="outline" onClick={onCall}>
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            
            <Badge 
              variant={isOnline ? "default" : "secondary"}
              className="text-xs"
            >
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${
                    message.sender_id === userId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`
                    max-w-[80%] rounded-lg px-3 py-2 text-sm
                    ${message.sender_id === userId 
                      ? 'bg-primary text-primary-foreground' 
                      : message.sender_type === 'system'
                      ? 'bg-muted text-muted-foreground italic'
                      : 'bg-muted'
                    }
                  `}>
                    <p>{message.message}</p>
                    <div className={`
                      text-xs mt-1 flex items-center gap-1
                      ${message.sender_id === userId 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                      }
                    `}>
                      <Clock className="h-3 w-3" />
                      {formatTime(message.sent_at)}
                      {message.read_at && message.sender_id === userId && (
                        <span className="ml-1">✓✓</span>
                      )}
                    </div>
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
                <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Quick messages */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {quickMessages.slice(0, 3).map((msg, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleQuickMessage(msg)}
              >
                {msg.length > 20 ? msg.slice(0, 20) + '...' : msg}
              </Button>
            ))}
          </div>
        </div>

        {/* Message input */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={loading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={loading || !newMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}