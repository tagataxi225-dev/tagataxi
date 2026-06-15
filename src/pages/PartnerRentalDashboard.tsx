import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Plus, Edit, Trash2, Eye, Calendar, DollarSign, Clock, CreditCard, Truck } from 'lucide-react';
import { usePartnerRentals } from '@/hooks/usePartnerRentals';
import { useToast } from '@/hooks/use-toast';
import { PartnerSubscriptionsTab } from '@/components/rental/PartnerSubscriptionsTab';
import { useRentalVehicleSubscription } from '@/hooks/useRentalVehicleSubscription';

export const PartnerRentalDashboard = () => {
  const { toast } = useToast();
  const { 
    categories, 
    vehicles, 
    bookings, 
    isLoading,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    updateBookingStatus
  } = usePartnerRentals();

  const { expiringCount, subscriptions } = useRentalVehicleSubscription();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    brand: '',
    model: '',
    year: 2024,
    vehicle_type: 'sedan',
    fuel_type: 'essence',
    transmission: 'automatic',
    seats: 5,
    daily_rate: 50000,
    hourly_rate: 8000,
    weekly_rate: 300000,
    security_deposit: 100000,
    city: 'Kinshasa',
    available_cities: ['Kinshasa'],
    comfort_level: 'standard',
    features: [] as string[],
    equipment: [] as string[],
    is_active: true,
    is_available: true
  });

  const handleSave = async () => {
    try {
      if (editingVehicle) {
        await updateVehicle.mutateAsync({ id: editingVehicle.id, updates: formData });
        toast({ title: "Véhicule modifié avec succès" });
      } else {
        await createVehicle.mutateAsync(formData);
        toast({ title: "Véhicule créé avec succès", description: "Il sera soumis à modération avant d'être visible" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ 
        title: "Erreur", 
        description: error.message || "Une erreur est survenue",
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce véhicule ?")) {
      try {
        await deleteVehicle.mutateAsync(id);
        toast({ title: "Véhicule supprimé" });
      } catch (error: any) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    }
  };

  const handleEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setFormData({
      category_id: vehicle.category_id,
      name: vehicle.name,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      vehicle_type: vehicle.vehicle_type,
      fuel_type: vehicle.fuel_type,
      transmission: vehicle.transmission,
      seats: vehicle.seats,
      daily_rate: vehicle.daily_rate,
      hourly_rate: vehicle.hourly_rate,
      weekly_rate: vehicle.weekly_rate,
      security_deposit: vehicle.security_deposit,
      city: vehicle.city || 'Kinshasa',
      available_cities: vehicle.available_cities || ['Kinshasa'],
      comfort_level: vehicle.comfort_level || 'standard',
      features: vehicle.features || [],
      equipment: vehicle.equipment || [],
      is_active: vehicle.is_active,
      is_available: vehicle.is_available
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingVehicle(null);
    setFormData({
      category_id: '',
      name: '',
      brand: '',
      model: '',
      year: 2024,
      vehicle_type: 'sedan',
      fuel_type: 'essence',
      transmission: 'automatic',
      seats: 5,
      daily_rate: 50000,
      hourly_rate: 8000,
      weekly_rate: 300000,
      security_deposit: 100000,
      city: 'Kinshasa',
      available_cities: ['Kinshasa'],
      comfort_level: 'standard',
      features: [],
      equipment: [],
      is_active: true,
      is_available: true
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "outline", label: "En attente" },
      approved: { variant: "default", label: "Approuvé" },
      rejected: { variant: "destructive", label: "Rejeté" }
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gestion Location</h1>
            <p className="text-muted-foreground">Gérez vos véhicules de location</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un véhicule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Catégorie *</Label>
                    <Select value={formData.category_id} onValueChange={(v) => setFormData({...formData, category_id: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nom du véhicule *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Marque *</Label>
                    <Input value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Modèle *</Label>
                    <Input value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Année *</Label>
                    <Input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({...formData, vehicle_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedan">Berline</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="truck">Pick-up</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Carburant</Label>
                    <Select value={formData.fuel_type || ''} onValueChange={(v) => setFormData({...formData, fuel_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="essence">Essence</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="hybrid">Hybride</SelectItem>
                        <SelectItem value="electric">Électrique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Transmission</Label>
                    <Select value={formData.transmission || ''} onValueChange={(v) => setFormData({...formData, transmission: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Automatique</SelectItem>
                        <SelectItem value="manual">Manuelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nombre de places</Label>
                  <Input type="number" value={formData.seats} onChange={(e) => setFormData({...formData, seats: parseInt(e.target.value)})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tarif horaire (CDF)</Label>
                    <Input type="number" value={formData.hourly_rate} onChange={(e) => setFormData({...formData, hourly_rate: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tarif journalier (CDF)</Label>
                    <Input type="number" value={formData.daily_rate} onChange={(e) => setFormData({...formData, daily_rate: parseInt(e.target.value)})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tarif hebdomadaire (CDF)</Label>
                    <Input type="number" value={formData.weekly_rate} onChange={(e) => setFormData({...formData, weekly_rate: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Caution (CDF)</Label>
                    <Input type="number" value={formData.security_deposit} onChange={(e) => setFormData({...formData, security_deposit: parseInt(e.target.value)})} />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" className="flex-1" onClick={handleSave}>
                    {editingVehicle ? 'Modifier' : 'Créer'}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Véhicules</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vehicles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
              <Badge variant="default">Actif</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vehicles.filter(v => v.moderation_status === 'approved').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Badge variant="outline">Modération</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vehicles.filter(v => v.moderation_status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Réservations</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="vehicles" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vehicles">
              Véhicules ({vehicles.length})
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="relative">
              <CreditCard className="h-4 w-4 mr-1" />
              Abonnements
              {expiringCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {expiringCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bookings">
              Réservations ({bookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vehicles" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="glassmorphism">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                      {getStatusBadge(vehicle.moderation_status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.brand} {vehicle.model} ({vehicle.year})
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Places:</span>
                      <span className="font-medium">{vehicle.seats}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tarif/jour:</span>
                      <span className="font-semibold text-primary">{vehicle.daily_rate.toLocaleString()} CDF</span>
                    </div>
                    
                    {vehicle.moderation_status === 'rejected' && vehicle.rejection_reason && (
                      <div className="p-2 bg-destructive/10 rounded text-xs text-destructive">
                        Raison: {vehicle.rejection_reason}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(vehicle)} className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(vehicle.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {vehicles.length === 0 && (
              <Card className="glassmorphism">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Car className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun véhicule</h3>
                  <p className="text-muted-foreground mb-4">Commencez par ajouter votre premier véhicule</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un véhicule
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Abonnements */}
          <TabsContent value="subscriptions" className="mt-6">
            <PartnerSubscriptionsTab 
              vehicles={vehicles} 
              categories={categories}
            />
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            {bookings.length === 0 ? (
              <Card className="glassmorphism">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune réservation</h3>
                  <p className="text-muted-foreground">Les réservations apparaîtront ici</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Réservation #{booking.id.slice(0, 8)}</CardTitle>
                        <Badge>{booking.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Début:</span>
                        <p className="font-medium">{new Date(booking.start_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fin:</span>
                        <p className="font-medium">{new Date(booking.end_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Montant:</span>
                        <p className="font-semibold text-primary">{booking.total_amount.toLocaleString()} CDF</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PartnerRentalDashboard;
