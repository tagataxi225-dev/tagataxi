import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MessageCircle, 
  Send, 
  MapPin, 
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  AlertCircle,
  Loader2,
  Reply as ReplyIcon,
  ShoppingBag,
  Trash2,
  Phone,
  MoreHorizontal
} from 'lucide-react';
import { useUniversalChat, type UniversalConversation, type UniversalMessage } from '@/hooks/useUniversalChat';
import { useChatPresence } from '@/hooks/useChatPresence';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { pushNotificationService } from '@/services/pushNotificationService';
import { notificationSoundService } from '@/services/notificationSound';
import { OnlineStatusBadge } from './OnlineStatusBadge';
import { TypingBubble } from './TypingBubble';
import { MessageReply, MessageReplyPreview } from './MessageReply';
import { ImageAttachment, ImageMessage, ImagePreview, uploadChatImage } from './ImageAttachment';
import { NewMessagesButton } from './NewMessagesButton';
import { LastMessagePreview } from './LastMessagePreview';
import { EmptyConversationState } from './EmptyConversationState';
import { CallConfirmationModal } from './CallConfirmationModal';
import { LocationShareButton } from './LocationShareButton';
import { toast } from 'sonner';

interface UniversalChatInterfaceProps {
  isFloating?: boolean;
  onClose?: () => void;
  contextType?: 'transport' | 'delivery' | 'marketplace' | 'rental' | 'support';
  contextId?: string;
  participantId?: string;
  initialConversationId?: string;
  title?: string;
  quickActions?: { label: string; action: () => void; icon?: any }[];
  hideHeader?: boolean;
  partnerPhone?: string;
  partnerName?: string;
  partnerType?: 'chauffeur' | 'livreur' | 'client' | 'vendeur';
  onQuickActionMessage?: (label: string) => string;
}

