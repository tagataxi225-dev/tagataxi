import React from 'react';
import { MapPin, Image as ImageIcon, Check, CheckCheck, MessageCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface LastMessagePreviewProps {
  message?: {
    content: string;
    message_type: 'text' | 'location' | 'image' | 'file' | 'quick_action';
    sender_id: string;
    is_read: boolean;
  };
  messageType?: string;
  isRead?: boolean;
  className?: string;
}

export const LastMessagePreview: React.FC<LastMessagePreviewProps> = ({
  message,
  isRead = false,
  className
}) => {
  const { user } = useAuth();
  
  // Pas de message du tout → Nouvelle conversation
  if (!message) {
    return (
      <p className={cn("text-[13px] text-muted-foreground/60 italic flex items-center gap-1.5", className)}>
        <MessageCircle className="h-3.5 w-3.5" />
        Nouvelle conversation
      </p>
    );
  }

  const isOwnMessage = message.sender_id === user?.id;
  const messageIsRead = message.is_read || isRead;

  // Génère le contenu de l'aperçu selon le type
  const getPreviewContent = () => {
    const content = message.content?.trim();
    
    // Types spéciaux avec icônes
    switch (message.message_type) {
      case 'location':
        return (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span>Position partagée</span>
          </span>
        );
      case 'image':
        return (
          <span className="flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span>Photo</span>
          </span>
        );
      case 'file':
        return (
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span>Fichier</span>
          </span>
        );
      default:
        // Message texte standard
        if (!content || content === '' || content === '📷 Image') {
          return null;
        }
        return content.length > 40 ? content.substring(0, 40) + '...' : content;
    }
  };

  const previewContent = getPreviewContent();
  
  // Si pas de contenu à afficher → Nouvelle conversation
  if (!previewContent) {
    return (
      <p className={cn("text-[13px] text-muted-foreground/60 italic flex items-center gap-1.5", className)}>
        <MessageCircle className="h-3.5 w-3.5" />
        Nouvelle conversation
      </p>
    );
  }

  // Indicateur de lecture (seulement pour ses propres messages)
  const ReadIndicator = isOwnMessage ? (
    messageIsRead ? (
      <CheckCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
    ) : (
      <Check className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
    )
  ) : null;

  return (
    <div className={cn(
      "flex items-center gap-1.5 text-[13px] truncate",
      messageIsRead || !isOwnMessage ? "text-muted-foreground/70" : "text-foreground font-medium",
      className
    )}>
      {ReadIndicator}
      <span className="truncate">{previewContent}</span>
    </div>
  );
};
