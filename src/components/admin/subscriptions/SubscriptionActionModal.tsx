import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUnifiedSubscriptions } from "@/hooks/useUnifiedSubscriptions";
import { Calendar, CreditCard, AlertTriangle, Clock, Users, Car } from "lucide-react";

interface SubscriptionActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: any;
  action: string;
  type: 'driver' | 'rental';
  onConfirm?: (id: string, data?: any) => void;
}

export const SubscriptionActionModal = ({
  isOpen,
  onClose,
  subscription,
  action,
  type,
  onConfirm
}: SubscriptionActionModalProps) => {
  const { extendSubscription, cancelSubscriptionAdmin } = useUnifiedSubscriptions();
  const [loading, setLoading] = useState(false);
  const [extensionDays, setExtensionDays] = useState("30");
  const [confirmText, setConfirmText] = useState("");

  if (!subscription) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const handleExtend = async () => {
    setLoading(true);
    try {
      if (onConfirm) {
        onConfirm(subscription.id, { days: parseInt(extensionDays) });
      } else {
        await extendSubscription(subscription.id, type, parseInt(extensionDays));
      }
      onClose();
    } catch (error) {
      console.error('Error extending subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (confirmText.toLowerCase() !== 'annuler') {
      return;
    }
    
    setLoading(true);
    try {
      if (onConfirm) {
        onConfirm(subscription.id);
      } else {
        await cancelSubscriptionAdmin(subscription.id, type);
      }
      onClose();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSubscriptionInfo = () => {
    if (type === 'driver') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Chauffeur :</span>
            <span>{subscription.chauffeurs?.display_name}</span>
          </div>
          <div>
            <span className="font-medium">Plan :</span>
            <span className="ml-2">{subscription.subscription_plans?.name}</span>
          </div>
          <div>
            <span className="font-medium">Prix :</span>
            <span className="ml-2">
              {subscription.subscription_plans?.price?.toLocaleString()} {subscription.subscription_plans?.currency}
            </span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-green-500" />
            <span className="font-medium">Partenaire :</span>
            <span>{subscription.partenaires?.company_name}</span>
          </div>
          <div>
            <span className="font-medium">Véhicule :</span>
            <span className="ml-2">{subscription.rental_vehicles?.name}</span>
          </div>
          <div>
            <span className="font-medium">Plan :</span>
            <span className="ml-2">{subscription.rental_subscription_plans?.name}</span>
          </div>
          <div>
            <span className="font-medium">Prix :</span>
            <span className="ml-2">
              {subscription.rental_subscription_plans?.monthly_price?.toLocaleString()} CDF
            </span>
          </div>
        </div>
      );
    }
  };

  const renderActionContent = () => {
    switch (action) {
      case 'renew':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Un nouvel abonnement sera créé à partir d'aujourd'hui avec les mêmes paramètres. 
                L'abonnement actuel sera marqué comme expiré.
              </p>
            </div>

            {renderSubscriptionInfo()}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onClose()}
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  setLoading(true);
                  onConfirm?.(subscription?.id);
                }}
                disabled={loading}
              >
                {loading ? "Renouvellement..." : "Confirmer le renouvellement"}
              </Button>
            </DialogFooter>
          </div>
        );

      case 'extend':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Prolonger l'abonnement
              </DialogTitle>
              <DialogDescription>
                Ajouter du temps à cet abonnement sans nouveau paiement
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {renderSubscriptionInfo()}
              
              <div className="border rounded-lg p-3 bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Date d'expiration actuelle :</span>
                  <Badge variant="outline">{formatDate(subscription.end_date)}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="extension-days">Durée de prolongation</Label>
                <Select value={extensionDays} onValueChange={setExtensionDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 jours</SelectItem>
                    <SelectItem value="15">15 jours</SelectItem>
                    <SelectItem value="30">30 jours (1 mois)</SelectItem>
                    <SelectItem value="60">60 jours (2 mois)</SelectItem>
                    <SelectItem value="90">90 jours (3 mois)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Nouvelle date d'expiration : {
                    new Date(
                      new Date(subscription.end_date).getTime() + 
                      parseInt(extensionDays) * 24 * 60 * 60 * 1000
                    ).toLocaleDateString('fr-FR')
                  }
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={handleExtend} disabled={loading}>
                {loading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Prolongation...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Prolonger de {extensionDays} jours
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        );

      case 'cancel':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Annuler l'abonnement
              </DialogTitle>
              <DialogDescription>
                Cette action est irréversible. L'abonnement sera immédiatement annulé.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {renderSubscriptionInfo()}
              
              <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-red-700">Attention</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  L'abonnement sera annulé immédiatement. L'utilisateur perdra l'accès aux services premium.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-text">
                  Tapez "ANNULER" pour confirmer
                </Label>
                <Input
                  id="confirm-text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="ANNULER"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Retour
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancel} 
                disabled={loading || confirmText.toLowerCase() !== 'annuler'}
              >
                {loading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Annulation...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Annuler définitivement
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        );

      case 'details':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Détails de l'abonnement</DialogTitle>
              <DialogDescription>
                Informations complètes sur cet abonnement
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {renderSubscriptionInfo()}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Statut :</span>
                  <Badge className="ml-2" variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Auto-renew :</span>
                  <Badge className="ml-2" variant={subscription.auto_renew ? 'default' : 'secondary'}>
                    {subscription.auto_renew ? 'Oui' : 'Non'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Date de début :</span>
                  <span className="ml-2">{formatDate(subscription.start_date)}</span>
                </div>
                <div>
                  <span className="font-medium">Date de fin :</span>
                  <span className="ml-2">{formatDate(subscription.end_date)}</span>
                </div>
              </div>

              {type === 'driver' && (
                <div>
                  <span className="font-medium">Méthode de paiement :</span>
                  <span className="ml-2">{subscription.payment_method}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={onClose}>
                Fermer
              </Button>
            </DialogFooter>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        {renderActionContent()}
      </DialogContent>
    </Dialog>
  );
};