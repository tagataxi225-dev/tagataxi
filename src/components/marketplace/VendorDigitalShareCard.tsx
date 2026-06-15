import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileCode, Copy, Check, MessageCircle, Facebook, Send, Eye, Share2, ShoppingCart, ExternalLink, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getProductUrl } from '@/config/appUrl';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface VendorDigitalShareCardProps {
  productId: string;
  productTitle: string;
  productPrice: number;
  vendorId: string;
  isDigital?: boolean;
}

export const VendorDigitalShareCard: React.FC<VendorDigitalShareCardProps> = ({
  productId,
  productTitle,
  productPrice,
  vendorId,
  isDigital = false
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ views: 0, shares: 0, sales: 0 });
  const [showQR, setShowQR] = useState(false);

  const productUrl = getProductUrl(productId);
  
  const shareMessage = isDigital
    ? `📥 Découvre ce produit digital sur Tembea Shop !\n\n${productTitle}\n💰 ${productPrice.toLocaleString()} CDF\n📲 Téléchargement instantané\n\n👉 ${productUrl}`
    : `🛍️ Découvre ce produit sur Tembea Shop !\n\n${productTitle}\n💰 ${productPrice.toLocaleString()} CDF\n\n👉 ${productUrl}`;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Récupérer les stats de partage
        const { data: shareData } = await supabase
          .from('marketplace_share_analytics')
          .select('id')
          .eq('product_id', productId);

        // Récupérer les vues du produit
        const { data: productData } = await supabase
          .from('marketplace_products')
          .select('view_count')
          .eq('id', productId)
          .single();

        // Récupérer les ventes via marketplace_orders
        const { count: salesCount } = await supabase
          .from('marketplace_orders')
          .select('*', { count: 'exact', head: true })
          .contains('items', [{ product_id: productId }]);

        setStats({
          views: productData?.view_count || 0,
          shares: shareData?.length || 0,
          sales: salesCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [productId]);

  const trackShare = async (shareType: string) => {
    try {
      await supabase.from('marketplace_share_analytics').insert({
        product_id: productId,
        vendor_id: vendorId,
        share_type: shareType
      });
      setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      trackShare('copy_link');
      setCopied(true);
      toast({
        title: 'Lien copié ! 📋',
        description: 'Partagez-le partout pour générer des ventes'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de copier le lien'
      });
    }
  };

  const handleWhatsAppShare = () => {
    trackShare('whatsapp');
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const handleFacebookShare = () => {
    trackShare('facebook');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(productTitle)}`, '_blank');
  };

  const handleTelegramShare = () => {
    trackShare('telegram');
    window.open(`https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(productTitle)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={`overflow-hidden ${
        isDigital 
          ? "bg-gradient-to-br from-purple-500 to-indigo-600" 
          : "bg-gradient-to-br from-primary to-primary/80"
      }`}>
        <CardContent className="p-6 text-white">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDigital ? "bg-white/20" : "bg-white/20"
            }`}>
              {isDigital ? (
                <FileCode className="h-6 w-6" />
              ) : (
                <Share2 className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {isDigital ? 'Partagez votre produit digital' : 'Partagez votre produit'}
              </h3>
              <p className="text-sm text-white/80">
                Générez des ventes avec un lien direct
              </p>
            </div>
          </div>

          {/* Nom du produit */}
          <div className="mb-4 p-3 bg-white/10 rounded-xl">
            <p className="text-sm text-white/70">Produit</p>
            <p className="font-semibold truncate">{productTitle}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-white/20 text-white border-0">
                {productPrice.toLocaleString()} CDF
              </Badge>
              {isDigital && (
                <Badge className="bg-purple-300/30 text-white border-0">
                  📥 Digital
                </Badge>
              )}
            </div>
          </div>

          {/* Lien copiable */}
          <div className="bg-white/10 rounded-xl p-3 flex items-center gap-2 mb-4">
            <Input 
              value={productUrl} 
              readOnly 
              className="bg-transparent border-0 text-white placeholder:text-white/50 focus-visible:ring-0 text-sm"
            />
            <Button 
              size="sm" 
              variant="secondary"
              className="shrink-0"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Boutons de partage */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <Button 
              variant="secondary" 
              className="flex-1 gap-2"
              onClick={handleWhatsAppShare}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 gap-2"
              onClick={handleFacebookShare}
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 gap-2"
              onClick={handleTelegramShare}
            >
              <Send className="h-4 w-4" />
              Telegram
            </Button>
          </div>

          {/* QR Code */}
          <Dialog open={showQR} onOpenChange={setShowQR}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full mb-4 bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
              >
                <QrCode className="h-4 w-4" />
                Afficher le QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">QR Code du produit</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeSVG 
                    value={productUrl} 
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scannez ce code pour accéder directement au produit
                </p>
                <Button onClick={handleCopyLink} variant="outline" className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copier le lien
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Eye className="h-4 w-4 text-white/70" />
              </div>
              <p className="text-2xl font-bold">{stats.views}</p>
              <p className="text-xs text-white/70">Vues</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Share2 className="h-4 w-4 text-white/70" />
              </div>
              <p className="text-2xl font-bold">{stats.shares}</p>
              <p className="text-xs text-white/70">Partages</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ShoppingCart className="h-4 w-4 text-white/70" />
              </div>
              <p className="text-2xl font-bold">{stats.sales}</p>
              <p className="text-xs text-white/70">Ventes</p>
            </div>
          </div>

          {/* Lien externe */}
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-white/80 hover:text-white hover:bg-white/10 gap-2"
            onClick={() => window.open(productUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Voir la page du produit
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
