/**
 * 🔥 Compteur de Streak Grattage Quotidien
 * Affiche le streak actuel avec calendrier visuel et récompenses
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Gift, ChevronRight, Trophy, Calendar, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  STREAK_REWARDS, 
  getNextReward, 
  getEarnedRewards,
  StreakData 
} from '@/types/gratta-streaks';

interface StreakCounterProps {
  streakData: StreakData;
  onViewRewards?: () => void;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  streakData,
  onViewRewards
}) => {
  const { currentStreak, longestStreak, todayScratched } = streakData;
  const nextReward = getNextReward(currentStreak);
  const earnedRewards = getEarnedRewards(currentStreak);
  
  // Calculer la progression vers la prochaine récompense
  const prevMilestone = earnedRewards.length > 0 
    ? earnedRewards[earnedRewards.length - 1].day 
    : 0;
  const nextMilestone = nextReward?.day || prevMilestone + 7;
  const progress = ((currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;

  // Générer les 7 derniers jours pour le calendrier visuel
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const dayIndex = 6 - i;
    const isCompleted = dayIndex < currentStreak || (dayIndex === 0 && todayScratched);
    const isToday = dayIndex === 0;
    return { dayIndex, isCompleted, isToday };
  }).reverse();

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-yellow-500/10">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Streak principal */}
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: todayScratched ? [1, 1.1, 1] : 1,
                rotate: todayScratched ? [0, -5, 5, 0] : 0
              }}
              transition={{ duration: 0.5, repeat: todayScratched ? Infinity : 0, repeatDelay: 2 }}
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                currentStreak >= 7 
                  ? "bg-gradient-to-br from-orange-500 to-red-500" 
                  : currentStreak >= 3 
                    ? "bg-gradient-to-br from-yellow-500 to-orange-500"
                    : "bg-gradient-to-br from-gray-400 to-gray-500"
              )}
            >
              <Flame className="h-8 w-8 text-white" />
            </motion.div>
            
            <div>
              <div className="flex items-center gap-2">
                <motion.span 
                  key={currentStreak}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-black"
                >
                  {currentStreak}
                </motion.span>
                <span className="text-sm text-muted-foreground">
                  jour{currentStreak !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Record: {longestStreak} jours
              </p>
            </div>
          </div>

          {/* Prochaine récompense */}
          {nextReward && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onViewRewards}
              className="text-right cursor-pointer hover:opacity-80 transition-opacity"
            >
              <p className="text-xs text-muted-foreground mb-1">Prochaine récompense</p>
              <div className="flex items-center gap-2 justify-end">
                <Badge 
                  variant="secondary" 
                  className={cn("font-medium", nextReward.color)}
                >
                  {nextReward.icon} J{nextReward.day}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs font-medium mt-1">{nextReward.label}</p>
            </motion.div>
          )}
        </div>

        {/* Calendrier visuel des 7 derniers jours */}
        <div className="mt-4 flex items-center justify-between gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
          {last7Days.map((day, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium",
                day.isCompleted 
                  ? day.isToday
                    ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md"
                    : "bg-green-500/20 text-green-600 dark:text-green-400"
                  : day.isToday
                    ? "bg-orange-500/20 border-2 border-dashed border-orange-500 text-orange-600"
                    : "bg-muted/50 text-muted-foreground"
              )}
            >
              {day.isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✓
                </motion.div>
              ) : day.isToday ? (
                <span className="text-[10px]">Auj.</span>
              ) : (
                <span className="text-[10px]">-</span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Barre de progression vers prochaine récompense */}
        {nextReward && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>J{prevMilestone}</span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                J{nextMilestone}
              </span>
            </div>
            <Progress 
              value={progress} 
              className="h-2 bg-muted/50"
            />
          </div>
        )}

        {/* Récompenses gagnées récentes */}
        {earnedRewards.length > 0 && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Gagnés:</span>
            <AnimatePresence>
              {earnedRewards.slice(-3).map((reward, i) => (
                <motion.div
                  key={reward.day}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs whitespace-nowrap", reward.color)}
                  >
                    {reward.icon} {reward.label}
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Message d'encouragement */}
        {!todayScratched && currentStreak > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 p-2 bg-orange-500/10 rounded-lg text-center"
          >
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              🔥 Gratte ta carte aujourd'hui pour maintenir ton streak !
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