export const UniversalChatInterface = ({
  isFloating = false,
  onClose,
  contextType,
  contextId,
  participantId,
  initialConversationId,
  title,
  quickActions = [],
  hideHeader = false,
  partnerPhone,
  partnerName,
  partnerType,
  onQuickActionMessage
}: UniversalChatInterfaceProps) => {
  const { user } = useAuth();
  const {
    conversations,
    messages,
    loading,
    fetchMessages,
    sendMessage,
    sendLocationMessage,
    createOrFindConversation,
    loadMoreMessages,
    hasMore,
    loadingMore,
    retryMessage,
    deleteConversation
  } = useUniversalChat();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialConversationId || null);

  // Filter conversations by contextType when provided
  const filteredConversations = contextType
    ? conversations.filter(c => c.context_type === contextType)
    : conversations;

  // Auto-load messages when initialConversationId is set
  useEffect(() => {
    if (initialConversationId && !messages[initialConversationId]) {
      fetchMessages(initialConversationId);
    }
  }, [initialConversationId]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [replyingTo, setReplyingTo] = useState<UniversalMessage | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const otherParticipantId = currentConversation?.other_participant?.id;

  const { 
    isTyping: otherIsTyping, 
    isOnline: otherIsOnline,
    broadcastTyping 
  } = useChatPresence(selectedConversation || undefined, otherParticipantId || undefined);

  const conversationMessages = selectedConversation ? messages[selectedConversation] || [] : [];
  const hasMoreMessages = selectedConversation ? hasMore[selectedConversation] || false : false;
  const isLoadingMore = selectedConversation ? loadingMore[selectedConversation] || false : false;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowNewMessagesButton(!isNearBottom && conversationMessages.length > 0);
    
    if (target.scrollTop < 50 && hasMoreMessages && !isLoadingMore && selectedConversation) {
      loadMoreMessages(selectedConversation);
    }
  }, [hasMoreMessages, isLoadingMore, selectedConversation, loadMoreMessages, conversationMessages.length]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setShowNewMessagesButton(false);
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = scrollAreaRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      if (isNearBottom) {
        scrollToBottom();
      } else {
        setShowNewMessagesButton(true);
      }
    }
  }, [conversationMessages, scrollToBottom]);

  useEffect(() => {
    if (!user) return;
    const notificationChannel = supabase
      .channel('chat-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'push_notifications', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const notification = payload.new as any;
          if (notification.type === 'chat_message') {
            await notificationSoundService.playNotificationSound('message');
            await pushNotificationService.showNotification(notification.title, {
              body: notification.body, tag: notification.data?.conversation_id,
              data: { url: `/chat?conversation=${notification.data?.conversation_id}` }, requireInteraction: false
            });
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(notificationChannel); };
  }, [user]);

  // No longer using window.dispatchEvent for quick actions

  useEffect(() => {
    if (contextType && participantId && !selectedConversation) {
      const existingConv = conversations.find(conv => 
        conv.context_type === contextType && conv.context_id === contextId && conv.other_participant?.id === participantId
      );
      if (existingConv) {
        setSelectedConversation(existingConv.id);
        fetchMessages(existingConv.id);
      } else {
        createOrFindConversation(contextType, participantId, contextId, title)
          .then((conv) => { if (conv) { setSelectedConversation(conv.id); fetchMessages(conv.id); } })
          .catch((error) => {
            console.error('Chat auto-creation error:', error);
            toast.error(error.message || "Impossible d'ouvrir le chat");
          });
      }
    }
  }, [contextType, participantId, contextId, title, conversations, selectedConversation]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    broadcastTyping();
  }, [broadcastTyping]);

  const handleImageSelect = useCallback((file: File | null) => {
    setSelectedImage(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    } else {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  }, [imagePreviewUrl]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !selectedConversation) return;
    try {
      let imageUrl: string | undefined;
      if (selectedImage) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadChatImage(selectedImage, selectedConversation);
        } catch (error) {
          toast.error('Erreur lors de l\'envoi de l\'image');
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }
      const msgType = imageUrl ? 'image' : 'text';
      const metadata = imageUrl ? { image_url: imageUrl } : {};
      await sendMessage(selectedConversation, newMessage.trim() || (imageUrl ? '📷 Image' : ''), msgType, metadata, [], replyingTo?.id);
      setNewMessage('');
      setReplyingTo(null);
      handleImageSelect(null);
      scrollToBottom();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  const handleSendLocation = async () => {
    if (!selectedConversation) return;
    try { await sendLocationMessage(selectedConversation); scrollToBottom(); } catch (error) { console.error('Error:', error); }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleReply = useCallback((message: UniversalMessage) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  }, []);

  const handleRetry = useCallback((messageId: string) => {
    const msg = conversationMessages.find(m => m.id === messageId || m.tempId === messageId);
    if (msg?.tempId && selectedConversation) {
      retryMessage(selectedConversation, msg.tempId);
    }
  }, [conversationMessages, selectedConversation, retryMessage]);

  if (isFloating && isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={() => setIsMinimized(false)} className="h-12 w-12 rounded-full bg-primary/90 text-primary-foreground shadow-lg">
          <MessageCircle className="h-6 w-6" />
          {conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0) > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-destructive">
              {conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0)}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  const containerClass = isFloating
    ? "fixed inset-0 md:inset-auto md:bottom-4 md:right-4 w-full h-[100dvh] md:w-96 md:h-[520px] z-50 shadow-2xl rounded-none md:rounded-2xl border border-border/40 bg-background/95 backdrop-blur"
    : "w-full h-full";

  return (
    <Card className={cn("flex flex-col bg-background", containerClass)}>
      {!hideHeader && (
        <div className="flex items-center justify-between p-4 border-b bg-card/60 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {selectedConversation && (
              <Button variant="ghost" size="sm" onClick={() => { setSelectedConversation(null); setReplyingTo(null); }} className="p-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {selectedConversation && currentConversation && (
              <div className="relative">
                <Avatar className="h-9 w-9 ring-1 ring-border/20">
                  <AvatarImage src={currentConversation.other_participant?.shop_logo_url || currentConversation.other_participant?.avatar_url} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                    {currentConversation.other_participant?.shop_name?.[0] || currentConversation.other_participant?.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <OnlineStatusBadge isOnline={otherIsOnline} className="absolute -bottom-0.5 -right-0.5" />
              </div>
            )}
            <div>
              <h3 className="font-semibold">
                {selectedConversation ? (currentConversation?.context_type === 'marketplace' && currentConversation.other_participant?.shop_name
                  ? `🛍️ ${currentConversation.other_participant.shop_name}`
                  : currentConversation?.other_participant?.display_name || 'Chat') : 'Messages'}
              </h3>
              {selectedConversation && (
                <p className="text-xs text-muted-foreground">{otherIsOnline ? <span className="text-green-500">En ligne</span> : <span>Hors ligne</span>}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Bouton d'appel - visible seulement si un numéro est disponible */}
            {selectedConversation && partnerPhone && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCallModal(true)} 
                  className="p-2 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 transition-all"
                >
                  <Phone className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
            {isFloating && <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)} className="p-1"><MessageCircle className="h-4 w-4" /></Button>}
            {onClose && <Button variant="ghost" size="sm" onClick={onClose} className="p-1"><X className="h-4 w-4" /></Button>}
          </div>
        </div>
      )}

      {/* Product info banner in chat header */}
      {selectedConversation && currentConversation?.product_info && (
        <div className="flex items-center gap-2.5 px-4 py-2 border-b bg-muted/30">
          <img 
            src={currentConversation.product_info.image} 
            alt={currentConversation.product_info.title}
            className="h-8 w-8 rounded-lg object-cover flex-shrink-0 border border-border/30"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{currentConversation.product_info.title}</p>
            <p className="text-[11px] text-muted-foreground font-medium">
              {currentConversation.product_info.price.toLocaleString('fr-FR')} CDF
            </p>
          </div>
          <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 relative">
        {!selectedConversation ? (
          <ConversationsList 
            conversations={filteredConversations} 
            onSelectConversation={(id) => { setSelectedConversation(id); fetchMessages(id); }} 
            onDeleteConversation={deleteConversation}
            loading={loading} 
          />
        ) : (
          <>
            <div ref={scrollAreaRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 bg-background">
              {isLoadingMore && <div className="flex justify-center py-2"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
              {hasMoreMessages && !isLoadingMore && conversationMessages.length > 0 && <div className="text-center py-2"><span className="text-xs text-muted-foreground">↑ Défiler pour charger plus</span></div>}
              
              {/* État vide avec suggestions */}
              {conversationMessages.length === 0 && !isLoadingMore && (
                <EmptyConversationState 
                  participantName={currentConversation?.other_participant?.shop_name || currentConversation?.other_participant?.display_name}
                  onSendQuickMessage={(msg) => sendMessage(selectedConversation!, msg)}
                  contextType={contextType}
                  userRole={(() => {
                    // Dynamic role detection based on conversation data
                    if (contextType === 'delivery' || contextType === 'transport') {
                      return partnerType === 'chauffeur' || partnerType === 'livreur' ? 'buyer' : 'driver';
                    }
                    if (currentConversation?.other_participant) {
                      // If other participant has a shop, current user is a buyer
                      return currentConversation.other_participant.shop_name ? 'buyer' : 'vendor';
                    }
                    // Fallback
                    return partnerType === 'vendeur' ? 'buyer' : partnerType === 'client' ? 'vendor' : 'buyer';
                  })()}
                />
              )}
              
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {conversationMessages.map((message) => (
                    <MessageBubble key={message.id} message={message} onReply={handleReply} onRetry={handleRetry} allMessages={conversationMessages} onImagePreview={setPreviewImage} />
                  ))}
                </AnimatePresence>
                <AnimatePresence>{otherIsTyping && <TypingBubble />}</AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {quickActions.length > 0 && (
              <div className="px-3 py-2 border-t bg-gradient-to-r from-muted/30 to-muted/10">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {quickActions.map((action, index) => (
                    <motion.button key={index} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => {
                      if (onQuickActionMessage && selectedConversation) {
                        const message = onQuickActionMessage(action.label);
                        if (message) {
                          sendMessage(selectedConversation, message);
                          scrollToBottom();
                        }
                      } else {
                        action.action();
                      }
                    }}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 border border-primary/20">
                      {action.icon && <action.icon className="h-3.5 w-3.5" />}{action.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>{replyingTo && <MessageReply message={replyingTo} onCancel={() => setReplyingTo(null)} />}</AnimatePresence>
            <AnimatePresence>
              {imagePreviewUrl && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-3 py-2 border-t bg-muted/30">
                  <div className="relative inline-block">
                    <img src={imagePreviewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                    <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => handleImageSelect(null)}><X className="h-3 w-3" /></Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Zone d'input moderne avec effet glass */}
            <div className="p-3 border-t border-border/40 bg-gradient-to-r from-card via-card/95 to-card backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-2 bg-muted/40 rounded-2xl p-1.5 border border-border/30 shadow-inner">
                <ImageAttachment onImageSelect={handleImageSelect} disabled={uploadingImage} />
                <Button 
                  onClick={handleSendLocation} 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 flex-shrink-0 transition-all duration-200"
                >
                  <MapPin className="h-4.5 w-4.5" />
                </Button>
                <div className="flex-1 relative">
                  <Input 
                    ref={inputRef} 
                    value={newMessage} 
                    onChange={handleInputChange} 
                    onKeyPress={handleKeyPress} 
                    placeholder="Écrivez un message..." 
                    className="h-10 rounded-xl border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 pr-11 text-sm placeholder:text-muted-foreground/60 transition-all" 
                    disabled={uploadingImage} 
                  />
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  >
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={(!newMessage.trim() && !selectedImage) || uploadingImage} 
                      size="icon"
                      className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-30 shadow-md shadow-primary/25 transition-all duration-200"
                    >
                      {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </>
        )}
        <AnimatePresence>{showNewMessagesButton && selectedConversation && <NewMessagesButton onClick={() => scrollToBottom()} count={0} />}</AnimatePresence>
      </div>
      <AnimatePresence>{previewImage && <ImagePreview imageUrl={previewImage} onClose={() => setPreviewImage(null)} />}</AnimatePresence>
      
      {/* Modal de confirmation d'appel */}
      <CallConfirmationModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        partnerName={partnerName || currentConversation?.other_participant?.shop_name || currentConversation?.other_participant?.display_name || 'Contact'}
        partnerPhone={partnerPhone || ''}
        partnerAvatar={currentConversation?.other_participant?.shop_logo_url || currentConversation?.other_participant?.avatar_url}
        partnerType={partnerType}
      />
    </Card>
  );
};

// Composant pour un item de conversation avec swipe-to-delete
const SwipeableConversationItem = ({ 
  conversation, 
  index,
  onSelect, 
  onDelete 
}: { 
  conversation: UniversalConversation; 
  index: number;
  onSelect: () => void;
  onDelete: () => void;
}) => {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (e.dir === 'Left') {
        setSwipeProgress(Math.min(e.absX, 80));
      }
    },
    onSwipedLeft: () => {
      if (swipeProgress > 60) {
        setIsDeleting(true);
      }
      setSwipeProgress(0);
    },
    onTouchEndOrOnMouseUp: () => {
      if (swipeProgress < 60) {
        setSwipeProgress(0);
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  const handleDelete = async () => {
    await onDelete();
    setIsDeleting(false);
  };

  return (
    <>
      <motion.div 
        {...handlers}
        key={conversation.id} 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }}
        exit={{ 
          opacity: 0, 
          x: -300, 
          height: 0,
          marginBottom: 0,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        layout
        transition={{ delay: index * 0.03, type: "spring", stiffness: 400, damping: 30 }}
        className="relative overflow-hidden border-b border-border/10 last:border-b-0"
        onContextMenu={(e) => {
          e.preventDefault();
          setIsDeleting(true);
        }}
      >
        {/* Fond rouge avec icône poubelle pour swipe - visible seulement pendant le geste */}
        {swipeProgress > 0 && (
        <div 
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-destructive to-destructive/80 flex items-center justify-end px-4 rounded-r-xl"
          style={{ width: Math.max(swipeProgress, 0) }}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: swipeProgress > 60 ? 1.2 : 1 }}
          >
            <Trash2 className="h-5 w-5 text-white" />
          </motion.div>
        </div>
        )}
        
        {/* Contenu de la conversation - Style soft-modern */}
        <motion.div 
          style={{ transform: `translateX(-${swipeProgress}px)` }}
          onClick={onSelect} 
          className="flex items-center gap-3 p-3.5 bg-background hover:bg-muted/30 cursor-pointer transition-all duration-200 active:scale-[0.98] relative group/item"
        >
          <div className="relative flex-shrink-0">
            <Avatar className="h-11 w-11 ring-1 ring-border/20">
              <AvatarImage src={conversation.other_participant?.shop_logo_url || conversation.other_participant?.avatar_url} />
              <AvatarFallback className="bg-muted text-muted-foreground font-medium text-sm">
                {conversation.other_participant?.shop_name?.[0] || conversation.other_participant?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-foreground truncate text-sm">
                {conversation.other_participant?.shop_name || conversation.other_participant?.display_name || 'Utilisateur'}
              </p>
              <span className="text-[10px] text-muted-foreground/70 font-medium flex-shrink-0 ml-2">
                {conversation.last_message_at && new Date(conversation.last_message_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <LastMessagePreview message={conversation.last_message} isRead={!conversation.unread_count} />
              </div>
              {conversation.unread_count && conversation.unread_count > 0 && (
                <Badge className="h-5 min-w-5 rounded-full px-1.5 flex items-center justify-center text-[10px] bg-primary text-primary-foreground font-medium flex-shrink-0">
                  {conversation.unread_count}
                </Badge>
              )}
            </div>
            {/* Product tag for marketplace conversations */}
            {conversation.product_info && (
              <div className="flex items-center gap-1.5 mt-1">
                <ShoppingBag className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-[11px] text-muted-foreground truncate">{conversation.product_info.title}</span>
              </div>
            )}
          </div>
          
          {/* Menu contextuel "..." */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover/item:opacity-100 hover:bg-muted/60 transition-all z-10">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-background border border-border shadow-lg z-50">
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </motion.div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Supprimer cette discussion ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action masquera la conversation de votre liste. Les messages resteront visibles pour l'autre participant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
            <AlertDialogCancel className="flex-1 sm:flex-none mt-0">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="flex-1 sm:flex-none bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const ConversationsList = ({ 
  conversations, 
  onSelectConversation, 
  onDeleteConversation,
  loading 
}: { 
  conversations: UniversalConversation[]; 
  onSelectConversation: (id: string) => void; 
  onDeleteConversation: (id: string) => Promise<boolean>;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }} 
          className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full" 
        />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="space-y-2 mb-6"
        >
          <h3 className="text-lg font-semibold text-foreground">
            Aucune conversation
          </h3>
          <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">
            Contactez un vendeur depuis une fiche produit pour démarrer une discussion
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={() => window.location.href = '/marketplace'} 
            variant="outline"
            className="rounded-full px-6 py-2 h-auto border-border/50 hover:bg-muted/50 transition-all group"
          >
            <ShoppingBag className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-foreground" />
            Voir les produits
            <ArrowRight className="h-4 w-4 ml-2 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 bg-background">
      <div className="p-2">
        <AnimatePresence mode="popLayout">
          {conversations.map((conversation, index) => (
            <SwipeableConversationItem
              key={conversation.id}
              conversation={conversation}
              index={index}
              onSelect={() => onSelectConversation(conversation.id)}
              onDelete={() => onDeleteConversation(conversation.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
};

const MessageBubble = ({ message, onReply, onRetry, allMessages, onImagePreview }: { message: UniversalMessage; onReply: (m: UniversalMessage) => void; onRetry: (id: string) => void; allMessages: UniversalMessage[]; onImagePreview: (url: string) => void }) => {
  const { user } = useAuth();
  const isOwnMessage = message.sender_id === user?.id;
  const replyToMessage = message.reply_to_id ? allMessages.find(m => m.id === message.reply_to_id) : null;

  const getStatusIcon = () => {
    if (!isOwnMessage) return null;
    switch (message.status) {
      case 'sending': return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
      case 'error': return <button onClick={() => onRetry(message.id)} className="flex items-center gap-1 text-destructive hover:underline"><AlertCircle className="h-3 w-3" /><span className="text-[10px]">Réessayer</span></button>;
      case 'read': return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
      case 'sent': return <Check className="h-3 w-3 text-muted-foreground/70" />;
      default: return <Check className="h-3 w-3 text-muted-foreground/70" />;
    }
  };

  return (
    <motion.div 
      layout="position"
      initial={{ opacity: 0, scale: 0.9, y: 15, x: isOwnMessage ? 20 : -20 }} 
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }} 
      exit={{ opacity: 0, scale: 0.9 }} 
      transition={{ type: "spring", stiffness: 400, damping: 30 }} 
      className={cn("flex gap-2 max-w-[85%] group", isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto")}
    >
      {!isOwnMessage && (
        <Avatar className="h-7 w-7 flex-shrink-0 ring-1 ring-border/20 self-end mb-5">
          <AvatarImage src={message.sender?.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-500 text-white text-xs font-semibold">
            {message.sender?.display_name?.charAt(0) || 'V'}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        {!isOwnMessage && (
          <span className="text-[11px] text-muted-foreground/80 font-medium px-3 mb-0.5">
            {(message.sender as any)?.shop_name || message.sender?.display_name || 'Vendeur'}
          </span>
        )}
        {replyToMessage && <MessageReplyPreview replyTo={replyToMessage} isOwnMessage={isOwnMessage} />}
        
        {/* Bulle de message style WhatsApp */}
        <div className="relative">
          <div 
            className={cn(
              "px-3.5 py-2 max-w-full relative",
              isOwnMessage 
                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm shadow-sm" 
                : "bg-muted/60 text-foreground rounded-2xl rounded-bl-sm border border-border/20",
              message.status === 'error' && "opacity-60"
            )}
          >
            

            
            {message.metadata?.image_url && (
              <ImageMessage 
                imageUrl={message.metadata.image_url} 
                onClick={() => onImagePreview(message.metadata?.image_url || '')} 
              />
            )}
            {message.message_type === 'location' ? (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-background/20 flex items-center justify-center">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Position partagée</span>
              </div>
            ) : message.content && message.content !== '📷 Image' && (
              <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
            )}
            
            {/* Timestamp intégré dans la bulle */}
            <div className={cn(
              "flex items-center gap-1 mt-1",
              isOwnMessage ? "justify-end" : "justify-start"
            )}>
              <span className={cn(
                "text-[10px] font-medium",
                isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground/60"
              )}>
                {new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isOwnMessage && getStatusIcon()}
            </div>
          </div>
          
          {/* Bouton reply flottant */}
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => onReply(message)} 
            className={cn(
              "absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-card shadow-lg border border-border/50 opacity-0 group-hover:opacity-100 transition-all duration-200",
              isOwnMessage ? "-left-10" : "-right-10"
            )}
          >
            <ReplyIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

