import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Phone, Check, X, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ContactsStepProps {
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  onSenderNameChange: (value: string) => void;
  onSenderPhoneChange: (value: string) => void;
  onRecipientNameChange: (value: string) => void;
  onRecipientPhoneChange: (value: string) => void;
  userProfile?: {
    display_name?: string;
    phone_number?: string;
    full_name?: string;
    email?: string;
    phone?: string;
  } | null;
}

interface SavedContact {
  name: string;
  phone: string;
}

const ContactsStep: React.FC<ContactsStepProps> = ({
  senderName,
  senderPhone,
  recipientName,
  recipientPhone,
  onSenderNameChange,
  onSenderPhoneChange,
  onRecipientNameChange,
  onRecipientPhoneChange,
  userProfile
}) => {
  const [recentSenders, setRecentSenders] = useState<SavedContact[]>([]);
  const [recentRecipients, setRecentRecipients] = useState<SavedContact[]>([]);

  useEffect(() => {
    try {
      const senders = JSON.parse(localStorage.getItem('kwenda-recent-senders') || '[]');
      const recipients = JSON.parse(localStorage.getItem('kwenda-recent-recipients') || '[]');
      setRecentSenders(senders.slice(0, 3));
      setRecentRecipients(recipients.slice(0, 3));
    } catch (error) {
      console.error('Erreur chargement contacts récents:', error);
    }
  }, []);

  useEffect(() => {
    if (userProfile && !senderName && !senderPhone) {
      if (userProfile.display_name) {
        onSenderNameChange(userProfile.display_name);
      }
      if (userProfile.phone_number) {
        onSenderPhoneChange(formatPhoneNumber(userProfile.phone_number));
      }
    }
  }, [userProfile, senderName, senderPhone]);

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 9 && cleaned.length <= 13;
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const useMyProfile = () => {
    if (userProfile) {
      onSenderNameChange(userProfile.full_name || userProfile.display_name || userProfile.email || '');
      if (userProfile.phone || userProfile.phone_number) {
        onSenderPhoneChange(formatPhoneNumber(userProfile.phone || userProfile.phone_number || ''));
      }
    }
  };

  const selectRecentContact = (contact: SavedContact, type: 'sender' | 'recipient') => {
    if (type === 'sender') {
      onSenderNameChange(contact.name);
      onSenderPhoneChange(contact.phone);
    } else {
      onRecipientNameChange(contact.name);
      onRecipientPhoneChange(contact.phone);
    }
  };

  const formatPhoneNumber = (value: string): string => {
    let cleaned = value.replace(/[^\d+]/g, '');
    const plusCount = (cleaned.match(/\+/g) || []).length;
    if (plusCount > 1) {
      cleaned = '+' + cleaned.replace(/\+/g, '');
    }
    if (cleaned.startsWith('0')) {
      cleaned = '+243' + cleaned.substring(1);
    }
    if (cleaned && !cleaned.startsWith('+')) {
      cleaned = '+243' + cleaned;
    }
    if (cleaned.startsWith('+')) {
      const digits = cleaned.substring(1);
      if (digits.length > 15) {
        cleaned = '+' + digits.substring(0, 15);
      }
    }
    return cleaned;
  };

  const handlePhoneChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setter(formatted);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-5"
    >
      {/* Header soft */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <User className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Contacts</h2>
          <p className="text-sm text-muted-foreground mt-1">Qui envoie et reçoit ce colis ?</p>
        </div>
      </div>

      {/* Expéditeur - Card soft */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="bg-muted/20 border border-border/40 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <UserCircle className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-foreground">Expéditeur</span>
            </div>
            {userProfile && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={useMyProfile}
                className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                Mon profil
              </Button>
            )}
          </div>

          {/* Contacts récents */}
          {recentSenders.length > 0 && !senderPhone && (
            <div className="flex flex-wrap gap-2">
              {recentSenders.map((contact, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectRecentContact(contact, 'sender')}
                  className="text-xs h-7 rounded-full bg-background border-border/50"
                >
                  {contact.name}
                </Button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="senderName" className="text-xs text-muted-foreground flex items-center gap-2">
                Nom complet
                {validateName(senderName) && <Check className="h-3 w-3 text-primary" />}
              </Label>
              <Input
                id="senderName"
                type="text"
                placeholder="Nom de l'expéditeur"
                value={senderName}
                onChange={(e) => onSenderNameChange(e.target.value)}
                className={cn(
                  "h-11 bg-background border-border/40 rounded-xl transition-all",
                  senderName && !validateName(senderName) && "border-destructive"
                )}
              />
              {senderName && !validateName(senderName) && (
                <p className="text-[10px] text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  Minimum 2 caractères
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senderPhone" className="text-xs text-muted-foreground flex items-center gap-2">
                Téléphone
                {validatePhone(senderPhone) && <Check className="h-3 w-3 text-primary" />}
              </Label>
              <Input
                id="senderPhone"
                type="tel"
                placeholder="+243 XX XXX XXXX"
                value={senderPhone}
                onChange={handlePhoneChange(onSenderPhoneChange)}
                className={cn(
                  "h-11 bg-background border-border/40 rounded-xl transition-all",
                  senderPhone && !validatePhone(senderPhone) && "border-destructive"
                )}
              />
              {senderPhone && !validatePhone(senderPhone) && (
                <p className="text-[10px] text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  Format invalide
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Destinataire - Card soft */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="bg-muted/20 border border-border/40 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="font-medium text-foreground">Destinataire</span>
          </div>

          {/* Contacts récents */}
          {recentRecipients.length > 0 && !recipientPhone && (
            <div className="flex flex-wrap gap-2">
              {recentRecipients.map((contact, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectRecentContact(contact, 'recipient')}
                  className="text-xs h-7 rounded-full bg-background border-border/50"
                >
                  {contact.name}
                </Button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="recipientName" className="text-xs text-muted-foreground flex items-center gap-2">
                Nom complet
                {validateName(recipientName) && <Check className="h-3 w-3 text-primary" />}
              </Label>
              <Input
                id="recipientName"
                type="text"
                placeholder="Nom du destinataire"
                value={recipientName}
                onChange={(e) => onRecipientNameChange(e.target.value)}
                className={cn(
                  "h-11 bg-background border-border/40 rounded-xl transition-all",
                  recipientName && !validateName(recipientName) && "border-destructive"
                )}
              />
              {recipientName && !validateName(recipientName) && (
                <p className="text-[10px] text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  Minimum 2 caractères
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recipientPhone" className="text-xs text-muted-foreground flex items-center gap-2">
                Téléphone
                {validatePhone(recipientPhone) && <Check className="h-3 w-3 text-primary" />}
              </Label>
              <Input
                id="recipientPhone"
                type="tel"
                placeholder="+243 XX XXX XXXX"
                value={recipientPhone}
                onChange={handlePhoneChange(onRecipientPhoneChange)}
                className={cn(
                  "h-11 bg-background border-border/40 rounded-xl transition-all",
                  recipientPhone && !validatePhone(recipientPhone) && "border-destructive"
                )}
              />
              {recipientPhone && !validatePhone(recipientPhone) && (
                <p className="text-[10px] text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  Format invalide
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info tip soft */}
      <motion.div
        className="text-center text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        💡 Le livreur utilisera ces numéros pour coordonner la collecte et livraison
      </motion.div>
    </motion.div>
  );
};

export default ContactsStep;
