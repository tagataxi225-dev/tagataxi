import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Filter, ChevronDown, ThumbsUp, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  rater_display_name: string | null;
  rater_avatar_url: string | null;
  helpful_count?: number;
  images?: string[];
  restaurant_reply?: string;
  restaurant_reply_at?: string;
}

interface RestaurantReviewsSectionProps {
  restaurantId: string;
  averageRating?: number;
  totalRatings?: number;
}

type SortOption = 'recent' | 'highest' | 'lowest' | 'helpful';
type FilterOption = 'all' | 5 | 4 | 3 | 2 | 1;

const sortLabels: Record<SortOption, string> = {
  recent: 'Plus récents',
  highest: 'Meilleures notes',
  lowest: 'Notes les plus basses',
  helpful: 'Plus utiles',
};

export const RestaurantReviewsSection: React.FC<RestaurantReviewsSectionProps> = ({
  restaurantId,
  averageRating = 0,
  totalRatings = 0,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [breakdown, setBreakdown] = useState<Record<number, number>>({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0,
  });

  const REVIEWS_PER_PAGE = 5;

  useEffect(() => {
    loadReviews(true);
  }, [restaurantId, sortBy, filterBy]);

  const loadReviews = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 0 : page;

      let query = supabase
        .from('user_ratings')
        .select('id, rating, comment, created_at, rater_user_id')
        .eq('rated_user_id', restaurantId)
        .eq('rating_context', 'restaurant');

      // Apply filter
      if (filterBy !== 'all') {
        query = query.eq('rating', filterBy);
      }

      // Apply sort
      switch (sortBy) {
        case 'highest':
          query = query.order('rating', { ascending: false });
          break;
        case 'lowest':
          query = query.order('rating', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Pagination
      query = query.range(
        currentPage * REVIEWS_PER_PAGE,
        (currentPage + 1) * REVIEWS_PER_PAGE - 1
      );

      const { data: reviewsData, error: reviewsError } = await query;

      if (reviewsError) throw reviewsError;

      // Check if there are more reviews
      setHasMore((reviewsData?.length || 0) === REVIEWS_PER_PAGE);

      // Fetch profiles separately
      const enrichedReviews: Review[] = [];
      if (reviewsData) {
        for (const review of reviewsData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', review.rater_user_id)
            .maybeSingle();

          enrichedReviews.push({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            created_at: review.created_at,
            rater_display_name: profileData?.display_name || null,
            rater_avatar_url: profileData?.avatar_url || null,
            helpful_count: 0,
          });
        }
      }

      if (reset) {
        setReviews(enrichedReviews);
      } else {
        setReviews(prev => [...prev, ...enrichedReviews]);
      }
      setPage(currentPage + 1);

      // Calculate breakdown (only on initial load)
      if (reset) {
        const { data: allRatings } = await supabase
          .from('user_ratings')
          .select('rating')
          .eq('rated_user_id', restaurantId)
          .eq('rating_context', 'restaurant');

        if (allRatings) {
          const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          allRatings.forEach((r) => {
            counts[r.rating as keyof typeof counts]++;
          });
          setBreakdown(counts);
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${sizeClass} ${
              i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="px-4 py-8 space-y-4" id="restaurant-reviews-section">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 space-y-6" id="restaurant-reviews-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          Avis Clients
        </h2>
        <Badge variant="secondary" className="text-base px-3 py-1">
          {totalRatings} avis
        </Badge>
      </div>

      {/* Rating Breakdown Card */}
      <Card className="p-6 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-amber-500/5 border-yellow-500/20">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Average Rating */}
          <div className="text-center md:pr-6 md:border-r border-border">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-6xl font-bold text-yellow-600"
            >
              {averageRating.toFixed(1)}
            </motion.div>
            <div className="flex items-center justify-center gap-1 mt-2">
              {renderStars(Math.round(averageRating))}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Basé sur {totalRatings} avis
            </div>
          </div>

          {/* Rating Bars */}
          <div className="flex-1 w-full space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = breakdown[stars];
              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

              return (
                <motion.button
                  key={stars}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (5 - stars) * 0.1 }}
                  onClick={() => setFilterBy(filterBy === stars ? 'all' : stars as FilterOption)}
                  className={`flex items-center gap-3 w-full p-1.5 rounded-lg transition-colors ${
                    filterBy === stars ? 'bg-yellow-500/20' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium">{stars}</span>
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: (5 - stars) * 0.1 }}
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-10 text-right">
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Filters & Sort */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {filterBy !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {filterBy} étoiles
              <button onClick={() => setFilterBy('all')} className="ml-1 hover:text-destructive">
                ×
              </button>
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              {sortLabels[sortBy]}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(sortLabels).map(([key, label]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setSortBy(key as SortOption)}
                className={sortBy === key ? 'bg-muted' : ''}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 && !loading ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Aucun avis</p>
          <p className="text-muted-foreground">
            {filterBy !== 'all'
              ? `Aucun avis avec ${filterBy} étoiles`
              : 'Soyez le premier à donner votre avis !'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12 ring-2 ring-muted">
                      <AvatarImage src={review.rater_avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {review.rater_display_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold truncate">
                          {review.rater_display_name || 'Utilisateur'}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(review.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(review.rating, 'sm')}
                        {review.rating === 5 && (
                          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                            Excellent
                          </Badge>
                        )}
                      </div>

                      {review.comment && (
                        <p className="text-sm text-foreground leading-relaxed">
                          {review.comment}
                        </p>
                      )}

                      {/* Review Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {review.images.map((img, i) => (
                            <div key={i} className="w-16 h-16 rounded-lg overflow-hidden">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Helpful Button */}
                      <div className="flex items-center gap-4 mt-3">
                        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 h-8">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          Utile {review.helpful_count ? `(${review.helpful_count})` : ''}
                        </Button>
                      </div>

                      {/* Restaurant Reply */}
                      {review.restaurant_reply && (
                        <div className="mt-3 ml-4 pl-4 border-l-2 border-primary/30 bg-muted/30 p-3 rounded-r-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              Réponse du restaurant
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {review.restaurant_reply}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Load More */}
      {hasMore && reviews.length > 0 && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => loadReviews(false)}
            disabled={loadingMore}
            className="gap-2"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                Voir plus d'avis
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
