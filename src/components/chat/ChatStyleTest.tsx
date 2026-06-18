import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const ChatStyleTest = () => {
  const mockMessages = [
    { 
      id: '1', 
      sender_id: 'vendor', 
      content: 'Bonjour ! Votre commande est prête pour le retrait 📦', 
      sender: { 
        display_name: 'TAGA Shop',
        shop_name: 'TAGA Shop',
        avatar_url: null
      },
      created_at: new Date().toISOString()
    },
    { 
      id: '2', 
      sender_id: 'client', 
      content: 'Super ! Merci beaucoup. J\'arrive dans 15 minutes', 
      sender: { 
        display_name: 'Ivan Ouantchi',
        avatar_url: null
      },
      created_at: new Date().toISOString()
    },
    { 
      id: '3', 
      sender_id: 'vendor', 
      content: 'Parfait ! Je vous attends au point de retrait habituel 📍', 
      sender: { 
        display_name: 'TAGA Shop',
        shop_name: 'TAGA Shop',
        avatar_url: null
      },
      created_at: new Date().toISOString()
    },
    { 
      id: '4', 
      sender_id: 'client', 
      content: 'Où se trouve le point de retrait exactement ?', 
      sender: { 
        display_name: 'Ivan Ouantchi',
        avatar_url: null
      },
      created_at: new Date().toISOString()
    },
  ];

  const currentUserId = 'client';

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Test Chat Style WhatsApp</CardTitle>
        <p className="text-sm text-muted-foreground">
          Aperçu du chat vendeur/client avec bulles différenciées
        </p>
      </CardHeader>
      <CardContent className="space-y-4 bg-muted/20 p-4 rounded-lg min-h-[400px]">
        {mockMessages.map(msg => {
          const isOwnMessage = msg.sender_id === currentUserId;
          
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex gap-2 max-w-[80%] mb-3",
                isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              {/* Avatar visible seulement pour les messages reçus */}
              {!isOwnMessage && (
                <Avatar className="h-8 w-8 ring-2 ring-primary/20 flex-shrink-0">
                  <AvatarImage src={msg.sender?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground text-xs font-semibold">
                    {msg.sender?.display_name?.charAt(0) || 'V'}
                  </AvatarFallback>
                </Avatar>
              )}

              {/* Container avec nom expéditeur pour messages reçus */}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                {/* Nom de l'expéditeur pour messages reçus */}
                {!isOwnMessage && (
                  <span className="text-xs text-muted-foreground font-medium px-1">
                    {(msg.sender as any)?.shop_name || msg.sender?.display_name || 'Vendeur'}
                  </span>
                )}

                {/* Bulle message style WhatsApp */}
                <div className={cn(
                  "rounded-2xl px-4 py-3 max-w-full shadow-sm",
                  isOwnMessage 
                    ? "bg-primary text-primary-foreground rounded-br-sm" 
                    : "bg-muted/80 text-foreground rounded-bl-sm"
                )}>
                  <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                  <p className={cn(
                    "text-xs mt-1.5 flex items-center gap-1",
                    isOwnMessage ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
                  )}>
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {isOwnMessage && <span className="font-bold">✓</span>}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
};
