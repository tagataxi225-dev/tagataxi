import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UniversalTracker from '@/components/tracking/UniversalTracker';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, Package, Navigation, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UnifiedTracking() {
  const { type, id } = useParams();
  const navigate = useNavigate();

  // Icône selon le type
  const getTypeIcon = () => {
    switch (type) {
      case 'delivery': return <Package className="w-6 h-6" />;
      case 'taxi': return <Navigation className="w-6 h-6" />;
      case 'marketplace': return <ShoppingBag className="w-6 h-6" />;
      default: return <Package className="w-6 h-6" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'delivery': return 'Livraison';
      case 'taxi': return 'Course VTC';
      case 'marketplace': return 'Commande marketplace';
      default: return 'Suivi';
    }
  };

  // Validation des paramètres
  if (!type || !id || !['delivery', 'taxi', 'marketplace'].includes(type)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-destructive/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full"
        >
          <Card className="border-destructive/20 shadow-2xl overflow-hidden">
            <CardContent className="p-8 text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto"
              >
                <AlertCircle className="w-10 h-10 text-destructive" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-destructive mb-2">Lien de suivi invalide</h3>
                <p className="text-sm text-muted-foreground">
                  Le lien que vous avez suivi semble incorrect ou a expiré. 
                  Veuillez vérifier votre lien de suivi ou contactez le support.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/')} 
                variant="outline" 
                className="w-full h-11"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/10">
      {/* Header moderne avec bouton retour */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                {getTypeIcon()}
              </div>
              <div>
                <h1 className="font-bold text-lg">{getTypeLabel()}</h1>
                <p className="text-xs text-muted-foreground">Suivi en temps réel</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contenu principal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <UniversalTracker 
          orderId={id}
          orderType={type as 'delivery' | 'taxi' | 'marketplace'}
          showMap={true}
          showChat={true}
          onBack={() => navigate('/client?tab=activity')}
        />
      </motion.div>
    </div>
  );
}