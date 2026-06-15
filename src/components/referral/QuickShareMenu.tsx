import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Send, Smartphone, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getReferralUrl } from '@/config/appUrl';

interface QuickShareMenuProps {
  referralCode: string;
  userType: 'client' | 'driver' | 'partner' | 'admin';
  reward: number;
  children: React.ReactNode;
}

export const QuickShareMenu: React.FC<QuickShareMenuProps> = ({
  referralCode,
  userType,
  reward,
  children
}) => {
  const { toast } = useToast();

  const getShareMessage = () => {
    const rewardText = userType === 'client' ? '500 CDF' : '2000 CDF';
    const referralLink = getReferralUrl(referralCode);
    
    if (userType === 'client') {
      return `🚗 Rejoignez-moi sur Tembea avec le code ${referralCode} et obtenez ${rewardText} de crédit gratuit ! Inscrivez-vous : ${referralLink}`;
    } else {
      return `🚕 Devenez chauffeur Tembea avec mon code ${referralCode} et obtenez ${rewardText} de bonus ! Inscription : ${referralLink}`;
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-64 p-4 sm:p-4" align="end">
        <div className="space-y-3">
          <h4 className="font-medium text-base sm:text-sm text-foreground mb-3">Partager rapidement</h4>
          
          <Button
            onClick={handleWhatsAppShare}
            variant="outline"
            className="w-full justify-start h-12 sm:h-9 bg-[#25D366]/10 hover:bg-[#25D366]/20 border-[#25D366]/30 text-sm sm:text-sm"
          >
            <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4 mr-3 sm:mr-2 text-[#25D366]" />
            WhatsApp
          </Button>

          <Button
            onClick={handleTelegramShare}
            variant="outline"
            className="w-full justify-start h-12 sm:h-9 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border-[#0088cc]/30 text-sm sm:text-sm"
          >
            <Send className="h-5 w-5 sm:h-4 sm:w-4 mr-3 sm:mr-2 text-[#0088cc]" />
            Telegram
          </Button>

          <Button
            onClick={handleSMSShare}
            variant="outline"
            className="w-full justify-start h-12 sm:h-9 bg-congo-blue/10 hover:bg-congo-blue/20 border-congo-blue/30 text-sm sm:text-sm"
          >
            <Smartphone className="h-5 w-5 sm:h-4 sm:w-4 mr-3 sm:mr-2 text-congo-blue" />
            SMS
          </Button>

          <div className="border-t pt-3">
            <Button
              onClick={handleCopyMessage}
              variant="outline"
              className="w-full justify-start h-12 sm:h-9 text-sm sm:text-sm"
            >
              <Copy className="h-5 w-5 sm:h-4 sm:w-4 mr-3 sm:mr-2" />
              Copier le message
            </Button>

            <Button
              onClick={handleNativeShare}
              variant="outline"
              className="w-full justify-start h-12 sm:h-9 mt-3 sm:mt-2 text-sm sm:text-sm"
            >
              <Share2 className="h-5 w-5 sm:h-4 sm:w-4 mr-3 sm:mr-2" />
              Plus d'options
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};