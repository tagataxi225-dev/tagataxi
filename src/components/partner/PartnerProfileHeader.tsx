import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, MapPin, Shield, Calendar, Edit2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PartnerProfileEditForm } from './PartnerProfileEditForm';
import { PartnerImageUpload } from './PartnerImageUpload';

export const PartnerProfileHeader: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: partner, isLoading } = useQuery({
    queryKey: ['partner-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partenaires')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleImageUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['partner-profile'] });
  };

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-xl">
        <div className="h-32 md:h-48 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 animate-pulse" />
        <div className="relative px-6 pb-6">
          <div className="flex gap-6 -mt-14">
            <div className="h-28 w-28 rounded-full bg-muted ring-4 ring-background" />
            <div className="flex-1 space-y-3 pt-16">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getVerificationBadge = () => {
    const config = {
      verified: {
        icon: CheckCircle,
        label: 'Vérifié',
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      },
      pending: {
        icon: Clock,
        label: 'En attente',
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      },
      rejected: {
        icon: XCircle,
        label: 'Rejeté',
        className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      }
    };

    const status = partner?.verification_status as keyof typeof config || 'pending';
    const { icon: Icon, label, className } = config[status] || config.pending;

    return (
      <Badge variant="outline" className={cn('gap-1.5 font-medium', className)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-0 shadow-xl">
        {/* Photo de couverture (Banner) */}
        {user?.id && (
          <PartnerImageUpload
            type="banner"
            currentUrl={partner?.banner_image}
            userId={user.id}
            onUploadComplete={handleImageUpdate}
          />
        )}

        {/* Contenu principal */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 -mt-10">
            {/* Logo avec upload */}
            <div className="flex flex-col items-center md:items-start">
              {user?.id ? (
                <PartnerImageUpload
                  type="logo"
                  currentUrl={partner?.logo_url}
                  userId={user.id}
                  onUploadComplete={handleImageUpdate}
                />
              ) : (
                <Avatar className="h-20 w-20 ring-4 ring-background shadow-2xl">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl font-bold">
                    {partner?.company_name ? getInitials(partner.company_name) : 'P'}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Informations principales */}
            <div className="flex-1 space-y-4 pt-4 md:pt-16">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <motion.h2 
                    className="text-2xl md:text-3xl font-bold text-foreground"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {partner?.company_name || 'Entreprise'}
                  </motion.h2>
                  
                  <motion.div 
                    className="flex flex-wrap items-center gap-2 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {getVerificationBadge()}
                    {partner?.is_active ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                        Inactif
                      </Badge>
                    )}
                  </motion.div>
                </div>

                <Button 
                  variant="default" 
                  size="sm" 
                  className="gap-2 self-start shadow-md"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Edit2 className="h-4 w-4" />
                  Modifier le profil
                </Button>
              </div>

            </div>
          </div>
        </div>
      </Card>

      {/* Dialog d'édition du profil */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md bg-background z-[100]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-emerald-600" />
              Modifier le profil
            </DialogTitle>
          </DialogHeader>
          <PartnerProfileEditForm
            partner={partner}
            onSuccess={() => {
              setShowEditDialog(false);
              queryClient.invalidateQueries({ queryKey: ['partner-profile'] });
            }}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
