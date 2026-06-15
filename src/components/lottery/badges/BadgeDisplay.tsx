import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserBadge {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string;
  earned_at: string;
}

export const BadgeDisplay = () => {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_lottery_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Chargement...</div>
      </Card>
    );
  }

  if (badges.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Aucun badge gagné pour le moment</p>
          <p className="text-xs mt-1">Grattez des cartes pour débloquer des badges !</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        Mes Badges ({badges.length})
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 text-center hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-2">
                {badge.badge_name.split(' ')[0]}
              </div>
              <div className="text-sm font-semibold">
                {badge.badge_name.split(' ').slice(1).join(' ')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {badge.badge_description}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
