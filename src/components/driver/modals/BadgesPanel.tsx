import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award, Zap, Target, Crown, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const AVAILABLE_BADGES = [
  { id: '1', icon: Star, name: 'Première course', description: 'Complétez votre première course', unlocked: true, progress: 100 },
  { id: '2', icon: Trophy, name: '10 courses', description: 'Complétez 10 courses', unlocked: true, progress: 100 },
  { id: '3', icon: Award, name: '50 courses', description: 'Complétez 50 courses', unlocked: false, progress: 35 },
  { id: '4', icon: Zap, name: 'Rapide', description: 'Livrez 5 commandes en moins de 30 minutes', unlocked: false, progress: 60 },
  { id: '5', icon: Target, name: 'Précis', description: 'Maintenez une note de 4.5+', unlocked: true, progress: 100 },
  { id: '6', icon: Crown, name: 'VIP', description: 'Effectuez 100 courses avec note parfaite', unlocked: false, progress: 12 },
];

export const BadgesPanel: React.FC = () => {
  const unlockedCount = AVAILABLE_BADGES.filter(b => b.unlocked).length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-6 w-6" />
                <span className="text-lg font-bold">Mes Badges</span>
              </div>
              <p className="text-sm opacity-90">
                {unlockedCount} sur {AVAILABLE_BADGES.length} badges débloqués
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{unlockedCount}</div>
              <div className="text-xs opacity-90">Badges</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille de badges */}
      <div className="grid grid-cols-2 gap-4">
        {AVAILABLE_BADGES.map((badge) => {
          const Icon = badge.icon;
          return (
            <Card 
              key={badge.id}
              className={`relative ${
                badge.unlocked 
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' 
                  : 'opacity-60 bg-muted'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  {/* Icône */}
                  <div className={`p-4 rounded-full ${
                    badge.unlocked 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white' 
                      : 'bg-muted-foreground/20 text-muted-foreground'
                  }`}>
                    {badge.unlocked ? (
                      <Icon className="h-8 w-8" />
                    ) : (
                      <Lock className="h-8 w-8" />
                    )}
                  </div>
                  
                  {/* Nom */}
                  <h4 className="font-semibold text-sm">{badge.name}</h4>
                  
                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {badge.description}
                  </p>

                  {/* Progression (si non débloqué) */}
                  {!badge.unlocked && (
                    <div className="w-full space-y-1">
                      <Progress value={badge.progress} className="h-1" />
                      <p className="text-xs text-muted-foreground">{badge.progress}%</p>
                    </div>
                  )}

                  {/* Badge débloqué */}
                  {badge.unlocked && (
                    <Badge className="bg-green-600">
                      ✓ Débloqué
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            💡 <strong>Astuce :</strong> Débloquez plus de badges pour augmenter votre visibilité et obtenir des bonus exclusifs !
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
