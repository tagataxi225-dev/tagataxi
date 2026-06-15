import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useAdminRoleNotifications } from "@/hooks/useAdminRoleNotifications";
import { toast } from "sonner";
import { 
  notifyNewDriverPending, 
  notifyNewPartnerPending, 
  notifyProductReported,
  notifyMarketplaceProductPending,
  notifyFoodProductPending,
  notifyRestaurantPending,
  notifyVehiclePending,
  notifyWithdrawalRequested,
  notifyTicketUrgent,
  notifyOrderIssue
} from "@/utils/adminNotificationHelpers";

export const AdminNotificationTestPage = () => {
  const { dispatchAdminNotification } = useAdminRoleNotifications();
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState<string>('driver_pending');

  const handleTestNotification = async () => {
    setLoading(true);
    try {
      let result;
      
      switch (testType) {
        case 'driver_pending':
          result = await notifyNewDriverPending('test-driver-id', 'Jean Dupont');
          break;
        case 'partner_pending':
          result = await notifyNewPartnerPending('test-partner-id', 'ABC Transport');
          break;
        case 'product_reported':
          result = await notifyProductReported('test-product-id', 'iPhone 15', 'Contenu inapproprié');
          break;
        case 'marketplace_product_pending':
          result = await notifyMarketplaceProductPending('test-product-id', 'Laptop Dell', 'Tech Store');
          break;
        case 'food_product_pending':
          result = await notifyFoodProductPending('test-food-id', 'Pizza Margherita', 'Chez Luigi');
          break;
        case 'restaurant_pending':
          result = await notifyRestaurantPending('test-restaurant-id', 'Le Gourmet');
          break;
        case 'vehicle_pending':
          result = await notifyVehiclePending('test-vehicle-id', 'Toyota Corolla 2023', 'Rent-A-Car');
          break;
        case 'withdrawal_requested':
          result = await notifyWithdrawalRequested('test-withdrawal-id', 50000, 'Marie Martin');
          break;
        case 'ticket_urgent':
          result = await notifyTicketUrgent('test-ticket-id', 'Problème critique de paiement', 'Client VIP');
          break;
        case 'order_issue':
          result = await notifyOrderIssue('test-order-id', 'Livraison annulée par le chauffeur', 'transport');
          break;
        default:
          result = { success: false };
      }

      if (result.success) {
        toast.success('Notification de test envoyée !', {
          description: 'Les admins concernés devraient la recevoir.'
        });
      } else {
        toast.error('Erreur lors de l\'envoi de la notification');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      toast.error('Erreur lors du test');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomNotification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    setLoading(true);
    try {
      const result = await dispatchAdminNotification({
        event_type: formData.get('event_type') as any,
        entity_id: formData.get('entity_id') as string,
        entity_type: formData.get('entity_type') as string,
        title: formData.get('title') as string,
        message: formData.get('message') as string,
        severity: formData.get('severity') as any,
        priority: formData.get('priority') as any,
      });

      if (result.success) {
        toast.success('Notification personnalisée envoyée !');
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Custom notification error:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test des Notifications Admin</h1>
        <p className="text-muted-foreground mt-2">
          Testez le système de notifications admin en temps réel avec dispatch intelligent par rôle
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tests rapides prédéfinis */}
        <Card>
          <CardHeader>
            <CardTitle>Tests Rapides</CardTitle>
            <CardDescription>
              Envoyez des notifications de test prédéfinies aux admins concernés
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-type">Type de notification</Label>
              <Select value={testType} onValueChange={setTestType}>
                <SelectTrigger id="test-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driver_pending">🚗 Nouveau chauffeur en attente</SelectItem>
                  <SelectItem value="partner_pending">🤝 Nouveau partenaire en attente</SelectItem>
                  <SelectItem value="product_reported">⚠️ Produit signalé</SelectItem>
                  <SelectItem value="marketplace_product_pending">🛍️ Produit marketplace en attente</SelectItem>
                  <SelectItem value="food_product_pending">🍽️ Plat en attente</SelectItem>
                  <SelectItem value="restaurant_pending">🍴 Restaurant en attente</SelectItem>
                  <SelectItem value="vehicle_pending">🚙 Véhicule en attente</SelectItem>
                  <SelectItem value="withdrawal_requested">💰 Demande de retrait</SelectItem>
                  <SelectItem value="ticket_urgent">🆘 Ticket urgent</SelectItem>
                  <SelectItem value="order_issue">⚠️ Problème de commande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleTestNotification} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer notification de test'}
            </Button>
          </CardContent>
        </Card>

        {/* Notification personnalisée */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Personnalisée</CardTitle>
            <CardDescription>
              Créez une notification personnalisée pour les tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCustomNotification} className="space-y-4">
              <div>
                <Label htmlFor="event_type">Type d'événement</Label>
                <Input 
                  id="event_type" 
                  name="event_type" 
                  placeholder="driver_pending" 
                  required 
                />
              </div>

              <div>
                <Label htmlFor="entity_id">ID Entité</Label>
                <Input 
                  id="entity_id" 
                  name="entity_id" 
                  placeholder="test-id-123" 
                  required 
                />
              </div>

              <div>
                <Label htmlFor="entity_type">Type d'entité</Label>
                <Input 
                  id="entity_type" 
                  name="entity_type" 
                  placeholder="driver" 
                  required 
                />
              </div>

              <div>
                <Label htmlFor="title">Titre</Label>
                <Input 
                  id="title" 
                  name="title" 
                  placeholder="Titre de la notification" 
                  required 
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  name="message" 
                  placeholder="Description de la notification" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="severity">Sévérité</Label>
                  <Select name="severity" defaultValue="info">
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priorité</Label>
                  <Select name="priority" defaultValue="normal">
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="normal">Normale</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Envoi en cours...' : 'Envoyer notification personnalisée'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🎯 Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>1. Dispatch Intelligent :</strong>
            <p className="text-muted-foreground">
              Chaque notification est automatiquement envoyée uniquement aux admins ayant les permissions requises.
            </p>
          </div>
          <div>
            <strong>2. Notifications en Temps Réel :</strong>
            <p className="text-muted-foreground">
              Les admins connectés reçoivent instantanément les notifications via Supabase Realtime.
            </p>
          </div>
          <div>
            <strong>3. Toasts & Push :</strong>
            <p className="text-muted-foreground">
              Les notifications prioritaires (high/urgent) génèrent des toasts et des notifications navigateur.
            </p>
          </div>
          <div>
            <strong>4. Permissions par Événement :</strong>
            <ul className="list-disc list-inside text-muted-foreground ml-2">
              <li>Chauffeur → Admin Transport</li>
              <li>Marketplace → Admin Marketplace + Moderators</li>
              <li>Food → Admin Food</li>
              <li>Retrait → Admin Financier</li>
              <li>Support → Admin Support</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotificationTestPage;
