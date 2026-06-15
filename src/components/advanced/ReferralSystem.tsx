import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Share2, Copy, Users, Gift, Star, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReferralData {
  userCode: string;
  totalReferred: number;
  totalEarned: number;
  pendingRewards: number;
  recentReferrals: Array<{
    name: string;
    date: string;
    reward: number;
    status: 'pending' | 'completed';
  }>;
}

const ReferralSystem: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'invite' | 'rewards'>('overview');

  // Mock data - in real app this would come from API
  const referralData: ReferralData = {
    userCode: 'KWENDA2024',
    totalReferred: 12,
    totalEarned: 15000,
    pendingRewards: 3000,
    recentReferrals: [
      { name: 'Marie K.', date: '2024-01-15', reward: 2000, status: 'completed' },
      { name: 'Jean P.', date: '2024-01-14', reward: 2000, status: 'pending' },
      { name: 'Grace M.', date: '2024-01-12', reward: 2000, status: 'completed' },
    ]
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralData.userCode);
    toast({
      title: 'Code copié!',
      description: 'Votre code de parrainage a été copié dans le presse-papier',
    });
  };

  const shareReferralLink = () => {
    const shareText = `Rejoins-moi sur Tembea Taxi avec mon code de parrainage ${referralData.userCode} et gagne 2000 CDF! 🚗💰`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Tembea Taxi - Code de parrainage',
        text: shareText,
        url: `https://tembea.app/ref/${referralData.userCode}`
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: 'Lien de partage copié!',
        description: 'Le message de parrainage a été copié',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Système de Parrainage</h1>
        <p className="text-sm md:text-base text-muted-foreground px-4">
          Invitez vos amis et gagnez 2000 CDF pour chaque utilisateur
        </p>
      </div>

      {/* Navigation Tabs - Mobile First */}
      <div className="flex bg-muted p-1 rounded-lg gap-1">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('overview')}
          className="flex-1 text-xs sm:text-sm py-2 px-2"
        >
          <DollarSign className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Vue d'ensemble</span>
          <span className="sm:hidden">Vue</span>
        </Button>
        <Button
          variant={activeTab === 'invite' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('invite')}
          className="flex-1 text-xs sm:text-sm py-2 px-2"
        >
          <Share2 className="h-4 w-4 mr-1" />
          Inviter
        </Button>
        <Button
          variant={activeTab === 'rewards' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('rewards')}
          className="flex-1 text-xs sm:text-sm py-2 px-2"
        >
          <Gift className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Récompenses</span>
          <span className="sm:hidden">Prix</span>
        </Button>
      </div>

      {/* Overview Tab - Mobile Optimized */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="space-y-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amis parrainés</p>
                      <p className="text-2xl font-bold">{referralData.totalReferred}</p>
                      <p className="text-xs text-green-600">+3 ce mois</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total gagné</p>
                      <p className="text-2xl font-bold">{formatCurrency(referralData.totalEarned)}</p>
                      <p className="text-xs text-orange-600">
                        {formatCurrency(referralData.pendingRewards)} en attente
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Referrals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Parrainages récents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {referralData.recentReferrals.map((referral, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {referral.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{referral.name}</p>
                      <p className="text-xs text-muted-foreground">{referral.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(referral.reward)}</p>
                    <Badge 
                      variant={referral.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {referral.status === 'completed' ? 'Reçu' : 'En attente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Tab - Mobile Optimized */}
      {activeTab === 'invite' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Votre code de parrainage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-2">Code de parrainage</p>
                <p className="text-2xl font-bold tracking-wider">{referralData.userCode}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={copyReferralCode}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
                <Button 
                  onClick={shareReferralLink} 
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comment ça marche ?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: "Partagez votre code",
                    description: "Donnez votre code de parrainage à vos amis"
                  },
                  {
                    step: 2,
                    title: "Inscription avec le code",
                    description: "Vos amis s'inscrivent avec votre code"
                  },
                  {
                    step: 3,
                    title: "Gagnez des récompenses",
                    description: "Recevez 2000 CDF pour chaque ami qui fait sa première course"
                  }
                ].map((item) => (
                  <div key={item.step} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rewards Tab - Mobile Optimized */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Programme de fidélité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Niveau actuel</span>
                  <Badge className="bg-orange-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Bronze
                  </Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500" style={{ width: '60%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Parrainez 8 amis de plus pour atteindre le niveau Argent
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Récompenses par niveau</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { level: 'Bronze', referrals: '1-20', bonus: '2000 CDF', active: true, color: 'orange' },
                  { level: 'Argent', referrals: '21-50', bonus: '3000 CDF', active: false, color: 'gray' },
                  { level: 'Or', referrals: '51-100', bonus: '5000 CDF', active: false, color: 'yellow' },
                  { level: 'Platine', referrals: '100+', bonus: '10000 CDF', active: false, color: 'blue' }
                ].map((tier, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border transition-all ${
                      tier.active ? 'bg-accent/20 border-primary shadow-sm' : 'bg-muted/50 border-border/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tier.active ? 'bg-primary' : 'bg-muted'
                        }`}>
                          <Star className={`h-4 w-4 ${tier.active ? 'text-white' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tier.level}</p>
                          <p className="text-xs text-muted-foreground">{tier.referrals} parrainages</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-primary">{tier.bonus}</p>
                        <p className="text-xs text-muted-foreground">par parrainage</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReferralSystem;