/**
 * 🎯 PHASE 6: États vides améliorés
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Package, Power } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateCardProps {
  isOnline: boolean;
  serviceType: 'taxi' | 'delivery';
  onGoOnline: () => void;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  isOnline,
  serviceType,
  onGoOnline
}) => {
  const Icon = serviceType === 'taxi' ? Car : Package;
  
  if (!isOnline) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="p-8 text-center space-y-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Power className="h-16 w-16 mx-auto text-muted-foreground" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold mb-2">⏸️ Vous êtes hors ligne</h3>
            <p className="text-muted-foreground mb-4">
              Passez en ligne pour commencer à recevoir des {serviceType === 'taxi' ? 'courses' : 'livraisons'}
            </p>
          </div>
          <Button
            onClick={onGoOnline}
            size="lg"
            className="w-full max-w-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            🟢 Passer en ligne
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-8 text-center space-y-4">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <Icon className="h-16 w-16 mx-auto text-muted-foreground" />
        </motion.div>
        <div>
          <h3 className="text-xl font-bold mb-2">
            {serviceType === 'taxi' ? '🚗 En attente de courses' : '📦 En attente de livraisons'}
          </h3>
          <p className="text-muted-foreground mb-4">
            Vous êtes en ligne. Les nouvelles {serviceType === 'taxi' ? 'courses' : 'livraisons'} apparaîtront ici automatiquement.
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg max-w-md mx-auto">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            💡 <strong>Astuce:</strong> Assurez-vous d'activer les notifications pour ne manquer aucune opportunité !
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
