import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Check, Zap, Clock } from 'lucide-react';

interface POSProLockProps {
  onUpgrade: () => void;
  trialExpired?: boolean;
}

export const POSProLock = ({ onUpgrade, trialExpired = false }: POSProLockProps) => {
  const features = [
    'Sessions de caisse avec suivi en temps réel',
    'Encaissement multi-mode (espèces, Mobile Money, carte)',
    'Rapport de fermeture avec détection des écarts',
    'Historique complet des transactions',
    'Export des rapports en PDF',
    'Support prioritaire',
  ];

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="border-2 border-dashed border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-red-500/5">
          <CardContent className="p-8 text-center space-y-6">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-xl"
            >
              {trialExpired ? (
                <Clock className="h-10 w-10 text-white" />
              ) : (
                <Crown className="h-10 w-10 text-white" />
              )}
            </motion.div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                {trialExpired ? 'Période d\'essai terminée' : 'Fonctionnalité Pro'}
              </h2>
              <p className="text-muted-foreground">
                {trialExpired 
                  ? 'Votre essai gratuit de 15 jours est terminé. Passez au plan Pro pour continuer à utiliser la caisse.'
                  : 'La gestion de caisse est réservée aux abonnements Pro et Premium.'
                }
              </p>
            </div>

            {/* Features */}
            <div className="text-left space-y-3 bg-muted/50 rounded-xl p-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Button
                size="lg"
                onClick={onUpgrade}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold h-12"
              >
                <Zap className="h-5 w-5 mr-2" />
                Passer au plan Pro
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Débloquez toutes les fonctionnalités avancées
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
