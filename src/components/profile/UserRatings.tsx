import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  rater_user_id: string;
  booking_id: string | null;
  delivery_id: string | null;
}

export const UserRatings = () => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (user) {
      loadRatings();
    }
  }, [user]);

  const loadRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('*')
        .eq('rated_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRatings(data || []);
      
      if (data && data.length > 0) {
        const total = data.reduce((sum, rating) => sum + rating.rating, 0);
        setAverageRating(Math.round((total / data.length) * 10) / 10);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return <div className="text-center p-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mes évaluations</span>
            {ratings.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {renderStars(Math.round(averageRating))}
                </div>
                <Badge variant="secondary">
                  {averageRating.toFixed(1)} ({ratings.length} avis)
                </Badge>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ratings.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune évaluation pour le moment</p>
              <p className="text-sm text-muted-foreground mt-2">
                Les évaluations apparaîtront après vos premiers voyages
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderStars(rating.rating)}
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(rating.created_at), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {rating.booking_id ? 'Transport' : 'Livraison'}
                    </Badge>
                  </div>
                  
                  {rating.comment && (
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm">{rating.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};