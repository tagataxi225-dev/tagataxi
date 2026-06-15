import React from 'react';
import { Store, MessageSquare, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UnifiedVendorHeaderProps {
  className?: string;
  onOpenChat?: () => void;
  onOpenNotifications?: () => void;
  unreadChatCount?: number;
  shopName?: string;
}

export const UnifiedVendorHeader: React.FC<UnifiedVendorHeaderProps> = ({ 
  className = '',
  onOpenChat,
  onOpenNotifications,
  unreadChatCount = 0,
  shopName
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { userRoles } = useUserRoles();
  
  const hasClientRole = userRoles.some(r => r.role === 'client');
  
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 ${className}`}
    >
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg"
          >
            <Store className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-lg font-bold text-foreground truncate max-w-[160px] sm:max-w-none">
              {shopName || (isMobile ? 'Ma Boutique' : 'Ma Boutique')}
            </h1>
          </motion.div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Retour Client Button */}
          {hasClientRole && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => navigate('/app/client')}
              >
                <Home className="h-4 w-4" />
                {!isMobile && <span>Client</span>}
              </Button>
            </motion.div>
          )}
          
          {/* Chat Button */}
          {onOpenChat && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={onOpenChat}
              >
                <MessageSquare className="h-5 w-5" />
                {unreadChatCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                  >
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </Badge>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
};
