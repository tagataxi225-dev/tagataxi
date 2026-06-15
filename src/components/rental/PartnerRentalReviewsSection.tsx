import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, CheckCircle, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { usePartnerRentalRating } from '@/hooks/usePartnerRentalRating';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  rater_id: string;
  rater_name: string;
  rater_avatar: string | null;
  has_booking: boolean;
}

interface PartnerRentalReviewsSectionProps {
  partnerId: string;
  onReviewDeleted?: () => void;
}

export const PartnerRentalReviewsSection = ({ partnerId, onReviewDeleted }: PartnerRentalReviewsSectionProps) => {
  const { user } = useAuth();
  const { deletePartnerRating, loading: deleteLoading } = usePartnerRentalRating();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    average: 0,
    count: 0,
    breakdown: [0, 0, 0, 0, 0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [partnerId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      const { data: ratingsData, error: ratingsError } = await supabase
        .from('partner_ratings')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ratingsError) throw ratingsError;

      if (ratingsData && ratingsData.length > 0) {
        const raterIds = ratingsData.map(r => r.client_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', raterIds);

        if (profilesError) throw profilesError;

        const { data: bookings, error: bookingsError } = await supabase
          .from('rental_bookings')
          .select('user_id')
          .eq('status', 'completed')
          .in('user_id', raterIds);

        if (bookingsError) throw bookingsError;

        const usersWithBookings = new Set(bookings?.map(b => b.user_id));
        const profilesMap = new Map(profiles?.map(p => [p.user_id, p]));

        const reviewsWithProfiles: Review[] = ratingsData.map(r => {
          const profile = profilesMap.get(r.client_id);
          return {
            id: r.id,
            rating: r.rating,
            comment: r.comment || '',
            created_at: r.created_at,
            rater_id: r.client_id,
            rater_name: profile?.display_name || 'Utilisateur',
            rater_avatar: profile?.avatar_url || null,
            has_booking: usersWithBookings.has(r.client_id)
          };
        });

        setReviews(reviewsWithProfiles);

        const breakdown = [0, 0, 0, 0, 0];
        ratingsData.forEach(r => {
          breakdown[r.rating - 1]++;
        });

        const average = ratingsData.reduce((acc, r) => acc + r.rating, 0) / ratingsData.length;

        setStats({ average, count: ratingsData.length, breakdown });
      } else {
        setReviews([]);
        setStats({ average: 0, count: 0, breakdown: [0, 0, 0, 0, 0] });
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    const success = await deletePartnerRating(partnerId);
    if (success) {
      fetchReviews();
      onReviewDeleted?.();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Aucun avis pour le moment
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Avis Clients</span>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            <span className="text-2xl font-bold">{stats.average.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({stats.count} avis)</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Breakdown */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(stars => {
            const count = stats.breakdown[stars - 1];
            const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0;
            
            return (
              <div key={stars} className="flex items-center gap-3">
                <span className="text-sm w-8">{stars}★</span>
                <Progress value={percentage} className="flex-1" />
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Reviews list */}
        <div className="space-y-4 pt-4 border-t">
          {reviews.map(review => (
            <div key={review.id} className="space-y-2">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.rater_avatar || undefined} />
                  <AvatarFallback>{review.rater_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.rater_name}</span>
                    {review.has_booking && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Location vérifiée
                      </Badge>
                    )}
                    {/* Delete button for own review */}
                    {user?.id === review.rater_id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive"
                            disabled={deleteLoading}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Retirer votre avis ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. Vous pourrez cependant laisser un nouvel avis par la suite.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteReview}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Retirer mon avis
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(review.created_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};