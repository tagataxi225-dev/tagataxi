import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Facebook, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getProductUrl } from '@/config/appUrl';

interface ProductShareButtonsProps {
  productId: string;
  productTitle: string;
  productPrice: number;
  productImage?: string;
  sellerName: string;
  vendorId: string;
  compact?: boolean;
}

export const ProductShareButtons: React.FC<ProductShareButtonsProps> = ({
  productId,
  productTitle,
  productPrice,
  productImage,
  sellerName,
  vendorId,
  compact = false
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const productUrl = getProductUrl(productId);
  
  const shareMessage = `🛍️ Découvre ce produit sur Tembea Shop !\n\n${productTitle}\n💰 ${productPrice.toLocaleString()} CDF\n📍 Vendeur: ${sellerName}\n\n👉 ${productUrl}`;

  const trackShare = async (shareType: string) => {
    try {
      await supabase.from('marketplace_share_analytics').insert({
        product_id: productId,
        vendor_id: vendorId,
        share_type: shareType
      });
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  const handleWhatsAppShare = () => {
    trackShare('whatsapp');
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleFacebookShare = () => {
    trackShare('facebook');
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(productTitle)}`;
    window.open(url, '_blank');
  };

  const handleTelegramShare = () => {
    trackShare('telegram');
    const url = `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(productTitle)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      trackShare('copy_link');
      setCopied(true);
      toast({
        title: 'Lien copié !',
        description: 'Le lien du produit a été copié dans le presse-papiers.'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de copier le lien.'
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        trackShare('native_share');
        await navigator.share({
          title: productTitle,
          text: shareMessage,
          url: productUrl
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  if (compact) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Partager
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleWhatsAppShare}
        className="gap-2 flex-1 sm:flex-none"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </Button>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleFacebookShare}
        className="gap-2 flex-1 sm:flex-none"
      >
        <Facebook className="h-4 w-4" />
        Facebook
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTelegramShare}
        className="gap-2 flex-1 sm:flex-none"
      >
        <Share2 className="h-4 w-4" />
        Telegram
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-2 flex-1 sm:flex-none"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copié !' : 'Copier lien'}
      </Button>
    </div>
  );
};
