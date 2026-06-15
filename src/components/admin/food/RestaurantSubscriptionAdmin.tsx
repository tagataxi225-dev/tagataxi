import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminRestaurantSubscriptions, SubscriptionPlan } from '@/hooks/admin/useAdminRestaurantSubscriptions';
import { Calendar, DollarSign, Clock, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const RestaurantSubscriptionAdmin = () => {
  const { subscriptions, plans, loading, extendSubscription, cancelSubscription, updatePlanPricing } = useAdminRestaurantSubscriptions();
  const [extendDialog, setExtendDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [editPlanDialog, setEditPlanDialog] = useState(false);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [extendDays, setExtendDays] = useState('30');
  const [cancelReason, setCancelReason] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      expired: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExtend = async () => {
    if (!selectedSub) return;
    const success = await extendSubscription(selectedSub, parseInt(extendDays));
    if (success) {
      setExtendDialog(false);
      setSelectedSub(null);
      setExtendDays('30');
    }
  };

  const handleCancel = async () => {
    if (!selectedSub || !cancelReason.trim()) {
      return;
    }
    const success = await cancelSubscription(selectedSub, cancelReason);
    if (success) {
      setCancelDialog(false);
      setSelectedSub(null);
      setCancelReason('');
    }
  };

  const handleUpdatePrice = async () => {
    if (!selectedPlan || !newPrice.trim()) return;
    const success = await updatePlanPricing(selectedPlan.id, parseInt(newPrice));
    if (success) {
      setEditPlanDialog(false);
      setSelectedPlan(null);
      setNewPrice('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Chargement des abonnements...</div>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const totalRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements actifs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              Sur {subscriptions.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu mensuel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} CDF</div>
            <p className="text-xs text-muted-foreground">
              Abonnements actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plans disponibles</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.filter(p => p.is_active).length}</div>
            <p className="text-xs text-muted-foreground">
              Plans actifs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Abonnements restaurants</CardTitle>
          <CardDescription>
            Gérez les abonnements actifs et leur statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucun abonnement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.restaurant_name || 'N/A'}</TableCell>
                    <TableCell>{sub.plan_name || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>{formatDate(sub.start_date)}</TableCell>
                    <TableCell>{formatDate(sub.end_date)}</TableCell>
                    <TableCell>{sub.amount.toLocaleString()} {sub.currency}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSub(sub.id);
                            setExtendDialog(true);
                          }}
                          disabled={sub.status !== 'active'}
                        >
                          Prolonger
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedSub(sub.id);
                            setCancelDialog(true);
                          }}
                          disabled={sub.status !== 'active'}
                        >
                          Annuler
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Plans d'abonnement</CardTitle>
          <CardDescription>
            Gérez les plans disponibles pour les restaurants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Durée (jours)</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{plan.description}</TableCell>
                  <TableCell>{plan.monthly_price.toLocaleString()} {plan.currency}</TableCell>
                  <TableCell>30 jours (mensuel)</TableCell>
                  <TableCell>
                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                      {plan.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setNewPrice(plan.monthly_price.toString());
                        setEditPlanDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier tarif
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Extend Dialog */}
      <Dialog open={extendDialog} onOpenChange={setExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prolonger l'abonnement</DialogTitle>
            <DialogDescription>
              Indiquez le nombre de jours à ajouter à l'abonnement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="days">Nombre de jours</Label>
              <Input
                id="days"
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                placeholder="30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleExtend}>
              Confirmer la prolongation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler l'abonnement</DialogTitle>
            <DialogDescription>
              Indiquez la raison de l'annulation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Raison de l'annulation</Label>
              <Textarea
                id="reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Non-paiement, fermeture du restaurant..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(false)}>
              Retour
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancel}
              disabled={!cancelReason.trim()}
            >
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Pricing Dialog */}
      <Dialog open={editPlanDialog} onOpenChange={setEditPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le tarif du plan</DialogTitle>
            <DialogDescription>
              {selectedPlan?.name} - Tarif actuel: {selectedPlan?.monthly_price.toLocaleString()} {selectedPlan?.currency}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPrice">Nouveau tarif ({selectedPlan?.currency})</Label>
              <Input
                id="newPrice"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Ex: 50000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlanDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpdatePrice}
              disabled={!newPrice.trim() || parseInt(newPrice) <= 0}
            >
              Enregistrer le tarif
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
