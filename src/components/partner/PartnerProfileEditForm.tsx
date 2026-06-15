import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, MapPin, Briefcase, Loader2, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const partnerProfileSchema = z.object({
  company_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone_number: z.string().min(9, 'Numéro de téléphone invalide'),
  business_type: z.string().optional(),
  service_areas: z.array(z.string()).optional(),
});

type PartnerProfileFormData = z.infer<typeof partnerProfileSchema>;

interface PartnerProfileEditFormProps {
  partner: {
    id: string;
    company_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    business_type?: string | null;
    service_areas?: string[] | null;
  } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AVAILABLE_ZONES = [
  { id: 'kinshasa', label: 'Kinshasa' },
  { id: 'lubumbashi', label: 'Lubumbashi' },
  { id: 'kolwezi', label: 'Kolwezi' },
];

const BUSINESS_TYPES = [
  { value: 'transport', label: 'Transport' },
  { value: 'logistics', label: 'Logistique' },
  { value: 'fleet', label: 'Flotte de véhicules' },
  { value: 'rental', label: 'Location de véhicules' },
  { value: 'delivery', label: 'Livraison' },
  { value: 'other', label: 'Autre' },
];

export const PartnerProfileEditForm: React.FC<PartnerProfileEditFormProps> = ({
  partner,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedZones, setSelectedZones] = useState<string[]>(partner?.service_areas || []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PartnerProfileFormData>({
    resolver: zodResolver(partnerProfileSchema),
    defaultValues: {
      company_name: partner?.company_name || '',
      email: partner?.email || '',
      phone_number: partner?.phone_number || '',
      business_type: partner?.business_type || '',
      service_areas: partner?.service_areas || [],
    },
  });

  const businessType = watch('business_type');

  const toggleZone = (zoneId: string) => {
    const newZones = selectedZones.includes(zoneId)
      ? selectedZones.filter(z => z !== zoneId)
      : [...selectedZones, zoneId];
    setSelectedZones(newZones);
    setValue('service_areas', newZones);
  };

  const onSubmit = async (data: PartnerProfileFormData) => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('partenaires')
        .update({
          company_name: data.company_name,
          email: data.email,
          phone_number: data.phone_number,
          business_type: data.business_type || null,
          service_areas: selectedZones.length > 0 ? selectedZones : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profil mis à jour avec succès');
      onSuccess?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Nom de l'entreprise */}
      <div className="space-y-2">
        <Label htmlFor="company_name" className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="h-4 w-4 text-emerald-600" />
          Nom de l'entreprise
        </Label>
        <Input
          id="company_name"
          {...register('company_name')}
          placeholder="Nom de votre entreprise"
          className={cn(
            "transition-all",
            errors.company_name && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {errors.company_name && (
          <p className="text-xs text-destructive">{errors.company_name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4 text-emerald-600" />
          Email
        </Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="email@entreprise.com"
          className={cn(
            "transition-all",
            errors.email && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Téléphone */}
      <div className="space-y-2">
        <Label htmlFor="phone_number" className="flex items-center gap-2 text-sm font-medium">
          <Phone className="h-4 w-4 text-emerald-600" />
          Téléphone
        </Label>
        <Input
          id="phone_number"
          {...register('phone_number')}
          placeholder="+243 XXX XXX XXX"
          className={cn(
            "transition-all",
            errors.phone_number && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {errors.phone_number && (
          <p className="text-xs text-destructive">{errors.phone_number.message}</p>
        )}
      </div>

      {/* Type d'activité */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Briefcase className="h-4 w-4 text-emerald-600" />
          Type d'activité
        </Label>
        <Select
          value={businessType}
          onValueChange={(value) => setValue('business_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un type" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-[110]">
            {BUSINESS_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Zones desservies */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-emerald-600" />
          Zones desservies
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {AVAILABLE_ZONES.map((zone) => (
            <motion.div
              key={zone.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                selectedZones.includes(zone.id)
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/50"
                  : "bg-background border-border hover:border-emerald-500/30"
              )}
              onClick={() => toggleZone(zone.id)}
              whileTap={{ scale: 0.98 }}
            >
              <Checkbox
                id={zone.id}
                checked={selectedZones.includes(zone.id)}
                onCheckedChange={() => toggleZone(zone.id)}
              />
              <label
                htmlFor={zone.id}
                className="text-sm font-medium cursor-pointer flex-1"
              >
                {zone.label}
              </label>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Annuler
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </motion.form>
  );
};
