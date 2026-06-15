import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, Gift, Clock, Calendar, Star, Zap } from 'lucide-react';
import { useChallenges } from '@/hooks/useChallenges';
import { useLanguage } from '@/contexts/LanguageContext';

export const DriverChallenges: React.FC = () => {
  const { t } = useLanguage();
  const {
    loading,
    activeChallenges,
    completedChallenges,
    rewardHistory,
    claimReward,
    enrollInNewChallenges
  } = useChallenges();

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Calendar className="w-4 h-4" />;
      case 'weekly': return <Clock className="w-4 h-4" />;
      case 'monthly': return <Star className="w-4 h-4" />;
      case 'special': return <Zap className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getChallengeTypeLabel = (type: string) => {
    const keyMap: Record<string, string> = {
      daily: 'challenge.daily',
      weekly: 'challenge.weekly',
      monthly: 'challenge.monthly',
      special: 'challenge.special'
    };
    return keyMap[type] ? t(keyMap[type]) : type;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">{t('driver.challenges')}</h2>
        </div>
        <Button
          onClick={enrollInNewChallenges}
          variant="outline"
          size="sm"
        >
          <Target className="w-4 h-4 mr-2" />
          {t('challenge.new_challenges')}
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            {t('challenge.active_tab')} ({activeChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            {t('challenge.completed_tab')} ({completedChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="rewards">
            {t('challenge.rewards_tab')} ({rewardHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeChallenges.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Target className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {t('challenge.no_active')}
                </p>
              </CardContent>
            </Card>
          ) : (
            activeChallenges.map((challenge) => (
              <Card key={challenge.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getChallengeIcon(challenge.challenge.challenge_type)}
                      <CardTitle className="text-lg">
                        {challenge.challenge.title}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary">
                      {getChallengeTypeLabel(challenge.challenge.challenge_type)}
                    </Badge>
                  </div>
                  <CardDescription>
                    {challenge.challenge?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('challenge.progression')}</span>
                      <span>
                        {challenge.current_progress} / {challenge.challenge.target_value}
                      </span>
                    </div>
                    <Progress 
                      value={getProgressPercentage(challenge.current_progress, challenge.challenge.target_value)}
                      className="h-2"
                    />
                  </div>
                  
                  {challenge.is_completed && !challenge.reward_claimed && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {t('challenge.completed_claim')}
                        </span>
                      </div>
                      <Button
                        onClick={() => claimReward(challenge.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {t('challenge.claim')}
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Gift className="w-4 h-4" />
                      <span>
                        {challenge.challenge.reward_value} {challenge.challenge.reward_currency}
                      </span>
                    </div>
                    <span>
                      {t('challenge.expires_on')} {new Date(challenge.challenge.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedChallenges.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {t('challenge.no_completed')}
                </p>
              </CardContent>
            </Card>
          ) : (
            completedChallenges.map((challenge) => (
              <Card key={challenge.id} className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-green-600" />
                      <CardTitle className="text-lg text-green-800">
                        {challenge.challenge.title}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {t('challenge.completed_badge')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700">
                      {t('challenge.completed_on')} {challenge.completed_at ? new Date(challenge.completed_at).toLocaleDateString() : ''}
                    </span>
                    <div className="flex items-center gap-1 text-green-700">
                      <Gift className="w-4 h-4" />
                      <span>
                        {challenge.challenge.reward_value} {challenge.challenge.reward_currency}
                      </span>
                      {challenge.reward_claimed && (
                        <span className="ml-2 text-xs text-green-600">{t('challenge.claimed')}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          {rewardHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Gift className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {t('challenge.no_rewards')}
                </p>
              </CardContent>
            </Card>
          ) : (
            rewardHistory.map((reward) => (
              <Card key={reward.id} className="bg-yellow-50 border-yellow-200">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Gift className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-yellow-800">
                        {reward.challenge.title}
                      </p>
                      <p className="text-sm text-yellow-600">
                        {new Date(reward.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-yellow-800">
                      +{reward.reward_value} {reward.reward_currency}
                    </p>
                    <p className="text-xs text-yellow-600">
                      {t('driver.credited_to_wallet')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
