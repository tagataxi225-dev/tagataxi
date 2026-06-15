import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useServiceConfigurations, ServiceStatus } from '@/hooks/useServiceConfigurations';
import { supabase } from '@/integrations/supabase/client';
import { SERVICE_TYPE_TO_VEHICLE_CLASS } from '@/utils/pricingMapper';
import { useQueryClient } from '@tanstack/react-query';
import {
  Car,
  Package,
  ShoppingCart,
  Ticket,
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_CONFIG: Record<ServiceStatus, { label: string; icon: any; badgeClass: string }> = {
  active: {
    label: 'Actif',
    icon: CheckCircle2,
    badgeClass: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  inactive: {
    label: 'Inactif',
    icon: XCircle,
    badgeClass: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
  coming_soon: {
    label: 'Bientôt',
    icon: Clock,
    badgeClass: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  },
};

const ServiceTogglePanel = () => {
  const { toast } = useToast();
  const { configurations, loading } = useServiceConfigurations();
  const [updating, setUpdating] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const serviceIcons: { [key: string]: any } = {
    'taxi': Car,
    'delivery': Package,
    'rental': Building2,
    'marketplace': ShoppingCart,
    'lottery': Ticket,
  };

  const handleStatusChange = async (serviceType: string, serviceCategory: string, newStatus: ServiceStatus) => {
    const key = `${serviceType}-${serviceCategory}`;
    setUpdating(key);
    const isActive = newStatus === 'active';
    
    try {
      const { error: configError } = await supabase
        .from('service_configurations')
        .update({ 
          is_active: isActive,
          service_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('service_type', serviceType)
        .eq('service_category', serviceCategory);

      if (configError) throw configError;

      if (serviceCategory === 'taxi') {
        const vehicleClass = SERVICE_TYPE_TO_VEHICLE_CLASS[serviceType];
        if (vehicleClass) {
          await supabase
            .from('pricing_rules')
            .update({ 
              is_active: isActive,
              updated_at: new Date().toISOString()
            })
            .eq('vehicle_class', vehicleClass)
            .eq('service_type', 'transport');
        }
      }

      await supabase.from('activity_logs').insert({
        activity_type: 'service_toggle',
        description: `Service ${serviceType} → ${newStatus}`,
        metadata: {
          service_type: serviceType,
          service_category: serviceCategory,
          new_status: newStatus
        }
      });

      queryClient.invalidateQueries({ queryKey: ['service-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['pricing_rules'] });
      queryClient.invalidateQueries({ queryKey: ['available-taxi-services'] });

      const statusLabel = STATUS_CONFIG[newStatus].label;
      toast({
        title: '✅ Service mis à jour',
        description: `${serviceType} → ${statusLabel}`,
      });
    } catch (error: any) {
      console.error('❌ Error updating service status:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de modifier le service',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const servicesByCategory = configurations?.reduce((acc: any, config: any) => {
    if (!acc[config.service_category]) {
      acc[config.service_category] = [];
    }
    acc[config.service_category].push(config);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gestion des services</h2>
        <p className="text-muted-foreground">Activez, désactivez ou marquez "Bientôt" les services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(servicesByCategory || {}).map(([category, services]: [string, any]) => {
          const IconComponent = serviceIcons[category] || Car;
          
          return (
            <Card key={category} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <IconComponent className="w-5 h-5 text-primary" />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {services.map((service: any) => {
                  const key = `${service.service_type}-${service.service_category}`;
                  const isUpdating = updating === key;
                  const currentStatus: ServiceStatus = service.service_status || (service.is_active ? 'active' : 'inactive');
                  const statusConfig = STATUS_CONFIG[currentStatus];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-foreground">
                            {service.display_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {service.service_type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={statusConfig.badgeClass}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        
                        <Select
                          value={currentStatus}
                          onValueChange={(value: ServiceStatus) => handleStatusChange(
                            service.service_type,
                            service.service_category,
                            value
                          )}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                Actif
                              </span>
                            </SelectItem>
                            <SelectItem value="inactive">
                              <span className="flex items-center gap-1.5">
                                <XCircle className="w-3.5 h-3.5 text-red-600" />
                                Inactif
                              </span>
                            </SelectItem>
                            <SelectItem value="coming_soon">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-orange-600" />
                                Bientôt
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {isUpdating && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceTogglePanel;
