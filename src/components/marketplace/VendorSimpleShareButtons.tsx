import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Copy, Check, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getVendorShopUrl } from '@/config/appUrl';

interface VendorSimpleShareButtonsProps {
  vendorId: string;
  vendorName: string;
  productCount: number;
  rating?: number;
}

export const VendorSimpleShareButtons: React.FC<VendorSimpleShareButtonsProps> = ({
  vendorId,
  vendorName,
  productCount,
  rating = 0
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  // ✅ Validation UUID côté client
  React.useEffect(() => {
    if (!vendorId || vendorId.length !== 36) {
      console.error('[VendorShare] Invalid vendor ID:', vendorId);
      toast({
        variant: 'destructive',
        title: '⚠️ Erreur de configuration',
        description: 'Votre ID boutique est invalide. Contactez le support Tembea.'
      });
    }
  }, [vendorId, toast]);

  const shopUrl = getVendorShopUrl(vendorId);
  
  // Message enrichi avec emojis
  const shareMessage = `💥 ${vendorName} est en ligne sur Tembea Shop !

Découvre nos produits, passe ta commande et fais-toi livrer où que tu sois 📦✨

📊 ${productCount} produits disponibles
⭐ Note ${rating.toFixed(1)}/5
📍 Kinshasa, RDC

👉 Visite la boutique maintenant : ${shopUrl}`;

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
    
    toast({
      title: '✅ Partagé sur WhatsApp',
      description: 'Votre lien a été ouvert dans WhatsApp',
    });
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shopUrl)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
    
    toast({
      title: '✅ Partagé sur Telegram',
      description: 'Votre lien a été ouvert dans Telegram',
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      toast({
        title: '✅ Lien copié !',
        description: 'Le lien de votre boutique a été copié dans le presse-papier.'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: 'Impossible de copier le lien.'
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* ✅ MODERNE : Header avec icon animé */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
          <Share2 className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-bold text-lg">Partager ma boutique</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Partagez votre lien pour attirer plus de clients
        </p>
      </motion.div>
      
      {/* ✅ MODERNE : Affichage du lien avec glassmorphism */}
      <motion.div 
        className="p-4 rounded-xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border border-primary/10 backdrop-blur-sm"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-xs font-semibold text-muted-foreground mb-2">Votre lien unique :</p>
        <p className="text-sm font-mono break-all text-foreground/80 bg-background/50 p-2 rounded-lg">
          {shopUrl}
        </p>
      </motion.div>
      
      {/* ✅ MODERNE : Boutons de partage avec animations */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            variant="outline"
            className="w-full h-14 justify-start gap-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-300 text-green-700 dark:from-green-950 dark:to-green-900 dark:hover:from-green-900 dark:hover:to-green-800 dark:border-green-700 dark:text-green-300 font-semibold shadow-sm"
            onClick={handleWhatsAppShare}
          >
            <MessageCircle className="h-5 w-5" />
            <span>Partager sur WhatsApp</span>
          </Button>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            variant="outline"
            className="w-full h-14 justify-start gap-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-300 text-blue-700 dark:from-blue-950 dark:to-blue-900 dark:hover:from-blue-900 dark:hover:to-blue-800 dark:border-blue-700 dark:text-blue-300 font-semibold shadow-sm"
            onClick={handleTelegram}
          >
            <Send className="h-5 w-5" />
            <span>Partager sur Telegram</span>
          </Button>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            variant="outline"
            className="w-full h-14 justify-start gap-3 font-semibold shadow-sm"
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-green-600">Lien copié !</span>
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" />
                <span>Copier le lien</span>
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
