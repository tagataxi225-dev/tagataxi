import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  vendorId: string;
  className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ vendorId, className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFollowStatus();
  }, [vendorId, user]);

  const checkFollowStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('vendor_subscriptions')
        .select('is_active')
        .eq('vendor_id', vendorId)
        .eq('subscriber_id', user.id)
        .maybeSingle();

      setIsFollowing(data?.is_active || false);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour suivre ce vendeur',
        variant: 'destructive'
      });
      return;
    }

    const newFollowState = !isFollowing;
    
    // Optimistic update
    setIsFollowing(newFollowState);

    try {
      const { error } = await supabase
        .from('vendor_subscriptions')
        .upsert({
          customer_id: user.id,
          subscriber_id: user.id,
          vendor_id: vendorId,
          is_active: newFollowState
        }, {
          onConflict: 'customer_id,vendor_id'
        });

      if (error) throw error;

      toast({
        title: newFollowState ? '✓ Abonné' : 'Désabonné',
        description: newFollowState 
          ? 'Vous recevrez les nouveautés de ce vendeur' 
          : 'Vous ne recevrez plus les notifications'
      });
    } catch (error) {
      // Revert on error
      setIsFollowing(!newFollowState);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </Button>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant={isFollowing ? "secondary" : "default"}
        size="sm"
        onClick={handleToggleFollow}
        className={cn(
          "transition-all duration-300",
          className
        )}
      >
        <motion.div
          key={isFollowing ? 'following' : 'follow'}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          {isFollowing ? (
            <>
              <Check className="h-4 w-4" />
              Abonné
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              S'abonner
            </>
          )}
        </motion.div>
      </Button>
    </motion.div>
  );
};
