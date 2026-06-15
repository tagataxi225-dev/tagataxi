import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Lock, CheckCircle2, XCircle, Info, AlertCircle, Gift, Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePhoneValidation } from '@/hooks/usePhoneValidation';
import { supabase } from '@/integrations/supabase/client';

interface PersonalInfoStepProps {
  formData: {
    displayName: string;
    email: string;
    phoneNumber: string;
    password: string;
    referralCode?: string;
    profilePhotoUrl?: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  formData,
  onFieldChange
}) => {
  const { phoneValid, phoneError, validatePhoneNumber } = usePhoneValidation();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `drivers/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path);
      onFieldChange('profilePhotoUrl', publicUrl);
    } catch (err: any) {
      setUploadError('Erreur lors de l\'upload. Réessayez.');
      console.error('Photo upload error:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Photo de profil obligatoire */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingPhoto}
          className={cn(
            'w-24 h-24 rounded-full overflow-hidden relative flex items-center justify-center transition-all',
            'border-2 border-dashed',
            formData.profilePhotoUrl
              ? 'border-primary'
              : 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
          )}
        >
          {formData.profilePhotoUrl ? (
            <img src={formData.profilePhotoUrl} alt="Photo" className="w-full h-full object-cover" />
          ) : uploadingPhoto ? (
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Camera className="w-8 h-8 text-amber-500" />
              <span className="text-[10px] text-amber-600 font-medium">Photo *</span>
            </div>
          )}
          {/* Overlay caméra sur photo existante */}
          {formData.profilePhotoUrl && !uploadingPhoto && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}
        </button>
        {formData.profilePhotoUrl ? (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Photo ajoutée
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Photo de profil (recommandée)</p>
        )}
        {uploadError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {uploadError}
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Nom complet */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <User className="w-4 h-4" />
            Nom complet *
          </Label>
          <Input
            value={formData.displayName}
            onChange={(e) => onFieldChange('displayName', e.target.value)}
            placeholder="Kabena Mwamba"
            className="h-12 rounded-xl text-base transition-all duration-200"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <Mail className="w-4 h-4" />
            Email *
          </Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => onFieldChange('email', e.target.value)}
            placeholder="kabena@example.com"
            className="h-12 rounded-xl text-base transition-all duration-200"
          />
        </div>

        {/* Téléphone avec validation */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <Phone className="w-4 h-4" />
            Numéro de téléphone *
          </Label>
          
          <div className="relative">
            <Input
              type="tel"
              inputMode="tel"
              placeholder="0991234567 ou +225..."
              value={formData.phoneNumber}
              onChange={(e) => {
                const value = e.target.value;
                onFieldChange('phoneNumber', value);
                validatePhoneNumber(value);
              }}
              className={cn(
                "h-12 pl-4 pr-10 rounded-xl text-base",
                "transition-all duration-200",
                phoneValid && "border-green-500 bg-green-50/50 dark:bg-green-950/20",
                phoneError && "border-red-500 bg-red-50/50 dark:bg-red-950/20"
              )}
            />
            
            {/* Indicateur visuel */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AnimatePresence mode="wait">
                {phoneValid && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </motion.div>
                )}
                {phoneError && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <XCircle className="w-5 h-5 text-red-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Message helper/erreur */}
          <AnimatePresence>
            {phoneError ? (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                {phoneError}
              </motion.p>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1"
              >
                <Info className="w-3 h-3" />
                Min 8 chiffres. Tous formats acceptés.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Mot de passe */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <Lock className="w-4 h-4" />
            Mot de passe *
          </Label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => onFieldChange('password', e.target.value)}
            placeholder="••••••••"
            className="h-12 rounded-xl text-base transition-all duration-200"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Minimum 8 caractères
          </p>
        </div>
      </div>

      {/* Code de parrainage optionnel */}
      <div className="space-y-2">
        <Label htmlFor="referralCode" className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <Gift className="w-4 h-4" />
          Code de parrainage (optionnel)
        </Label>
        <Input
          id="referralCode"
          type="text"
          placeholder="Ex: KWENDA2024"
          value={formData.referralCode || ''}
          onChange={(e) => onFieldChange('referralCode', e.target.value.toUpperCase())}
          className="h-12 rounded-xl text-base uppercase transition-all duration-200"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Entrez le code d'un ami pour recevoir 500 CDF de bonus !
        </p>
      </div>
    </motion.div>
  );
};
