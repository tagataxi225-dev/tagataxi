import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Car, Package, ShoppingBag, MapPin, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ServiceConfig {
  service_type: string;
  display_name: string;
  description: string;
  is_active: boolean;
  service_category: string;
}

export function ServiceConfigPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ['service-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_configurations')
        .select('*')
        .order('service_category', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ serviceType, isActive }: { serviceType: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('service_configurations')
        .update({ is_active: isActive })
        .eq('service_type', serviceType);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-configurations'] });
      toast({
        title: "Service mis à jour",
        description: "La configuration du service a été modifiée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le service.",
        variant: "destructive",
      });
    }
  });

  const getIconForCategory = (category: string) => {
    const icons: Record<string, any> = {
      'transport': Car,
      'delivery': Package,
      'marketplace': ShoppingBag,
      'rental': MapPin,
      'other': TrendingUp
    };
    const Icon = icons[category.toLowerCase()] || Car;
    return <Icon className="h-5 w-5" />;
  };

  const groupedServices = services?.reduce((acc, service) => {
    if (!acc[service.service_category]) {
      acc[service.service_category] = [];
    }
    acc[service.service_category].push(service);
    return acc;
  }, {} as Record<string, typeof services>);

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuration des Services</h2>
        <p className="text-muted-foreground">
          Activez ou désactivez les services disponibles sur la plateforme
        </p>
      </div>

      {groupedServices && Object.entries(groupedServices).map(([category, categoryServices]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="capitalize">{category}</CardTitle>
            <CardDescription>
              Services de {category.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryServices.map((service) => (
              <div key={service.service_type} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getIconForCategory(category)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{service.display_name}</h4>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`service-${service.service_type}`}>
                    {service.is_active ? "Actif" : "Inactif"}
                  </Label>
                  <Switch
                    id={`service-${service.service_type}`}
                    checked={service.is_active}
                    onCheckedChange={(checked) => 
                      updateServiceMutation.mutate({
                        serviceType: service.service_type,
                        isActive: checked
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
