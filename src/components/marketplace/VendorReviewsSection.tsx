import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, MessageCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  rater: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface VendorReviewsSectionProps {
  vendorId: string;
  averageRating?: number;
  totalRatings?: number;
}

export const VendorReviewsSection: React.FC<VendorReviewsSectionProps> = ({
  vendorId,
  averageRating = 0,
  totalRatings = 0
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingBreakdown, setRatingBreakdown] = useState<Record<number, number>>({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  });

  useEffect(() => {
    loadReviews();
  }, [vendorId]);

  const loadReviews = async () => {
    try {
      setLoading(true);

      // Load reviews with user profiles
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('user_ratings')
        .select(`
          id,
          rating,
          comment,
          created_at,
          rater:rater_user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('rated_user_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reviewsError) throw reviewsError;

      // Transform data
      const transformedReviews = reviewsData?.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        rater: Array.isArray(review.rater) ? review.rater[0] : review.rater
      })) || [];

      setReviews(transformedReviews);

      // Load all ratings for breakdown
      const { data: allRatings } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', vendorId);

      // Calculate breakdown
      const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      allRatings?.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
          breakdown[r.rating]++;
        }
      });
      setRatingBreakdown(breakdown);

    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (totalRatings === 0) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div id="vendor-reviews-section" className="border-t bg-gradient-to-b from-background to-muted/20">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-primary" />
              Avis Clients
              <Badge variant="secondary" className="ml-2">
                {totalRatings}
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Ce que pensent nos clients
            </p>
          </div>

          {/* Average rating display */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-center"
          >
            <div className="flex items-center gap-1 justify-center mb-1">
              <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
              <span className="text-4xl font-bold text-foreground">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">sur 5</p>
          </motion.div>
        </div>

        {/* Rating breakdown with progress bars */}
        <Card className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-background border-primary/10">
          <CardContent className="p-4 space-y-2">
            {[5, 4, 3, 2, 1].map((stars, index) => {
              const count = ratingBreakdown[stars] || 0;
              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

              return (
                <motion.div
                  key={stars}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{stars}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                      className={cn(
                        'h-full rounded-full',
                        stars === 5 && 'bg-gradient-to-r from-green-500 to-green-600',
                        stars === 4 && 'bg-gradient-to-r from-blue-500 to-blue-600',
                        stars === 3 && 'bg-gradient-to-r from-yellow-500 to-yellow-600',
                        stars === 2 && 'bg-gradient-to-r from-orange-500 to-orange-600',
                        stars === 1 && 'bg-gradient-to-r from-red-500 to-red-600'
                      )}
                    />
                  </div>
                  
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>

        {/* Reviews list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-300 group">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {review.rater?.avatar_url ? (
                          <img
                            src={review.rater.avatar_url}
                            alt={review.rater.display_name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {getInitials(review.rater?.display_name || 'U')}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-foreground">
                            {review.rater?.display_name || 'Utilisateur'}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.created_at), {
                              addSuffix: true,
                              locale: fr
                            })}
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex gap-0.5 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-3 h-3',
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted fill-muted-foreground/20'
                              )}
                            />
                          ))}
                        </div>

                        {/* Comment */}
                        {review.comment && (
                          <p className="text-sm text-muted-foreground line-clamp-3 group-hover:line-clamp-none transition-all">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Aucun avis pour le moment
              </p>
            </CardContent>
          </Card>
        )}

        {/* View all button */}
        {reviews.length >= 5 && totalRatings > 5 && (
          <div className="text-center">
            <Button variant="outline" size="lg" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Voir tous les {totalRatings} avis
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
