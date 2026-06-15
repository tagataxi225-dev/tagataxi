/**
 * 🎁 Dashboard parrainage chauffeur
 * - Code QR + partage
 * - Liste filleuls
 * - Stats gains
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Copy, 
  Share2, 
  QrCode, 
  Gift, 
  Users, 
  DollarSign,
  CheckCircle,
  Clock,
  Trophy,
  Info
} from 'lucide-react';
import { useReferralSystem } from '@/hooks/useReferralSystem';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getReferralUrl } from '@/config/appUrl';

export const ReferralDashboard: React.FC = () => {
  const { referralCode, referrals, stats, loading } = useReferralSystem();
  const [showQR, setShowQR] = useState(false);

  const shareUrl = referralCode 
    ? getReferralUrl(referralCode.code)
    : '';

  const handleCopyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode.code);
      toast.success('Code copié !');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Lien copié !');
  };

  const handleShare = async () => {
    if (!referralCode) return;

    const shareData = {
      title: 'Rejoignez Tembea VTC',
      text: `Utilisez mon code de parrainage ${referralCode.code} et gagnez 3000 CDF !`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'En attente', variant: 'secondary' as const, icon: Clock },
      completed: { label: 'Validé', variant: 'default' as const, icon: CheckCircle },
      expired: { label: 'Expiré', variant: 'destructive' as const, icon: Clock },
      cancelled: { label: 'Annulé', variant: 'outline' as const, icon: Clock }
    };

    const { label, variant, icon: Icon } = config[status as keyof typeof config] || config.pending;
    
    return (
      <Badge variant={variant}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-4"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!referralCode) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun code de parrainage</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Un code sera généré automatiquement pour vous bientôt
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec stats */}
      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Mon code de parrainage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code */}
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-xs opacity-75 mb-1">Votre code</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-3xl font-bold tracking-wider">
                {referralCode.code}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyCode}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Actions de partage */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-1" />
              Lien
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleShare}
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Partager
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowQR(true)}
              className="w-full"
            >
              <QrCode className="w-4 h-4 mr-1" />
              QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats grille */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Filleuls total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.completedReferrals}</p>
            <p className="text-xs text-muted-foreground">Validés</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.pendingReferrals}</p>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {stats.totalEarned.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">CDF gagnés</p>
          </CardContent>
        </Card>
      </div>

      {/* Limite de filleuls */}
      {stats.remainingSlots <= 5 && stats.remainingSlots > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <DollarSign className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-sm text-yellow-700 dark:text-yellow-400">
            <strong>Plus que {stats.remainingSlots} place(s)</strong> disponible(s) sur {stats.maxReferrals}
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des filleuls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Mes filleuls ({referrals?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals && referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.map((referral, index) => (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">
                        {referral.referred_user?.full_name || 'Nouveau chauffeur'}
                      </p>
                      {getStatusBadge(referral.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {referral.referred_completed_rides}/{referral.validation_threshold} courses
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(referral.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {referral.status === 'pending' && (
                      <div className="mt-2">
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ 
                              width: `${(referral.referred_completed_rides / referral.validation_threshold) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      referral.referrer_bonus_paid ? 'text-green-500' : 'text-muted-foreground'
                    }`}>
                      {referral.referrer_bonus_paid ? '✓ ' : ''}
                      {referral.referrer_bonus_amount.toLocaleString()} CDF
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Aucun filleul pour le moment
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Partagez votre code pour commencer à gagner !
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info parrainage */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm text-blue-900 dark:text-blue-300">
              <p className="font-semibold">Comment ça marche ?</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Partagez votre code avec de nouveaux chauffeurs</li>
                <li>Ils reçoivent 3000 CDF de bonus à l'inscription</li>
                <li>Vous recevez 5000 CDF quand ils complètent 10 courses</li>
                <li>Pas de limite au nombre de filleuls !</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal QR Code */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code de parrainage</DialogTitle>
            <DialogDescription>
              Scannez pour vous inscrire avec le code {referralCode.code}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-white rounded-lg">
              <QRCodeSVG
                value={shareUrl}
                size={200}
                level="H"
                includeMargin
              />
            </div>

            <Button onClick={handleCopyLink} className="w-full">
              <Copy className="w-4 h-4 mr-2" />
              Copier le lien
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
