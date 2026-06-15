import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Mail, 
  MessageSquare, 
  Copy, 
  Send, 
  Twitter 
} from 'lucide-react';
import { toast } from 'sonner';

interface ShareCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
}

export const ShareCodeModal = ({ open, onOpenChange, code }: ShareCodeModalProps) => {
  const shareText = `🚗 Rejoignez Tembea!\n\nMon Code Driver: ${code}\n\nUtilisez ce code pour m'ajouter à votre flotte ou inscrivez-vous avec ce code pour bénéficier de bonus.\n\n📱 Téléchargez Tembea`;
  const shortText = `Mon Code Driver Tembea: ${code}`;

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    onOpenChange(false);
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    onOpenChange(false);
  };

  const handleSMS = () => {
    const url = `sms:?body=${encodeURIComponent(shortText)}`;
    window.open(url, '_self');
    onOpenChange(false);
  };

  const handleEmail = () => {
    const subject = 'Code Driver Tembea';
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`;
    window.open(url, '_self');
    onOpenChange(false);
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortText)}`;
    window.open(url, '_blank');
    onOpenChange(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Texte complet copié!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share && window.isSecureContext) {
        await navigator.share({
          title: 'Code Driver Tembea',
          text: shareText
        });
        onOpenChange(false);
      } else {
        await handleCopy();
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        await handleCopy();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Partager votre Code Driver</DialogTitle>
          <DialogDescription className="text-center">
            Partagez pour rejoindre une flotte ou parrainer des chauffeurs
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Code display */}
          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Votre code</p>
            <p className="text-lg font-mono font-bold text-primary tracking-wider">
              {code}
            </p>
          </div>

          {/* Primary platforms */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 flex-col gap-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-12 flex-col gap-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
              onClick={handleTelegram}
            >
              <Send className="h-4 w-4" />
              <span className="text-xs">Telegram</span>
            </Button>
          </div>

          {/* Secondary platforms */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10 flex-col gap-1"
              onClick={handleSMS}
            >
              <MessageSquare className="h-3 w-3" />
              <span className="text-xs">SMS</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-10 flex-col gap-1"
              onClick={handleEmail}
            >
              <Mail className="h-3 w-3" />
              <span className="text-xs">Email</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-10 flex-col gap-1"
              onClick={handleTwitter}
            >
              <Twitter className="h-3 w-3" />
              <span className="text-xs">Twitter</span>
            </Button>
          </div>

          {/* Alternative options */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copier le message complet
            </Button>
            
            {navigator.share && window.isSecureContext && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleNativeShare}
              >
                <Send className="h-4 w-4 mr-2" />
                Plus d'options de partage
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};