import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  buyer: {
    name: string;
    avatar?: string;
  };
  images?: string[];
}

interface ProductReviewsSectionProps {
  avgRating: number;
  reviews: Review[];
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  avgRating,
  reviews = []
}) => {
  if (reviews.length === 0) {
    return null;
  }

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.floor(r.rating) === star).length,
    percentage: (reviews.filter(r => Math.floor(r.rating) === star).length / reviews.length) * 100
  }));

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Avis clients
          </h3>
          {reviews.length > 3 && (
            <Button variant="link" size="sm">
              Voir tout ({reviews.length}) →
            </Button>
          )}
        </div>
        
        {/* Stats globales */}
        <div className="grid grid-cols-[auto,1fr] gap-4 sm:gap-6 p-4 bg-muted/30 rounded-lg">
          {/* Note moyenne */}
          <div className="text-center">
            <p className="text-4xl sm:text-5xl font-bold">{avgRating.toFixed(1)}</p>
            <div className="flex gap-0.5 mt-2 justify-center">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{reviews.length} avis</p>
          </div>
          
          {/* Distribution étoiles */}
          <div className="space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs w-3">{star}</span>
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Top 3 reviews */}
        <div className="space-y-3">
          {reviews.slice(0, 3).map(review => (
            <div key={review.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-start gap-3">
                <img 
                  src={review.buyer.avatar || '/placeholder.svg'}
                  alt={review.buyer.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <p className="font-semibold text-sm truncate">{review.buyer.name}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-semibold">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), { 
                      addSuffix: true,
                      locale: fr 
                    })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {review.comment}
              </p>
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {review.images.map((img, i) => (
                    <img 
                      key={i}
                      src={img}
                      alt={`Review image ${i + 1}`}
                      className="w-16 h-16 rounded object-cover flex-shrink-0"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
