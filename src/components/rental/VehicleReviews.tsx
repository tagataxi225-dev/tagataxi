import React from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface VehicleReviewsProps {
  vehicleId: string;
}

export const VehicleReviews: React.FC<VehicleReviewsProps> = ({ vehicleId }) => {
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['rental-reviews', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_reviews' as any)
        .select(`
          *,
          profiles:reviewer_id (
            display_name,
            avatar_url
          ),
          rental_bookings (
            start_date,
            end_date
          )
        `)
        .eq('vehicle_id', vehicleId)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['rental-review-stats', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_vehicle_review_stats' as any)
        .select('*')
        .eq('vehicle_id', vehicleId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const averageRating = (stats as any)?.avg_overall_rating || 0;
  const totalReviews = (stats as any)?.total_reviews || 0;

  const ratingDistribution = [
    { stars: 5, count: (stats as any)?.five_stars || 0, percentage: totalReviews > 0 ? Math.round(((stats as any)?.five_stars || 0) / totalReviews * 100) : 0 },
    { stars: 4, count: (stats as any)?.four_stars || 0, percentage: totalReviews > 0 ? Math.round(((stats as any)?.four_stars || 0) / totalReviews * 100) : 0 },
    { stars: 3, count: (stats as any)?.three_stars || 0, percentage: totalReviews > 0 ? Math.round(((stats as any)?.three_stars || 0) / totalReviews * 100) : 0 },
    { stars: 2, count: (stats as any)?.two_stars || 0, percentage: totalReviews > 0 ? Math.round(((stats as any)?.two_stars || 0) / totalReviews * 100) : 0 },
    { stars: 1, count: (stats as any)?.one_star || 0, percentage: totalReviews > 0 ? Math.round(((stats as any)?.one_star || 0) / totalReviews * 100) : 0 }
  ];

  if (reviewsLoading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (totalReviews === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20 overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg">Avis clients</h3>
          </div>
          
          {/* Empty state moderne */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-10 px-4"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center"
            >
              <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            </motion.div>
            <p className="text-muted-foreground font-medium mb-2">Aucun avis pour le moment</p>
            <p className="text-sm text-muted-foreground/70">Soyez le premier à partager votre expérience !</p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20 overflow-hidden">
      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Header moderne */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg">Avis clients</h3>
          </div>
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm text-primary hover:text-primary/80">
            Voir tous
          </Button>
        </div>

        {/* Stats globales - Design premium */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 p-5 bg-gradient-to-br from-muted/60 to-muted/30 rounded-2xl border border-border/30"
        >
          {/* Score global avec animation */}
          <div className="text-center sm:text-left sm:pr-6 sm:border-r sm:border-border/30">
            <motion.p 
              className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              {averageRating.toFixed(1)}
            </motion.p>
            <div className="flex items-center gap-1 justify-center sm:justify-start mt-2">
              {[1, 2, 3, 4, 5].map((i, idx) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  <Star 
                    className={cn(
                      "h-5 w-5 transition-all",
                      i <= Math.floor(averageRating) 
                        ? 'fill-yellow-400 text-yellow-400 drop-shadow-md' 
                        : 'text-muted-foreground/30'
                    )} 
                  />
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5 justify-center sm:justify-start">
              <TrendingUp className="h-4 w-4 text-green-500" />
              {totalReviews} avis
            </p>
          </div>

          {/* Distribution avec barres animées */}
          <div className="space-y-2.5">
            {ratingDistribution.map(({ stars, count, percentage }, idx) => (
              <motion.div 
                key={stars} 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
              >
                <span className="text-sm font-medium w-4 text-muted-foreground">{stars}</span>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 h-2.5 bg-muted/60 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.6 + idx * 0.1, duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground w-8 text-right">
                  {count}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Liste des avis - Design moderne */}
        <div className="space-y-4">
          {reviews.map((review: any, idx: number) => {
            const displayName = review.profiles?.display_name || 'Utilisateur anonyme';
            const avatarUrl = review.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.id}`;
            const timeAgo = formatDistanceToNow(new Date(review.created_at), { 
              addSuffix: true, 
              locale: fr 
            });
            
            const booking = review.rental_bookings;
            const duration = booking 
              ? `${new Date(booking.start_date).toLocaleDateString('fr-FR')} - ${new Date(booking.end_date).toLocaleDateString('fr-FR')}`
              : '';

            return (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="group p-4 rounded-2xl bg-gradient-to-br from-background to-muted/20 border border-border/30 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar avec ring animé */}
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 ring-2 ring-border group-hover:ring-primary/30 transition-all duration-300">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Rating badge sur avatar */}
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 flex items-center justify-center shadow-md">
                      <span className="text-[10px] font-bold text-white">{review.overall_rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <p className="font-semibold text-sm truncate">{displayName}</p>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            className={cn(
                              "h-3.5 w-3.5",
                              star <= review.overall_rating 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3">
                      {timeAgo} {duration && `· ${duration}`}
                    </p>
                    
                    {/* Ratings détaillés avec design moderne */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[
                        { label: 'Véhicule', value: review.vehicle_rating, emoji: '🚗' },
                        { label: 'Service', value: review.service_rating, emoji: '👔' },
                        { label: 'Propreté', value: review.cleanliness_rating, emoji: '✨' }
                      ].map((item) => (
                        <span 
                          key={item.label}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/60 text-xs font-medium"
                        >
                          <span>{item.emoji}</span>
                          <span className="text-muted-foreground">{item.value}/5</span>
                        </span>
                      ))}
                    </div>
                    
                    {review.comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
