import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, Mail, Copy, Check, Facebook } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { getRentalPartnerUrl } from '@/config/appUrl';

interface PartnerRentalShareButtonsProps {
  partnerId: string;
  partnerName: string;
  totalVehicles: number;
  rating?: number;
  slogan?: string;
}

export const PartnerRentalShareButtons: React.FC<PartnerRentalShareButtonsProps> = ({
  partnerId,
  partnerName,
  totalVehicles,
  rating,
  slogan
}) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const partnerUrl = getRentalPartnerUrl(partnerId);

  const shareMessage = `🚗 Découvrez ${partnerName} sur TAGA Location !

${slogan || 'Agence de location de véhicules'}
📊 ${totalVehicles} véhicule${totalVehicles > 1 ? 's' : ''} disponible${totalVehicles > 1 ? 's' : ''}
${rating ? `⭐ ${rating.toFixed(1)}/5` : ''}

👉 ${partnerUrl}`;

  // Charger le nombre de partages
  useEffect(() => {
    const fetchShareCount = async () => {
      const { count } = await supabase
        .from('rental_partner_share_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId);
      
      setShareCount(count || 0);
    };

    fetchShareCount();
  }, [partnerId]);

  // Track partage dans la DB
  const trackShare = async (shareType: string) => {
    try {
      await supabase
        .from('rental_partner_share_analytics')
        .insert({
          partner_id: partnerId,
          share_type: shareType,
          shared_by: user?.id || null
        });
      
      setShareCount(prev => prev + 1);
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
    trackShare('whatsapp');
    toast.success('Partage WhatsApp ouvert !');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(partnerUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    trackShare('facebook');
    toast.success('Partage Facebook ouvert !');
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(partnerUrl)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
    trackShare('telegram');
    toast.success('Partage Telegram ouvert !');
  };

  const handleEmailShare = () => {
    const subject = `🚗 Découvrez ${partnerName} sur TAGA`;
    const body = shareMessage;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    trackShare('email');
    toast.success('Email ouvert !');
  };

  const handleSMSShare = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(shareMessage)}`;
    window.location.href = smsUrl;
    trackShare('sms');
    toast.success('SMS ouvert !');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(partnerUrl);
      setCopied(true);
      trackShare('copy_link');
      toast.success('Lien copié dans le presse-papier !', {
        description: 'Vous pouvez maintenant le partager où vous voulez',
        duration: 3000
      });
      
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Erreur lors de la copie du lien');
    }
  };

  return (
    <div className="space-y-4">
      {/* URL Display */}
      <motion.div 
        className="p-4 rounded-lg bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 border border-border backdrop-blur-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs text-muted-foreground mb-2 font-medium">Lien de partage</p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-mono truncate flex-1 bg-background/50 px-3 py-2 rounded">
            {partnerUrl}
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyLink}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </motion.div>

      {/* Share Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={handleWhatsAppShare}
            className="w-full flex-col h-auto py-4 gap-2 hover:bg-green-500/10 hover:border-green-600 transition-all"
          >
            <MessageCircle className="h-6 w-6 text-green-600" />
            <span className="text-xs font-medium">WhatsApp</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={handleFacebookShare}
            className="w-full flex-col h-auto py-4 gap-2 hover:bg-blue-500/10 hover:border-blue-600 transition-all"
          >
            <Facebook className="h-6 w-6 text-blue-600" />
            <span className="text-xs font-medium">Facebook</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={handleTelegramShare}
            className="w-full flex-col h-auto py-4 gap-2 hover:bg-sky-500/10 hover:border-sky-600 transition-all"
          >
            <Send className="h-6 w-6 text-sky-600" />
            <span className="text-xs font-medium">Telegram</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={handleEmailShare}
            className="w-full flex-col h-auto py-4 gap-2 hover:bg-orange-500/10 hover:border-orange-600 transition-all"
          >
            <Mail className="h-6 w-6 text-orange-600" />
            <span className="text-xs font-medium">Email</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={handleSMSShare}
            className="w-full flex-col h-auto py-4 gap-2 hover:bg-purple-500/10 hover:border-purple-600 transition-all"
          >
            <MessageCircle className="h-6 w-6 text-purple-600" />
            <span className="text-xs font-medium">SMS</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="w-full flex-col h-auto py-4 gap-2 hover:bg-primary/10 hover:border-primary transition-all"
          >
            {copied ? (
              <Check className="h-6 w-6 text-green-600" />
            ) : (
              <Copy className="h-6 w-6 text-primary" />
            )}
            <span className="text-xs font-medium">
              {copied ? 'Copié !' : 'Copier'}
            </span>
          </Button>
        </motion.div>
      </div>

      {/* Share Stats */}
      {shareCount > 0 && (
        <motion.p 
          className="text-xs text-center text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          🎉 Cette agence a été partagée <strong>{shareCount}</strong> fois
        </motion.p>
      )}
    </div>
  );
};
