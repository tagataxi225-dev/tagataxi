import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Gift, Smartphone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCampaignTracking } from '@/hooks/useCampaignTracking';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';

const CampaignThankYou = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaign') || '';
  const { trackConversion } = useCampaignTracking(campaignId);
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (campaignId) {
      trackConversion();
    }
  }, [campaignId, trackConversion]);

  const handleContinue = () => {
    navigate('/client');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={500}
        gravity={0.3}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-card rounded-3xl p-8 md:p-12 shadow-2xl border border-border text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6"
          >
            <CheckCircle className="h-12 w-12 text-primary" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            🎉 Félicitations !
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-muted-foreground mb-8"
          >
            Ton inscription a bien été enregistrée. Bienvenue dans la famille Tembea !
          </motion.p>

          {/* Bonuses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4 mb-8"
          >
            <div className="bg-primary/5 rounded-xl p-4 flex items-center gap-4">
              <Gift className="h-8 w-8 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-bold">Tes bonus sont activés !</p>
                <p className="text-sm text-muted-foreground">
                  Vérifie ton portefeuille pour voir tes crédits
                </p>
              </div>
            </div>

            <div className="bg-primary/5 rounded-xl p-4 flex items-center gap-4">
              <Smartphone className="h-8 w-8 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-bold">Installation recommandée</p>
                <p className="text-sm text-muted-foreground">
                  Installe l'app pour une meilleure expérience
                </p>
              </div>
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <Button
              size="lg"
              onClick={handleContinue}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-primary-light hover:shadow-xl"
            >
              Accéder à mon compte
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/install')}
              className="w-full h-14 text-lg font-bold"
            >
              <Smartphone className="mr-2 h-5 w-5" />
              Installer l'application
            </Button>
          </motion.div>

          {/* Footer message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-sm text-muted-foreground mt-8"
          >
            📧 Un email de confirmation a été envoyé à ton adresse
          </motion.p>
        </div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-8 text-muted-foreground"
        >
          <p className="text-sm">
            Besoin d'aide ? Contacte notre support 24/7
          </p>
          <p className="text-sm font-medium mt-2">
            📞 +243 XXX XXX XXX
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CampaignThankYou;
