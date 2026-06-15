import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bell, Store, Shield, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const VendorSettings = () => {
  const { toast } = useToast();
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifPromotions, setNotifPromotions] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Paramètres du compte</h2>
        <p className="text-muted-foreground">
          Gérez vos préférences et paramètres de sécurité
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">
            <Settings className="h-4 w-4 mr-2" />
            Compte
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="shop">
            <Store className="h-4 w-4 mr-2" />
            Boutique
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="votre@email.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" type="tel" placeholder="+243 XXX XXX XXX" />
              </div>
              <Button onClick={() => toast({ title: "Modifications enregistrées" })}>
                Enregistrer les modifications
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Préférences de notification</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nouvelles commandes</p>
                  <p className="text-sm text-muted-foreground">Recevoir une alerte pour chaque nouvelle commande</p>
                </div>
                <Switch checked={notifOrders} onCheckedChange={setNotifOrders} />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Messages clients</p>
                  <p className="text-sm text-muted-foreground">Notifications pour les nouveaux messages</p>
                </div>
                <Switch checked={notifMessages} onCheckedChange={setNotifMessages} />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Promotions et offres</p>
                  <p className="text-sm text-muted-foreground">Recevoir des conseils et offres promotionnelles</p>
                </div>
                <Switch checked={notifPromotions} onCheckedChange={setNotifPromotions} />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="shop" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configuration de la boutique</h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="shop-name">Nom de la boutique</Label>
                <Input id="shop-name" placeholder="Ma Super Boutique" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="shop-desc">Description</Label>
                <Input id="shop-desc" placeholder="Décrivez votre boutique..." />
              </div>
              <Button onClick={() => toast({ title: "Boutique mise à jour" })}>
                Mettre à jour
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sécurité et confidentialité</h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button onClick={() => toast({ title: "Mot de passe modifié" })}>
                Changer le mot de passe
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-destructive">Zone dangereuse</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Désactiver le compte</p>
                  <p className="text-sm text-muted-foreground">Suspendre temporairement votre boutique</p>
                </div>
                <Button variant="outline">Désactiver</Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Supprimer le compte</p>
                  <p className="text-sm text-muted-foreground">Action irréversible</p>
                </div>
                <Button variant="destructive">Supprimer</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
