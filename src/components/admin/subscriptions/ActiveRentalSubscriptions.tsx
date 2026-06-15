import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePartnerRentalSubscriptions } from '@/hooks/usePartnerRentalSubscriptions';
import { SubscriptionActionModal } from './SubscriptionActionModal';
import { Search, MoreHorizontal, Calendar, Building, Car, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const ActiveRentalSubscriptions = () => {
  const { subscriptions, isLoading, extendSubscription, cancelSubscription } = usePartnerRentalSubscriptions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    subscription: any;
    action: string;
  }>({ isOpen: false, subscription: null, action: '' });

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.partner_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.vehicle_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      expired: 'destructive',
      cancelled: 'secondary',
      pending: 'outline'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Abonnements Partenaires Actifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par partenaire, véhicule, plaque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="expired">Expirés</SelectItem>
                <SelectItem value="cancelled">Annulés</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subscriptions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partenaire</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date Fin</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Auto-renouvellement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      Aucun abonnement trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => {
                    const daysUntilExpiry = getDaysUntilExpiry(subscription.end_date);
                    const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
                    
                    return (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">Partenaire #{subscription.partner_id.slice(0, 8)}</div>
                            <div className="text-sm text-muted-foreground">ID: {subscription.partner_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">Véhicule #{subscription.vehicle_id.slice(0, 8)}</div>
                            <div className="text-sm text-muted-foreground">ID: {subscription.vehicle_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">Plan #{subscription.plan_id.slice(0, 8)}</div>
                          <div className="text-sm text-muted-foreground">
                            Plan mensuel
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell>
                          <div className={isExpiringSoon ? 'text-orange-600 font-medium' : ''}>
                            {formatDate(subscription.end_date)}
                          </div>
                          {isExpiringSoon && (
                            <div className="text-xs text-orange-600">
                              Expire dans {daysUntilExpiry} jour{daysUntilExpiry !== 1 ? 's' : ''}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            30,000 CDF
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={subscription.auto_renew ? 'default' : 'outline'}>
                            {subscription.auto_renew ? 'Activé' : 'Désactivé'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setActionModal({
                                  isOpen: true,
                                  subscription,
                                  action: 'extend'
                                })}
                              >
                                Prolonger
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setActionModal({
                                  isOpen: true,
                                  subscription,
                                  action: 'cancel'
                                })}
                              >
                                Annuler
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setActionModal({
                                  isOpen: true,
                                  subscription,
                                  action: 'details'
                                })}
                              >
                                Voir détails
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SubscriptionActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, subscription: null, action: '' })}
        subscription={actionModal.subscription}
        action={actionModal.action}
        onConfirm={(id, data) => {
          if (actionModal.action === 'extend' && data?.days) {
            extendSubscription({ id, days: data.days });
          } else if (actionModal.action === 'cancel') {
            cancelSubscription(id);
          }
        }}
        type="rental"
      />
    </div>
  );
};