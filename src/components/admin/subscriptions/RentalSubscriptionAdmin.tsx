import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUnifiedSubscriptions } from "@/hooks/useUnifiedSubscriptions";
import { SubscriptionActionModal } from "./SubscriptionActionModal";
import { 
  Search, 
  Filter, 
  Calendar, 
  Car, 
  MoreHorizontal,
  Building,
  TrendingUp,
  Clock,
  RefreshCw,
  Ban
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";

export const RentalSubscriptionAdmin = () => {
  const { 
    rentalSubscriptions, 
    loading,
    extendSubscription,
    cancelSubscriptionAdmin,
    renewSubscription
  } = useUnifiedSubscriptions();
  
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    subscription: any;
    action: string;
  }>({ isOpen: false, subscription: null, action: "" });

  // Filter subscriptions - Robuste avec valeurs par défaut
  const filteredSubscriptions = rentalSubscriptions.filter(sub => {
    const companyName = sub.partenaires?.company_name || '';
    const partnerEmail = sub.partenaires?.email || '';
    const vehicleName = sub.rental_vehicles?.name || '';
    const planName = sub.rental_subscription_plans?.name || '';
    
    // Si recherche vide, tout correspond
    const matchesSearch = 
      searchTerm === '' ||
      companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partnerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      planName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const activeCount = rentalSubscriptions.filter(sub => sub.status === 'active').length;
  const totalRevenue = rentalSubscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + (sub.rental_subscription_plans?.monthly_price || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Actif</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expiré</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleAction = (subscription: any, action: string) => {
    setActionModal({
      isOpen: true,
      subscription,
      action
    });
  };

  const handleActionConfirm = async (data?: any) => {
    if (!actionModal.subscription?.id) return;
    
    const id = actionModal.subscription.id;
    let result;
    
    if (actionModal.action === 'extend' && data?.days) {
      result = await extendSubscription(id, 'rental', data.days);
    } else if (actionModal.action === 'cancel') {
      result = await cancelSubscriptionAdmin(id, 'rental');
    } else if (actionModal.action === 'renew') {
      result = await renewSubscription(id, 'rental');
    }
    
    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['admin-unified-subscriptions'] });
    }
    
    setActionModal({ isOpen: false, subscription: null, action: "" });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              sur {rentalSubscriptions.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Mensuels</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue.toLocaleString()} CDF
            </div>
            <p className="text-xs text-muted-foreground">
              Revenus des abonnements location
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirant bientôt</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rentalSubscriptions.filter(sub => {
                const days = getDaysUntilExpiry(sub.end_date);
                return sub.status === 'active' && days <= 7 && days > 0;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Dans les 7 prochains jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Abonnements Location</CardTitle>
          <CardDescription>
            Gestion des abonnements de location de véhicules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par partenaire, véhicule ou plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
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
                  <TableHead>Date de fin</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Auto-renew</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => {
                  const daysUntilExpiry = getDaysUntilExpiry(subscription.end_date);
                  const isExpiringSoon = subscription.status === 'active' && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
                  
                  return (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            {subscription.partenaires?.company_name || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {subscription.partenaires?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            {subscription.rental_vehicles?.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {subscription.rental_vehicles?.brand} {subscription.rental_vehicles?.model}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {subscription.rental_subscription_plans?.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Depuis le {formatDate(subscription.start_date)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(subscription.status)}
                      </TableCell>
                      <TableCell>
                        <div className={isExpiringSoon ? "text-orange-600 font-medium" : ""}>
                          {formatDate(subscription.end_date)}
                          {isExpiringSoon && (
                            <div className="text-xs text-orange-500">
                              Expire dans {daysUntilExpiry} jours
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {subscription.rental_subscription_plans?.monthly_price?.toLocaleString()} CDF
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Mensuel
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={subscription.auto_renew ? "default" : "secondary"}>
                          {subscription.auto_renew ? "Oui" : "Non"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Ouvrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAction(subscription, 'extend')}>
                              <Clock className="mr-2 h-4 w-4" />
                              Prolonger
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(subscription, 'renew')}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Renouveler
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleAction(subscription, 'cancel')}
                              className="text-destructive"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Annuler
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(subscription, 'details')}>
                              Voir détails
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <p className="text-muted-foreground">
                {rentalSubscriptions.length > 0 
                  ? `${rentalSubscriptions.length} abonnement(s) chargé(s) mais masqué(s) par les filtres actuels`
                  : 'Aucun abonnement trouvé'
                }
              </p>
              {rentalSubscriptions.length > 0 && (
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Modal */}
      <SubscriptionActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, subscription: null, action: "" })}
        subscription={actionModal.subscription}
        action={actionModal.action}
        onConfirm={handleActionConfirm}
        type="rental"
      />
    </div>
  );
};