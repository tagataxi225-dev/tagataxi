import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Smartphone, Mail, Copy, Share2, QrCode, Facebook, Twitter, Linkedin, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { CongoButton } from '@/components/ui/CongoComponents';
import { getReferralUrl } from '@/config/appUrl';

interface SocialShareButtonsProps {
  referralCode: string;
  userType: 'client' | 'driver' | 'admin' | 'partner';
  reward: number;
}

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ 
  referralCode, 
  userType, 
  reward 
}) => {
  const { toast } = useToast();

  const getShareMessage = () => {
    const referralUrl = getReferralUrl(referralCode);
    
    if (userType === 'driver' || userType === 'admin' || userType === 'partner') {
      return `🚗💼 Deviens chauffeur sur Tembea Taxi Congo !

Utilise mon code de parrainage : ${referralCode}
🎁 Gagne ${reward} CDF de bonus !

✅ Plus de courses, plus de revenus
✅ Application moderne et fiable
✅ Support chauffeur 24/7

Inscris-toi ici : ${referralUrl}`;
    } else {
      return `🚗💰 Rejoins-moi sur Tembea Taxi Congo !

Utilise mon code : ${referralCode}
🎁 Bonus de ${reward} CDF pour toi !

✅ Transport sûr et rapide
✅ Prix transparents
✅ Chauffeurs vérifiés

Inscris-toi ici : ${referralUrl}`;
    }
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleTelegramShare = () => {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://t.me/share/url?text=${message}`, '_blank');
  };

  const handleSMSShare = () => {
    const message = encodeURIComponent(getShareMessage());
    window.open(`sms:?body=${message}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent('Rejoignez KwendaTaxi avec mon code de parrainage');
    const body = encodeURIComponent(getShareMessage());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(getReferralUrl(referralCode));
    const quote = encodeURIComponent(getShareMessage());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, '_blank');
  };

  const handleTwitterShare = () => {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://twitter.com/intent/tweet?text=${message}`, '_blank');
  };

  const handleLinkedInShare = () => {
    const url = encodeURIComponent(getReferralUrl(referralCode));
    const title = encodeURIComponent('Rejoignez KwendaTaxi');
    const summary = encodeURIComponent(getShareMessage());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, '_blank');
  };

  const handleCopyLink = async () => {
    const link = getReferralUrl(referralCode);
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Lien copié !",
        description: "Le lien de parrainage a été copié dans le presse-papier.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive",
      });
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(getShareMessage());
      toast({
        title: "Message copié !",
        description: "Le message de parrainage a été copié dans le presse-papier.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le message.",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Code de parrainage KwendaTaxi',
          text: getShareMessage(),
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      handleCopyMessage();
    }
  };

  const shareButtons = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: '#25D366',
      onClick: handleWhatsAppShare,
      primary: true
    },
    {
      name: 'Telegram',
      icon: Send,
      color: '#0088cc',
      onClick: handleTelegramShare,
      primary: true
    },
    {
      name: 'SMS',
      icon: Smartphone,
      color: 'hsl(var(--congo-blue))',
      onClick: handleSMSShare,
      primary: true
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'hsl(var(--congo-green))',
      onClick: handleEmailShare,
      primary: false
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: '#1877F2',
      onClick: handleFacebookShare,
      primary: false
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: '#1DA1F2',
      onClick: handleTwitterShare,
      primary: false
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: '#0A66C2',
      onClick: handleLinkedInShare,
      primary: false
    },
    {
      name: 'Copier lien',
      icon: Link,
      color: 'hsl(var(--congo-yellow))',
      onClick: handleCopyLink,
      primary: false
    }
  ];

  const primaryButtons = shareButtons.filter(btn => btn.primary);
  const secondaryButtons = shareButtons.filter(btn => !btn.primary);

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Principales options de partage */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">Partage rapide</h3>
          <Badge variant="secondary" className="bg-congo-green/10 text-congo-green border-congo-green/20 text-xs sm:text-sm">
            {reward} CDF/parrain
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {primaryButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <motion.div
                key={button.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  onClick={button.onClick}
                  variant="outline"
                  className="h-20 sm:h-16 flex-col gap-2 hover:scale-105 transition-all duration-200 border-2"
                  style={{
                    backgroundColor: `${button.color}10`,
                    borderColor: `${button.color}30`,
                  }}
                >
                  <Icon 
                    className="h-8 w-8 sm:h-6 sm:w-6" 
                    style={{ color: button.color }}
                  />
                  <span className="text-sm sm:text-xs font-medium">{button.name}</span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Options supplémentaires */}
      <div className="space-y-3">
        <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Plus d'options</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {secondaryButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <motion.div
                key={button.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Button
                  onClick={button.onClick}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 h-12 sm:h-10 hover:bg-muted/50"
                >
                  <Icon 
                    className="h-5 w-5 sm:h-4 sm:w-4" 
                    style={{ color: button.color }}
                  />
                  <span className="text-sm">{button.name}</span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Actions principales */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-2">
        <motion.div 
          className="flex-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <CongoButton
            onClick={handleCopyMessage}
            variant="info"
            className="w-full h-12 sm:h-10 text-sm sm:text-base"
          >
            <Copy className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
            Copier message
          </CongoButton>
        </motion.div>
        
        <motion.div 
          className="flex-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <CongoButton
            onClick={handleNativeShare}
            variant="default"
            className="w-full h-12 sm:h-10 animate-pulse-glow text-sm sm:text-base"
          >
            <Share2 className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
            Partager
          </CongoButton>
        </motion.div>
      </div>

      {/* Aperçu du message avec animation */}
      <motion.div 
        className="p-4 bg-gradient-to-r from-congo-red/5 to-congo-yellow/5 rounded-lg border border-congo-green/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <QrCode className="h-4 w-4 text-congo-green" />
          <p className="text-sm font-medium text-foreground">Aperçu du message</p>
        </div>
        <p className="text-sm text-muted-foreground italic leading-relaxed whitespace-pre-line">
          {getShareMessage()}
        </p>
      </motion.div>
    </div>
  );
};