import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, MessageCircle, X, User, Truck, Car, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

interface CallConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  partnerPhone: string;
  partnerAvatar?: string;
  partnerType?: 'chauffeur' | 'livreur' | 'client' | 'vendeur';
}

const partnerTypeConfig = {
  chauffeur: {
    icon: Car,
    label: 'Chauffeur',
    gradient: 'from-blue-500 to-blue-600',
  },
  livreur: {
    icon: Truck,
    label: 'Livreur',
    gradient: 'from-orange-500 to-orange-600',
  },
  client: {
    icon: User,
    label: 'Client',
    gradient: 'from-green-500 to-green-600',
  },
  vendeur: {
    icon: ShoppingBag,
    label: 'Vendeur',
    gradient: 'from-purple-500 to-purple-600',
  },
};

export const CallConfirmationModal: React.FC<CallConfirmationModalProps> = ({
  isOpen,
  onClose,
  partnerName,
  partnerPhone,
  partnerAvatar,
  partnerType = 'client',
}) => {
  const config = partnerTypeConfig[partnerType];
  const PartnerIcon = config.icon;

  const formatPhoneNumber = (phone: string) => {
    // Format pour affichage (ex: +243 999 123 456)
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 12) {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
    return phone;
  };

  const handleDirectCall = () => {
    if (!partnerPhone) {
      toast.error('Numéro de téléphone non disponible');
      return;
    }
    window.location.href = `tel:${partnerPhone}`;
    onClose();
  };

  const handleWhatsApp = () => {
    if (!partnerPhone) {
      toast.error('Numéro de téléphone non disponible');
      return;
    }
    const formattedPhone = partnerPhone.replace(/\s/g, '').replace('+', '');
    const message = encodeURIComponent(`Bonjour ${partnerName}, je vous contacte via Tembea.`);
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[340px] p-0 gap-0 overflow-hidden rounded-2xl border-border/50">
        {/* Header avec gradient */}
        <div className={`bg-gradient-to-br ${config.gradient} p-6 text-white relative overflow-hidden`}>
          {/* Pattern décoratif */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/30" />
            <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/20" />
          </div>
          
          <DialogHeader className="relative z-10">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="relative mb-4"
              >
                <Avatar className="h-20 w-20 ring-4 ring-white/30 shadow-xl">
                  <AvatarImage src={partnerAvatar} />
                  <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                    {partnerName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white shadow-lg">
                  <PartnerIcon className="h-4 w-4 text-gray-700" />
                </div>
              </motion.div>
              
              <DialogTitle className="text-xl font-bold text-white text-center">
                {partnerName}
              </DialogTitle>
              <p className="text-white/80 text-sm mt-1">{config.label}</p>
            </div>
          </DialogHeader>
        </div>

        {/* Corps du modal */}
        <div className="p-5 space-y-4 bg-background">
          {/* Numéro de téléphone */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-1">Numéro de téléphone</p>
            <p className="text-xl font-semibold text-foreground tracking-wide">
              {formatPhoneNumber(partnerPhone)}
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3">
            {/* Appel direct */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleDirectCall}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25"
              >
                <Phone className="h-5 w-5 mr-2" />
                Appel direct
              </Button>
            </motion.div>

            {/* WhatsApp */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleWhatsApp}
                variant="outline"
                className="w-full h-12 border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 font-semibold rounded-xl"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                WhatsApp
              </Button>
            </motion.div>

            {/* Annuler */}
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full h-10 text-muted-foreground hover:text-foreground"
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallConfirmationModal;
