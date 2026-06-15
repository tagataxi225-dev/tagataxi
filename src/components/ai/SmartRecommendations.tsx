import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ShoppingCart, Star, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface Recommendation {
  id: string;
  type: 'destination' | 'product' | 'route' | 'service';
  title: string;
  subtitle?: string;
  value?: string;
  confidence: number;
  icon?: React.ReactNode;
  action?: () => void;
}

interface SmartRecommendationsProps {
  context?: 'transport' | 'delivery' | 'marketplace' | 'general';
  maxItems?: number;
  className?: string;
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  context = 'general',
  maxItems = 4,
  className = ''
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadRecommendations();
  }, [context, user?.id]);

  const loadRecommendations = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const recs: Recommendation[] = [];

      if (context === 'transport' || context === 'general') {
        // Recommandations génériques de destinations populaires
        recs.push({
          id: 'dest-gombe',
          type: 'destination',
          title: 'Centre-ville (Gombe)',
          subtitle: 'Destination populaire',
          confidence: 90,
          icon: <MapPin className="h-4 w-4" />,
          action: () => {
            console.log('Navigate to booking with destination: Gombe');
          }
        });

        recs.push({
          id: 'dest-lemba',
          type: 'destination', 
          title: 'Université de Kinshasa (Lemba)',
          subtitle: 'Campus universitaire',
          confidence: 75,
          icon: <MapPin className="h-4 w-4" />,
          action: () => {
            console.log('Navigate to booking with destination: Lemba');
          }
        });


        // Routes optimales
        recs.push({
          id: 'route-optimization',
          type: 'route',
          title: 'Route optimale vers Gombe',
          subtitle: 'Évite les embouteillages actuels',
          value: '15 min plus rapide',
          confidence: 85,
          icon: <TrendingUp className="h-4 w-4" />
        });
      }

      if (context === 'marketplace' || context === 'general') {
        // Produits recommandés génériques
        recs.push({
          id: 'product-electronics',
          type: 'product',
          title: 'Nouveautés en Électronique',
          subtitle: 'Produits populaires cette semaine',
          confidence: 80,
          icon: <ShoppingCart className="h-4 w-4" />
        });

        // Produits tendances
        recs.push({
          id: 'trending-products',
          type: 'product',
          title: 'Produits tendances cette semaine',
          subtitle: 'Les plus populaires à Kinshasa',
          confidence: 80,
          icon: <Star className="h-4 w-4" />
        });
      }

      if (context === 'delivery' || context === 'general') {
        // Créneaux de livraison optimaux
        const currentHour = new Date().getHours();
        const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);

        if (isRushHour) {
          recs.push({
            id: 'delivery-timing',
            type: 'service',
            title: 'Livraison différée recommandée',
            subtitle: 'Éviter les heures de pointe',
            value: '30% moins cher',
            confidence: 90,
            icon: <Clock className="h-4 w-4" />
          });
        }
      }

      // Recommandations basées sur la localisation et l'heure
      const now = new Date();
      const hour = now.getHours();

      if (hour >= 11 && hour <= 14) {
        recs.push({
          id: 'lunch-delivery',
          type: 'service',
          title: 'Livraison déjeuner express',
          subtitle: 'Restaurants populaires près de vous',
          confidence: 75,
          icon: <TrendingUp className="h-4 w-4" />
        });
      }

      setRecommendations(recs.slice(0, maxItems));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Recommandations intelligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
                rec.action ? 'hover:bg-muted/50' : ''
              }`}
              onClick={rec.action}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg text-primary">
                  {rec.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-sm leading-tight">
                        {rec.title}
                      </h4>
                      {rec.subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {rec.subtitle}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {rec.value && (
                        <Badge variant="secondary" className="text-xs">
                          {rec.value}
                        </Badge>
                      )}
                      <div 
                        className={`w-2 h-2 rounded-full ${getConfidenceColor(rec.confidence)}`}
                        title={`Confiance: ${rec.confidence}%`}
                      />
                      {rec.action && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2"
          onClick={loadRecommendations}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Actualiser les recommandations
        </Button>
      </CardContent>
    </Card>
  );
};