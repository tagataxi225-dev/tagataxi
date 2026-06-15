import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, UserX, UserCheck, Eye, AlertCircle } from 'lucide-react';

export const SellerModerationPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendeurs via leurs produits
  const { data: sellers, isLoading } = useQuery({
    queryKey: ['marketplace-sellers', statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_products')
        .select(`
          seller_id,
          created_at,
          profiles:seller_id (
            id,
            display_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query as any;
      if (error) throw error;

      // Grouper par vendeur
      const sellersMap = new Map();
      data?.forEach((product: any) => {
        const sellerId = product.seller_id;
        if (!sellersMap.has(sellerId)) {
          sellersMap.set(sellerId, {
            id: sellerId,
            display_name: product.profiles?.display_name || 'Vendeur inconnu',
            email: product.profiles?.email || '',
            productCount: 0,
            firstProductDate: product.created_at,
            isActive: true
          });
        }
        sellersMap.get(sellerId).productCount++;
      });

      return Array.from(sellersMap.values());
    }
  });

  // Mutation pour suspendre/activer vendeur
  const toggleSellerStatus = useMutation({
    mutationFn: async ({ sellerId, isActive }: { sellerId: string; isActive: boolean }) => {
      // Suspendre/activer tous les produits du vendeur
      const { error } = await supabase
        .from('marketplace_products')
        .update({ status: isActive ? 'approved' : 'rejected' })
        .eq('seller_id', sellerId) as any;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-sellers'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceStats'] });
      toast({
        title: 'Succès',
        description: 'Statut du vendeur modifié',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la modification',
        variant: 'destructive',
      });
      console.error(error);
    }
  });

  const filteredSellers = sellers?.filter((seller: any) => {
    if (statusFilter !== 'all' && seller.isActive !== (statusFilter === 'active')) {
      return false;
    }
    if (searchTerm && !seller.display_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un vendeur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Statut vendeur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="suspended">Suspendus</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste vendeurs */}
      <Card>
        <CardHeader>
          <CardTitle>Vendeurs Marketplace</CardTitle>
          <CardDescription>
            {filteredSellers?.length || 0} vendeur(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredSellers && filteredSellers.length > 0 ? (
            <div className="space-y-4">
              {filteredSellers.map((seller: any) => (
                <div key={seller.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg">{seller.display_name}</h4>
                      <Badge variant={seller.isActive ? 'default' : 'destructive'}>
                        {seller.isActive ? '✅ Actif' : '❌ Suspendu'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Email:</span> {seller.email}
                      </div>
                      <div>
                        <span className="font-medium">Produits:</span> {seller.productCount}
                      </div>
                      <div>
                        <span className="font-medium">Inscrit:</span>{' '}
                        {new Date(seller.firstProductDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={seller.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                      onClick={() => toggleSellerStatus.mutate({ 
                        sellerId: seller.id, 
                        isActive: !seller.isActive 
                      })}
                      disabled={toggleSellerStatus.isPending}
                    >
                      {seller.isActive ? (
                        <>
                          <UserX className="h-4 w-4 mr-2" />
                          Suspendre
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Activer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun vendeur trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};