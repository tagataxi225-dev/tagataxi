import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Share2, Copy, Check, Gift, QrCode, Info } from 'lucide-react';
import { useReferralSystem } from '@/hooks/useReferralSystem';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QRCodeDialog } from './QRCodeDialog';

export const ReferralPanel: React.FC = () => {
  const { referralCode, referrals, stats, loading } = useReferralSystem();
  const { triggerHaptic, triggerSuccess } = useHapticFeedback();
  const [copied, setCopied] = React.useState(false);
  const [qrModalOpen, setQrModalOpen] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);

  const handleCopy = () => {
    if (referralCode?.code) {
      navigator.clipboard.writeText(referralCode.code);
      setCopied(true);
      triggerSuccess();
      toast.success('Code copié !');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!referralCode?.code) return;
    triggerHaptic();

    const shareData = {
      title: 'Rejoignez Tembea',
      text: `Utilisez mon code de parrainage ${referralCode.code} et gagnez 500 CDF !`,
      url: `https://tembea.app/app/register?ref=${referralCode.code}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  const displayedReferrals = showAll ? (referrals || []) : (referrals || []).slice(0, 3);

  return (
    <div className="space-y-4 p-4">
      {/* Code de parrainage compact */}
      <Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
        <CardContent className="p-4">
          {referralCode || loading ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Votre code</p>
                  <p className="text-2xl font-bold tracking-wider">
                    {loading ? (
                      <span className="text-muted-foreground animate-pulse">•••••</span>
                    ) : (
                      referralCode?.code
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleCopy}
                    className="h-9 w-9 p-0"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleShare}
                    className="h-9 w-9 p-0"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setQrModalOpen(true)}
                    className="h-9 w-9 p-0"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Code non disponible</p>
          )}
        </CardContent>
      </Card>

      {/* Stats inline */}
      <div className="flex gap-4 text-center">
        <div className="flex-1 py-3 px-4 rounded-lg bg-muted/50">
          <p className="text-2xl font-bold">{referrals?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Filleuls</p>
        </div>
        <Separator orientation="vertical" className="h-auto" />
        <div className="flex-1 py-3 px-4 rounded-lg bg-muted/50">
          <p className="text-2xl font-bold text-green-600">{stats.totalEarned.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">CDF gagnés</p>
        </div>
      </div>

      {/* Info reward */}
      <Alert className="border-green-600/20 bg-green-50 dark:bg-green-950/20">
        <Gift className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-sm ml-2">
          Gagnez <strong>500 CDF</strong> par ami qui s'inscrit avec votre code
        </AlertDescription>
      </Alert>

      {/* Liste simplifiée */}
      {(referrals?.length || 0) > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Derniers filleuls</h3>
            {(referrals?.length || 0) > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAll(!showAll)}
                className="h-7 text-xs"
              >
                {showAll ? 'Voir moins' : `Voir tout (${referrals?.length})`}
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {displayedReferrals.map((referral) => (
              <div 
                key={referral.id} 
                className="flex items-center justify-between py-3 px-3 rounded-lg bg-card border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-primary/10">
                      <Users className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{referral.referred_user?.full_name || 'Nouveau chauffeur'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(referral.created_at), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={referral.status === 'completed' ? 'default' : 'secondary'}
                  className="font-semibold"
                >
                  {referral.referrer_bonus_amount} CDF
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-1">Aucun filleul pour le moment</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Info className="h-3 w-3" />
              Partagez votre code pour gagner 500 CDF par filleul !
            </p>
          </CardContent>
        </Card>
      )}

      {/* QR Code Modal */}
      {referralCode?.code && (
        <QRCodeDialog 
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          referralCode={referralCode.code}
        />
      )}
    </div>
  );
};
