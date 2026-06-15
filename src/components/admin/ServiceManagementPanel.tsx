import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useServiceConfigurations } from '@/hooks/useServiceConfigurations';
import { ServiceCreationModal } from './services/ServiceCreationModal';
import { CityPricingManager } from './services/CityPricingManager';
import { RentalServiceTab } from './services/RentalServiceTab';
import { MarketplaceServiceTab } from './services/MarketplaceServiceTab';
import { LotteryServiceTab } from './services/LotteryServiceTab';
import { Settings, DollarSign, Users, TrendingUp, Plus, Edit, Power } from 'lucide-react';

export const ServiceManagementPanel: React.FC = () => {
  const { 
    configurations, 
    pricing, 
    formatPrice, 
    updatePricing, 
    createService, 
    updateService, 
    createPricing 
  } = useServiceConfigurations();
  const [editingPricing, setEditingPricing] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('management');
  
  const [pricingForm, setPricingForm] = useState({
    base_price: 0,
    price_per_km: 0,
    price_per_minute: 0,
    minimum_fare: 0,
    commission_rate: 0,
  });

  const [serviceForm, setServiceForm] = useState({
    display_name: '',
    description: '',
    features: [] as string[],
    requirements: [] as string[],
    is_active: true
  });

  const handleEditPricing = (pricingItem: any) => {
    setEditingPricing(pricingItem.id);
    setPricingForm({
      base_price: pricingItem.base_price,
      price_per_km: pricingItem.price_per_km,
      price_per_minute: pricingItem.price_per_minute || 0,
      minimum_fare: pricingItem.minimum_fare,
      commission_rate: pricingItem.commission_rate,
    });
  };

  const handleSavePricing = () => {
    if (!editingPricing) return;
    
    updatePricing({
      id: editingPricing,
      ...pricingForm,
    });
    
    setEditingPricing(null);
  };

  const handleEditService = (service: any) => {
    setEditingService(service.id);
    setServiceForm({
      display_name: service.display_name,
      description: service.description || '',
      features: service.features || [],
      requirements: service.requirements || [],
      is_active: service.is_active
    });
  };

  const handleSaveService = () => {
    if (!editingService) return;
    
    updateService({
      id: editingService,
      ...serviceForm,
    });
    
    setEditingService(null);
  };

  const toggleServiceStatus = (serviceId: string, currentStatus: boolean) => {
    updateService({
      id: serviceId,
      is_active: !currentStatus
    });
  };

  const getServicesByCategory = (category: 'taxi' | 'delivery' | 'rental' | 'marketplace' | 'lottery') => {
    return configurations.filter(config => config.service_category === category);
  };

  const getPricingForService = (serviceType: string, serviceCategory: string) => {
    return pricing.find(p => p.service_type === serviceType && p.service_category === serviceCategory);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Gestion des Services
        </h2>
        <p className="text-muted-foreground">
          Configurez les services et la tarification pour les chauffeurs et livreurs
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="management">Gestion</TabsTrigger>
          <TabsTrigger value="taxi">Taxi</TabsTrigger>
          <TabsTrigger value="delivery">Livraison</TabsTrigger>
          <TabsTrigger value="rental">Location</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="lottery">Loterie</TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Taxi Services Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Services Taxi
                  <ServiceCreationModal 
                    category="taxi"
                    onCreateService={createService}
                  >
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Nouveau
                    </Button>
                  </ServiceCreationModal>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getServicesByCategory('taxi').map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{service.display_name}</div>
                      <div className="text-sm text-muted-foreground">{service.service_type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.is_active}
                        onCheckedChange={() => toggleServiceStatus(service.id, service.is_active)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditService(service)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Delivery Services Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Services Livraison
                  <ServiceCreationModal 
                    category="delivery"
                    onCreateService={createService}
                  >
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Nouveau
                    </Button>
                  </ServiceCreationModal>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getServicesByCategory('delivery').map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{service.display_name}</div>
                      <div className="text-sm text-muted-foreground">{service.service_type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.is_active}
                        onCheckedChange={() => toggleServiceStatus(service.id, service.is_active)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditService(service)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Rental Services Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Location Véhicules
                  <Badge variant="outline">{getServicesByCategory('rental').length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getServicesByCategory('rental').map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{service.display_name}</div>
                      <div className="text-sm text-muted-foreground">Commission: 15%</div>
                    </div>
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={() => toggleServiceStatus(service.id, service.is_active)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Marketplace Services Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Marketplace
                  <Badge variant="outline">{getServicesByCategory('marketplace').length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getServicesByCategory('marketplace').map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{service.display_name}</div>
                      <div className="text-sm text-muted-foreground">Commission: 10%</div>
                    </div>
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={() => toggleServiceStatus(service.id, service.is_active)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Lottery Services Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Loterie
                  <Badge variant="outline">{getServicesByCategory('lottery').length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getServicesByCategory('lottery').map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{service.display_name}</div>
                      <div className="text-sm text-muted-foreground">Système de récompenses</div>
                    </div>
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={() => toggleServiceStatus(service.id, service.is_active)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Service Editor */}
          {editingService && (
            <Card>
              <CardHeader>
                <CardTitle>Modifier le service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nom d'affichage</Label>
                    <Input
                      value={serviceForm.display_name}
                      onChange={(e) => setServiceForm(prev => ({
                        ...prev,
                        display_name: e.target.value
                      }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={serviceForm.is_active}
                      onCheckedChange={(checked) => setServiceForm(prev => ({
                        ...prev,
                        is_active: checked
                      }))}
                    />
                    <Label>Service actif</Label>
                  </div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSaveService}>
                    Sauvegarder
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingService(null)}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="taxi" className="space-y-6">
          <Tabs defaultValue="services" className="space-y-4">
            <TabsList>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="pricing">Tarification par ville</TabsTrigger>
            </TabsList>

            <TabsContent value="services">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {getServicesByCategory('taxi').map((service) => {
                  const servicePricing = getPricingForService(service.service_type, service.service_category);
                  
                  return (
                    <Card key={service.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{service.display_name}</CardTitle>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {service.service_type}
                            </Badge>
                            {!service.is_active && (
                              <Badge variant="destructive" className="text-xs">
                                Inactif
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          {service.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {servicePricing && (
                          <div className="space-y-2">
                            {editingPricing === servicePricing.id ? (
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs">Prix de base</Label>
                                  <Input
                                    type="number"
                                    value={pricingForm.base_price}
                                    onChange={(e) => setPricingForm(prev => ({
                                      ...prev,
                                      base_price: Number(e.target.value)
                                    }))}
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Prix/km</Label>
                                  <Input
                                    type="number"
                                    value={pricingForm.price_per_km}
                                    onChange={(e) => setPricingForm(prev => ({
                                      ...prev,
                                      price_per_km: Number(e.target.value)
                                    }))}
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Commission (%)</Label>
                                  <Input
                                    type="number"
                                    value={pricingForm.commission_rate}
                                    onChange={(e) => setPricingForm(prev => ({
                                      ...prev,
                                      commission_rate: Number(e.target.value)
                                    }))}
                                    className="h-8"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={handleSavePricing}
                                    className="flex-1"
                                  >
                                    Sauver
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setEditingPricing(null)}
                                    className="flex-1"
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Base:</span>
                                  <span className="font-medium">{formatPrice(servicePricing.base_price)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Par km:</span>
                                  <span className="font-medium">{formatPrice(servicePricing.price_per_km)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Commission:</span>
                                  <span className="font-medium">{servicePricing.commission_rate}%</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditPricing(servicePricing)}
                                  className="w-full mt-2"
                                >
                                  <Settings className="h-3 w-3 mr-1" />
                                  Modifier
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Caractéristiques</div>
                          <div className="flex flex-wrap gap-1">
                            {service.features.slice(0, 2).map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="pricing">
              <div className="space-y-6">
                {getServicesByCategory('taxi').map((service) => {
                  const servicePricing = pricing.filter(p => 
                    p.service_type === service.service_type && 
                    p.service_category === service.service_category
                  );
                  
                  return (
                    <Card key={service.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{service.display_name}</CardTitle>
                        <CardDescription>
                          Gérez la tarification par ville pour ce service
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CityPricingManager
                          serviceType={service.service_type}
                          serviceCategory={service.service_category}
                          existingPricing={servicePricing}
                          onCreatePricing={createPricing}
                          onUpdatePricing={updatePricing}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          <Tabs defaultValue="services" className="space-y-4">
            <TabsList>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="pricing">Tarification par ville</TabsTrigger>
            </TabsList>

            <TabsContent value="services">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {getServicesByCategory('delivery').map((service) => {
                  const servicePricing = getPricingForService(service.service_type, service.service_category);
                  
                  return (
                    <Card key={service.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{service.display_name}</CardTitle>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {service.service_type}
                            </Badge>
                            {!service.is_active && (
                              <Badge variant="destructive" className="text-xs">
                                Inactif
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          {service.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {servicePricing && (
                          <div className="space-y-2">
                            {editingPricing === servicePricing.id ? (
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs">Prix de base</Label>
                                  <Input
                                    type="number"
                                    value={pricingForm.base_price}
                                    onChange={(e) => setPricingForm(prev => ({
                                      ...prev,
                                      base_price: Number(e.target.value)
                                    }))}
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Prix/km</Label>
                                  <Input
                                    type="number"
                                    value={pricingForm.price_per_km}
                                    onChange={(e) => setPricingForm(prev => ({
                                      ...prev,
                                      price_per_km: Number(e.target.value)
                                    }))}
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Commission (%)</Label>
                                  <Input
                                    type="number"
                                    value={pricingForm.commission_rate}
                                    onChange={(e) => setPricingForm(prev => ({
                                      ...prev,
                                      commission_rate: Number(e.target.value)
                                    }))}
                                    className="h-8"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={handleSavePricing}
                                    className="flex-1"
                                  >
                                    Sauver
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setEditingPricing(null)}
                                    className="flex-1"
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Base:</span>
                                  <span className="font-medium">{formatPrice(servicePricing.base_price)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Par km:</span>
                                  <span className="font-medium">{formatPrice(servicePricing.price_per_km)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Commission:</span>
                                  <span className="font-medium">{servicePricing.commission_rate}%</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditPricing(servicePricing)}
                                  className="w-full mt-2"
                                >
                                  <Settings className="h-3 w-3 mr-1" />
                                  Modifier
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Caractéristiques</div>
                          <div className="flex flex-wrap gap-1">
                            {service.features.slice(0, 2).map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="pricing">
              <div className="space-y-6">
                {getServicesByCategory('delivery').map((service) => {
                  const servicePricing = pricing.filter(p => 
                    p.service_type === service.service_type && 
                    p.service_category === service.service_category
                  );
                  
                  return (
                    <Card key={service.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{service.display_name}</CardTitle>
                        <CardDescription>
                          Gérez la tarification par ville pour ce service
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CityPricingManager
                          serviceType={service.service_type}
                          serviceCategory={service.service_category}
                          existingPricing={servicePricing}
                          onCreatePricing={createPricing}
                          onUpdatePricing={updatePricing}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Rental Services Tab */}
        <TabsContent value="rental" className="space-y-6">
          <RentalServiceTab
            services={getServicesByCategory('rental')}
            pricing={pricing}
            onEditService={handleEditService}
            onToggleStatus={toggleServiceStatus}
          />
        </TabsContent>

        {/* Marketplace Services Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          <MarketplaceServiceTab
            services={getServicesByCategory('marketplace')}
            pricing={pricing}
            onToggleStatus={toggleServiceStatus}
          />
        </TabsContent>

        {/* Lottery Services Tab */}
        <TabsContent value="lottery" className="space-y-6">
          <LotteryServiceTab
            services={getServicesByCategory('lottery')}
            onToggleStatus={toggleServiceStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};