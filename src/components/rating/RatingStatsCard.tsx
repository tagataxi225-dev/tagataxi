import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useRating } from '@/hooks/useRating';

interface RatingStatsCardProps {
  userId: string;
  className?: string;
}

export const RatingStatsCard: React.FC<RatingStatsCardProps> = ({ 
  userId,
  className 
}) => {
  const { getRatingStats } = useRating();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await getRatingStats(userId);
        setStats(data);
      } catch (error) {
        console.error('Error loading rating stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadStats();
    }
  }, [userId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total_ratings === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Aucune évaluation pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  const starData = [
    { stars: 5, count: stats.five_stars },
    { stars: 4, count: stats.four_stars },
    { stars: 3, count: stats.three_stars },
    { stars: 2, count: stats.two_stars },
    { stars: 1, count: stats.one_star }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          <span className="text-2xl font-bold">
            {stats.average_rating.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground font-normal">
            / 5
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {stats.total_ratings} avis au total
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {starData.map(({ stars, count }) => {
          const percentage = stats.total_ratings > 0 
            ? (count / stats.total_ratings) * 100 
            : 0;

          return (
            <div key={stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16 text-sm">
                <span className="font-medium">{stars}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </div>
              
              <Progress 
                value={percentage} 
                className="flex-1 h-2"
              />
              
              <span className="text-sm text-muted-foreground w-10 text-right">
                {count}
              </span>
            </div>
          );
        })}

        {stats.ratings_with_comments > 0 && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            {stats.ratings_with_comments} avis avec commentaire
          </p>
        )}
      </CardContent>
    </Card>
  );
};
