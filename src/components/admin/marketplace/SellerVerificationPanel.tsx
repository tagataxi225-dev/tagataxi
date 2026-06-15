import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SellerBadge } from '@/components/marketplace/SellerBadge';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  ShoppingBag, 
  TrendingUp,
  User,
  Mail,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SellerProfile {
  id: string;
  user_id: string;
  display_name: string;
  seller_badge_level: 'bronze' | 'silver' | 'gold' | 'verified';
  total_sales: number;
  rating_average: number;
  rating_count: number;
  verified_seller: boolean;
  created_at: string;
  email?: string;
}

export const SellerVerificationPanel: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch sellers with their profiles
  const { data: sellers, isLoading } = useQuery({
    queryKey: ['seller-profiles', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('seller_profiles')
        .select('*')
        .order('total_sales', { ascending: false });

      if (searchTerm) {
        query = query.ilike('display_name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch email for each seller
      const sellersWithEmail = await Promise.all(
        (data || []).map(async (seller) => {
          const { data: clientData } = await supabase
            .from('clients')
            .select('email')
            .eq('user_id', seller.user_id)
            .maybeSingle();

          return {
            ...seller,
            email: clientData?.email || 'N/A'
          };
        })
      );

      return sellersWithEmail as SellerProfile[];
    }
  });

  // Verify/unverify seller mutation
  const verifySellerMutation = useMutation({
    mutationFn: async ({ userId, verified }: { userId: string; verified: boolean }) => {
      const { data, error } = await supabase.rpc('verify_seller', {
        p_user_id: userId,
        p_verified: verified
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller-profiles'] });
      toast({
        title: variables.verified ? 'Vendeur vérifié' : 'Vérification retirée',
        description: variables.verified 
          ? 'Le vendeur dispose maintenant du badge vérifié'
          : 'Le badge vérifié a été retiré',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier le statut de vérification',
        variant: 'destructive',
      });
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Chargement des vendeurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vérification des vendeurs</h2>
          <p className="text-muted-foreground">Gérer les badges et vérifications des vendeurs</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un vendeur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total vendeurs</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendeurs vérifiés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sellers?.filter(s => s.verified_seller).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Badge Or</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sellers?.filter(s => s.seller_badge_level === 'gold').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventes totales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sellers?.reduce((acc, s) => acc + s.total_sales, 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Les badges évoluent automatiquement : Bronze (0-49 ventes), Argent (50-99), Or (100+). 
          Le badge "Vérifié" est attribué manuellement par les admins.
        </AlertDescription>
      </Alert>

      {/* Sellers List */}
      {sellers && sellers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucun vendeur trouvé</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm ? 'Essayez une autre recherche' : 'Les vendeurs apparaîtront ici'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sellers?.map((seller) => (
            <Card key={seller.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{seller.display_name}</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {seller.email}
                    </div>
                  </div>
                  <SellerBadge 
                    level={seller.seller_badge_level}
                    verified={seller.verified_seller}
                    totalSales={seller.total_sales}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{seller.total_sales}</span>
                    <span className="text-muted-foreground">ventes</span>
                  </div>
                  {seller.rating_count > 0 && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{seller.rating_average.toFixed(1)}</span>
                      <span className="text-muted-foreground">({seller.rating_count})</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Inscrit le {formatDate(seller.created_at)}
                </div>

                <div className="pt-2 border-t">
                  {seller.verified_seller ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => verifySellerMutation.mutate({ 
                        userId: seller.user_id, 
                        verified: false 
                      })}
                      disabled={verifySellerMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Retirer la vérification
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => verifySellerMutation.mutate({ 
                        userId: seller.user_id, 
                        verified: true 
                      })}
                      disabled={verifySellerMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Vérifier ce vendeur
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
