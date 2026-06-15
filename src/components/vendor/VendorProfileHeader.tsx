import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Mail, Phone, MapPin, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const VendorProfileHeader = () => {
  const { user } = useAuth();

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </Card>
    );
  }

  const getInitials = (name?: string) => {
    if (!name) return 'V';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getVerificationBadge = () => {
    // vendor_profiles doesn't have verification_status, return generic badge
    return (
      <Badge variant="secondary">
        <CheckCircle className="h-3 w-3 mr-1" />
        Vendeur
      </Badge>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row items-start gap-6">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="bg-purple-100 text-purple-600 text-2xl">
            {getInitials(vendor?.shop_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{vendor?.shop_name || 'Ma Boutique'}</h1>
              <Badge variant="default" className="bg-green-500">Actif</Badge>
              {getVerificationBadge()}
            </div>
            {vendor?.shop_description && (
              <p className="text-muted-foreground mt-2">{vendor.shop_description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span>Boutique Marketplace</span>
            </div>
            {vendor?.created_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Membre depuis {format(new Date(vendor.created_at), 'MMMM yyyy', { locale: fr })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
