/**
 * Interface d'administration pour la gestion des services de livraison
 * Permet de créer, modifier et gérer les tarifs par ville et service
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  RefreshCw,
  Truck,
  Bike,
  Car,
  Package
} from 'lucide-react';

interface DeliveryService {
  id: string;
  service_type: string;
  city: string;
  base_price: number;
  price_per_km: number;
  minimum_fare: number;
  maximum_fare?: number;
  currency: string;
  surge_multiplier: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceFormData {
  service_type: string;
  city: string;
  base_price: number;
  price_per_km: number;
  minimum_fare: number;
  maximum_fare?: number;
  currency: string;
  surge_multiplier: number;
  is_active: boolean;
}

const CITIES = ['Kinshasa', 'Lubumbashi', 'Kolwezi', 'Abidjan'];
const CURRENCIES = ['XOF'];
const SERVICE_TYPES = [
  { id: 'flash', name: 'Flash Express', icon: Bike, description: 'Moto - Petit colis' },
  { id: 'flex', name: 'Flex Camionnette', icon: Truck, description: 'Camionnette - Colis moyen volume' },
  { id: 'maxicharge', name: 'MaxiCharge', icon: Package, description: 'Camion - Gros volume' },
  { id: 'express_moto', name: 'Express Moto', icon: Bike, description: 'Moto express personnalisé' },
  { id: 'camionnette_standard', name: 'Camionnette', icon: Truck, description: 'Camionnette personnalisée' },
  { id: 'camion_gros_volume', name: 'Gros Volume', icon: Package, description: 'Camion gros volume' }
];

const DeliveryServiceManager = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<DeliveryService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<DeliveryService | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    service_type: 'flash',
    city: 'Kinshasa',
    base_price: 5000,
    price_per_km: 500,
    minimum_fare: 3000,
    maximum_fare: undefined,
    currency: 'XOF',
    surge_multiplier: 1.0,
    is_active: true
  });

  // Charger les services existants
  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_pricing_config')
        .select('*')
        .order('city', { ascending: true })
        .order('service_type', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erreur chargement services:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les services de livraison",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Créer un nouveau service
  const createService = async () => {
    try {
      const { error } = await supabase
        .from('delivery_pricing_config')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Service créé ✅",
        description: `${formData.service_type} pour ${formData.city}`,
        variant: "default"
      });

      setShowCreateForm(false);
      resetForm();
      loadServices();
    } catch (error: any) {
      console.error('Erreur création service:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le service",
        variant: "destructive"
      });
    }
  };

  // Mettre à jour un service existant
  const updateService = async (service: DeliveryService) => {
    try {
      const { error } = await supabase
        .from('delivery_pricing_config')
        .update({
          base_price: service.base_price,
          price_per_km: service.price_per_km,
          minimum_fare: service.minimum_fare,
          maximum_fare: service.maximum_fare,
          surge_multiplier: service.surge_multiplier,
          is_active: service.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', service.id);

      if (error) throw error;

      toast({
        title: "Service mis à jour ✅",
        description: `${service.service_type} pour ${service.city}`,
        variant: "default"
      });

      setEditingService(null);
      loadServices();
    } catch (error: any) {
      console.error('Erreur mise à jour service:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le service",
        variant: "destructive"
      });
    }
  };

  // Supprimer un service
  const deleteService = async (serviceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;

    try {
      const { error } = await supabase
        .from('delivery_pricing_config')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Service supprimé ✅",
        description: "Le service a été supprimé avec succès",
        variant: "default"
      });

      loadServices();
    } catch (error: any) {
      console.error('Erreur suppression service:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le service",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      service_type: 'flash',
      city: 'Kinshasa',
      base_price: 5000,
      price_per_km: 500,
      minimum_fare: 3000,
      maximum_fare: undefined,
      currency: 'XOF',
      surge_multiplier: 1.0,
      is_active: true
    });
  };

  const getServiceTypeInfo = (serviceType: string) => {
    return SERVICE_TYPES.find(s => s.id === serviceType) || SERVICE_TYPES[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des services...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Services de Livraison</h1>
          <p className="text-muted-foreground">
            Configurez les tarifs et services par ville
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Service
        </Button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Créer un nouveau service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de service</Label>
                <Select 
                  value={formData.service_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex items-center gap-2">
                          <service.icon className="h-4 w-4" />
                          {service.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ville</Label>
                <Select 
                  value={formData.city} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prix de base</Label>
                <Input
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_price: Number(e.target.value) }))}
                />
              </div>

              <div>
                <Label>Prix par km</Label>
                <Input
                  type="number"
                  value={formData.price_per_km}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_per_km: Number(e.target.value) }))}
                />
              </div>

              <div>
                <Label>Tarif minimum</Label>
                <Input
                  type="number"
                  value={formData.minimum_fare}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimum_fare: Number(e.target.value) }))}
                />
              </div>

              <div>
                <Label>Devise</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(currency => (
                      <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={createService}>
                <Save className="h-4 w-4 mr-2" />
                Créer le service
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des services */}
      <div className="grid gap-4">
        {services.map((service) => {
          const serviceInfo = getServiceTypeInfo(service.service_type);
          const isEditing = editingService?.id === service.id;
          const ServiceIcon = serviceInfo.icon;

          return (
            <Card key={service.id} className={`${!service.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ServiceIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {serviceInfo.name} - {service.city}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {serviceInfo.description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={service.is_active ? "default" : "secondary"}>
                          {service.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Badge variant="outline">{service.currency}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {isEditing ? (
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <Input
                          type="number"
                          value={service.base_price}
                          onChange={(e) => setEditingService({
                            ...service,
                            base_price: Number(e.target.value)
                          })}
                          placeholder="Base"
                        />
                        <Input
                          type="number"
                          value={service.price_per_km}
                          onChange={(e) => setEditingService({
                            ...service,
                            price_per_km: Number(e.target.value)
                          })}
                          placeholder="Par km"
                        />
                        <Input
                          type="number"
                          value={service.minimum_fare}
                          onChange={(e) => setEditingService({
                            ...service,
                            minimum_fare: Number(e.target.value)
                          })}
                          placeholder="Minimum"
                        />
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {service.base_price.toLocaleString()} {service.currency}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          +{service.price_per_km} {service.currency}/km
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Min: {service.minimum_fare.toLocaleString()} {service.currency}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={() => updateService(service)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingService(null)}>
                            Annuler
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setEditingService(service)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteService(service.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun service configuré</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre premier service de livraison pour commencer
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un service
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeliveryServiceManager;