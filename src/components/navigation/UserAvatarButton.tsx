import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UserAvatarButtonProps {
  onClick?: () => void;
  position?: 'top-right' | 'bottom-right';
}

export const UserAvatarButton = ({ 
  onClick, 
  position = 'top-right' 
}: UserAvatarButtonProps) => {
  const { displayName } = useProfile();
  const { unreadCount } = useUnreadCount();

  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-[100]',
    'bottom-right': 'fixed bottom-20 right-4 z-[100]'
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        positionClasses[position],
        "relative group"
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
          {displayName[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {unreadCount > 0 && (
        <Badge 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive border-2 border-white"
          variant="destructive"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}

      <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-75" />
    </motion.button>
  );
};
