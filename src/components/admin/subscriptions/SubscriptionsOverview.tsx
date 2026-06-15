import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUnifiedSubscriptions } from "@/hooks/useUnifiedSubscriptions";
import { SubscriptionActionModal } from "./SubscriptionActionModal";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Car, 
  TrendingUp, 
  AlertTriangle, 
  Search, 
  MoreHorizontal,
  Calendar,
  DollarSign,
  RefreshCw,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const SubscriptionsOverview = () => {
  const { 
    driverSubscriptions, 
    rentalSubscriptions, 
    stats, 
    loading,
    extendSubscription,
    cancelSubscriptionAdmin,
    renewSubscription
  } = useUnifiedSubscriptions();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("drivers");
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    subscription: any;
    action: string;
    type: 'driver' | 'rental';
  }>({ isOpen: false, subscription: null, action: '', type: 'driver' });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  };

  const getDaysUntilExpiry = (endDate: string) => {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      active: 'default',
      expired: 'destructive',
      cancelled: 'secondary',
      pending: 'outline'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const filteredDriverSubs = driverSubscriptions.filter(sub => 
    sub.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRentalSubs = rentalSubscriptions.filter(sub =>
    sub.partner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.vehicle_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleActionConfirm = async (id: string, data?: any) => {
    try {
      const { action, type } = actionModal;
      
      if (action === 'extend') {
        await extendSubscription(id, type, data.days);
      } else if (action === 'cancel') {
        await cancelSubscriptionAdmin(id, type);
      } else if (action === 'renew') {
        await renewSubscription(id, type);
      }
      
      setActionModal({ isOpen: false, subscription: null, action: '', type: 'driver' });
    } catch (error) {
      console.error('Action error:', error);
    }
  };

  // Loading state avec skeleton
  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus mensuels</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.monthlyRevenue?.toLocaleString() || 0} {stats?.currency || 'CDF'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total des abonnements actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements actifs</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalActiveSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.driverSubscriptions || 0} chauffeurs + {stats?.rentalSubscriptions || 0} locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expire bientôt</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.expiringInWeek || 0}</div>
            <p className="text-xs text-muted-foreground">
              Dans les 7 prochains jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements échoués</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failedPayments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Nécessite une action
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs avec données */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Abonnements actifs</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-[250px]"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.location.reload()}
                title="Rafraîchir"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="drivers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Chauffeurs ({filteredDriverSubs.length})
              </TabsTrigger>
              <TabsTrigger value="rentals" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Location ({filteredRentalSubs.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab Chauffeurs */}
            <TabsContent value="drivers" className="space-y-4">
              {filteredDriverSubs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun abonnement chauffeur trouvé
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chauffeur</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date fin</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Auto-renew</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDriverSubs.map((sub) => {
                        const daysLeft = getDaysUntilExpiry(sub.end_date);
                        return (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">{sub.driver_name}</TableCell>
                            <TableCell>{sub.plan_name}</TableCell>
                            <TableCell>{getStatusBadge(sub.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{formatDate(sub.end_date)}</span>
                                {daysLeft !== null && daysLeft < 7 && daysLeft > 0 && (
                                  <span className="text-xs text-orange-500">
                                    {daysLeft} jour(s) restant(s)
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {sub.monthly_fee?.toLocaleString()} {sub.currency}
                            </TableCell>
                            <TableCell>
                              {sub.auto_renew ? (
                                <Badge variant="default">Oui</Badge>
                              ) : (
                                <Badge variant="secondary">Non</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => setActionModal({
                                      isOpen: true,
                                      subscription: sub,
                                      action: 'extend',
                                      type: 'driver'
                                    })}
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Prolonger
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setActionModal({
                                      isOpen: true,
                                      subscription: sub,
                                      action: 'cancel',
                                      type: 'driver'
                                    })}
                                    className="text-red-600"
                                  >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Annuler
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
              )}
            </TabsContent>

            {/* Tab Location */}
            <TabsContent value="rentals" className="space-y-4">
              {filteredRentalSubs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun abonnement location trouvé
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partenaire</TableHead>
                        <TableHead>Véhicule</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date fin</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRentalSubs.map((sub) => {
                        const daysLeft = getDaysUntilExpiry(sub.end_date);
                        return (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">{sub.partner_name}</TableCell>
                            <TableCell>{sub.vehicle_name}</TableCell>
                            <TableCell>{sub.plan_name}</TableCell>
                            <TableCell>{getStatusBadge(sub.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{formatDate(sub.end_date)}</span>
                                {daysLeft !== null && daysLeft < 7 && daysLeft > 0 && (
                                  <span className="text-xs text-orange-500">
                                    {daysLeft} jour(s) restant(s)
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {sub.monthly_fee?.toLocaleString()} {sub.currency}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => setActionModal({
                                      isOpen: true,
                                      subscription: sub,
                                      action: 'extend',
                                      type: 'rental'
                                    })}
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Prolonger
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setActionModal({
                                      isOpen: true,
                                      subscription: sub,
                                      action: 'cancel',
                                      type: 'rental'
                                    })}
                                    className="text-red-600"
                                  >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Annuler
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
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal d'actions */}
      <SubscriptionActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, subscription: null, action: '', type: 'driver' })}
        subscription={actionModal.subscription}
        action={actionModal.action}
        type={actionModal.type}
        onConfirm={handleActionConfirm}
      />
    </div>
  );
};
