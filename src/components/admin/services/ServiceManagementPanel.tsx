import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ServiceTogglePanel from '@/components/admin/ServiceTogglePanel';
import { useServiceConfigurations, ServiceStatus } from '@/hooks/useServiceConfigurations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { ServiceAnalyticsDashboard } from '@/components/admin/analytics/ServiceAnalyticsDashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_OPTIONS: { value: ServiceStatus; label: string; icon: any; badgeClass: string }[] = [
  { value: 'active', label: 'Actif', icon: CheckCircle2, badgeClass: 'bg-green-500/10 text-green-600 border-green-500/20' },
  { value: 'inactive', label: 'Inactif', icon: XCircle, badgeClass: 'bg-red-500/10 text-red-600 border-red-500/20' },
  { value: 'coming_soon', label: 'Bientôt', icon: Clock, badgeClass: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
];

const StatusBadge = ({ status }: { status: ServiceStatus }) => {
  const config = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[1];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={config.badgeClass}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

export const ServiceManagementPanel = () => {
  const { configurations, loading, createService, updateService } = useServiceConfigurations();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    service_type: '',
    service_category: 'taxi' as any,
    display_name: '',
    description: '',
    service_status: 'active' as ServiceStatus,
  });

  const handleCreate = () => {
    createService({
      service_type: formData.service_type,
      service_category: formData.service_category,
      display_name: formData.display_name,
      description: formData.description || '',
      requirements: [],
      features: [],
      vehicle_requirements: {},
      is_active: formData.service_status === 'active',
      service_status: formData.service_status,
    });
    setIsCreateDialogOpen(false);
    setFormData({
      service_type: '',
      service_category: 'taxi',
      display_name: '',
      description: '',
      service_status: 'active',
    });
  };

  const handleEdit = () => {
    if (selectedService) {
      updateService({
        id: selectedService.id,
        display_name: formData.display_name,
        description: formData.description,
        is_active: formData.service_status === 'active',
        service_status: formData.service_status,
      });
      setIsEditDialogOpen(false);
      setSelectedService(null);
    }
  };

  const openEditDialog = (service: any) => {
    setSelectedService(service);
    setFormData({
      service_type: service.service_type,
      service_category: service.service_category,
      display_name: service.display_name,
      description: service.description || '',
      service_status: service.service_status || (service.is_active ? 'active' : 'inactive'),
    });
    setIsEditDialogOpen(true);
  };

  const StatusSelector = () => (
    <div>
      <Label>Statut du service</Label>
      <Select
        value={formData.service_status}
        onValueChange={(value: ServiceStatus) => setFormData({ ...formData, service_status: value })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {opt.label}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Services</h2>
          <p className="text-muted-foreground">
            Activez, désactivez et configurez les services de la plateforme
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau service</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau service à la plateforme
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Catégorie</Label>
                <Select
                  value={formData.service_category}
                  onValueChange={(value: any) => setFormData({ ...formData, service_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taxi">Taxi / VTC</SelectItem>
                    <SelectItem value="delivery">Livraison</SelectItem>
                    <SelectItem value="rental">Location</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="food">Food Delivery</SelectItem>
                    <SelectItem value="lottery">Tombola</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type de service</Label>
                <Input
                  placeholder="ex: taxi-bus, moto-taxi, vip"
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                />
              </div>

              <div>
                <Label>Nom d'affichage</Label>
                <Input
                  placeholder="ex: Taxi Bus"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Description du service..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <StatusSelector />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="quick-view" className="w-full">
        <TabsList>
          <TabsTrigger value="quick-view">Vue rapide</TabsTrigger>
          <TabsTrigger value="detailed">Configuration détaillée</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-view" className="space-y-4">
          <ServiceTogglePanel />
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid gap-4">
            {configurations.map((service) => {
              const status: ServiceStatus = (service as any).service_status || (service.is_active ? 'active' : 'inactive');
              return (
                <Card key={service.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{service.display_name}</CardTitle>
                        <CardDescription>
                          {service.service_category} - {service.service_type}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={status} />
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(service)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {configurations.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle>{service.display_name}</CardTitle>
                <CardDescription>Statistiques et métriques du service</CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceAnalyticsDashboard service={service} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le service</DialogTitle>
            <DialogDescription>
              Modifiez les informations du service
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom d'affichage</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <StatusSelector />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
