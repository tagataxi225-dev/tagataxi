import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Percent, Save, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

export const RestaurantCommissionConfig = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [defaultRate, setDefaultRate] = useState<string>("5.00");
  const [serviceFeeRate, setServiceFeeRate] = useState<string>("5.00");
  const [editingRestaurant, setEditingRestaurant] = useState<string | null>(null);
  const [customRate, setCustomRate] = useState<string>("");

  // Fetch commission configuration
  const { data: commissionConfig, isLoading: configLoading } = useQuery({
    queryKey: ['restaurantCommissionConfig'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_commission_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Fetch custom rates
  const { data: customRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['restaurantCustomRates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_custom_commission_rates')
        .select(`
          *,
          restaurant_profiles(restaurant_name, city)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch restaurants without custom rates
  const { data: restaurants, isLoading: restaurantsLoading } = useQuery({
    queryKey: ['restaurantsForCommission'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_profiles')
        .select('id, restaurant_name, city, is_active')
        .eq('is_active', true)
        .order('restaurant_name');

      if (error) throw error;
      return data || [];
    }
  });

  // Update default rate
  const updateDefaultRateMutation = useMutation({
    mutationFn: async (rate: number) => {
      const { error } = await supabase
        .from('restaurant_commission_config')
        .upsert({
          default_commission_rate: rate,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantCommissionConfig'] });
      toast({
        title: "✅ Taux par défaut mis à jour",
        description: `Nouveau taux : ${defaultRate}%`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateServiceFeeMutation = useMutation({
    mutationFn: async (rate: number) => {
      const { error } = await supabase
        .from('restaurant_commission_config')
        .upsert({
          service_fee_rate: rate,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantCommissionConfig'] });
      toast({
        title: "Frais de service mis a jour",
        description: `Nouveau frais : ${serviceFeeRate}%`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSaveServiceFee = () => {
    const rate = parseFloat(serviceFeeRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({ title: "Taux invalide", description: "Entre 0 et 100", variant: "destructive" });
      return;
    }
    updateServiceFeeMutation.mutate(rate);
  };

  // Set custom rate for restaurant
  const setCustomRateMutation = useMutation({
    mutationFn: async ({ restaurantId, rate }: { restaurantId: string; rate: number }) => {
      const { error } = await supabase
        .from('restaurant_custom_commission_rates')
        .upsert({
          restaurant_id: restaurantId,
          custom_commission_rate: rate,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantCustomRates'] });
      queryClient.invalidateQueries({ queryKey: ['restaurantsForCommission'] });
      setEditingRestaurant(null);
      setCustomRate("");
      toast({
        title: "✅ Taux personnalisé défini",
        description: "Configuration enregistrée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSaveDefaultRate = () => {
    const rate = parseFloat(defaultRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        title: "❌ Taux invalide",
        description: "Le taux doit être entre 0 et 100%",
        variant: "destructive",
      });
      return;
    }
    updateDefaultRateMutation.mutate(rate);
  };

  const handleSaveCustomRate = (restaurantId: string) => {
    const rate = parseFloat(customRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        title: "❌ Taux invalide",
        description: "Le taux doit être entre 0 et 100%",
        variant: "destructive",
      });
      return;
    }
    setCustomRateMutation.mutate({ restaurantId, rate });
  };

  const isLoading = configLoading || ratesLoading || restaurantsLoading;

  return (
    <div className="space-y-6">
      {/* Default Commission Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Taux de Commission Par Défaut
          </CardTitle>
          <CardDescription>
            Appliqué à tous les restaurants sans taux personnalisé
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex items-end gap-4">
              <div className="flex-1 max-w-xs">
                <Label htmlFor="defaultRate">Taux de commission (%)</Label>
                <Input
                  id="defaultRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(e.target.value)}
                  placeholder="5.00"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Taux actuel : {commissionConfig?.default_commission_rate || 5.00}%
                </p>
              </div>
              <Button
                onClick={handleSaveDefaultRate}
                disabled={updateDefaultRateMutation.isPending}
              >
                {updateDefaultRateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Frais de service client */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Frais de Service Client
          </CardTitle>
          <CardDescription>
            Frais ajoute a la note du client sur chaque commande food
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex items-end gap-4">
              <div className="flex-1 max-w-xs">
                <Label htmlFor="serviceFeeRate">Frais de service (%)</Label>
                <Input
                  id="serviceFeeRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={serviceFeeRate}
                  onChange={(e) => setServiceFeeRate(e.target.value)}
                  placeholder="5.00"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Taux actuel : {commissionConfig?.service_fee_rate ?? 5.00}%
                </p>
              </div>
              <Button
                onClick={handleSaveServiceFee}
                disabled={updateServiceFeeMutation.isPending}
              >
                {updateServiceFeeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Taux Personnalisés par Restaurant
          </CardTitle>
          <CardDescription>
            Configurer des taux de commission spécifiques pour certains restaurants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Existing Custom Rates */}
              {customRates && customRates.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Taux Actifs</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Restaurant</TableHead>
                        <TableHead>Ville</TableHead>
                        <TableHead>Taux Personnalisé</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customRates.map((rate) => (
                        <TableRow key={rate.id}>
                          <TableCell className="font-medium">
                            {rate.restaurant_profiles?.restaurant_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {rate.restaurant_profiles?.city}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">
                              {rate.custom_commission_rate}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingRestaurant(rate.restaurant_id);
                                setCustomRate(rate.custom_commission_rate.toString());
                              }}
                            >
                              Modifier
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Add New Custom Rate */}
              <div>
                <h4 className="text-sm font-semibold mb-3">
                  Ajouter un Taux Personnalisé
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead>Taux Actuel</TableHead>
                      <TableHead>Nouveau Taux (%)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restaurants?.filter(r => !customRates?.some(cr => cr.restaurant_id === r.id)).map((restaurant) => (
                      <TableRow key={restaurant.id}>
                        <TableCell className="font-medium">
                          {restaurant.restaurant_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{restaurant.city}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {commissionConfig?.default_commission_rate || 5.00}% (défaut)
                          </span>
                        </TableCell>
                        <TableCell>
                          {editingRestaurant === restaurant.id && (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={customRate}
                              onChange={(e) => setCustomRate(e.target.value)}
                              placeholder="Ex: 3.50"
                              className="w-24"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRestaurant === restaurant.id ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveCustomRate(restaurant.id)}
                                disabled={setCustomRateMutation.isPending}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Sauver
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingRestaurant(null);
                                  setCustomRate("");
                                }}
                              >
                                Annuler
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingRestaurant(restaurant.id);
                                setCustomRate(commissionConfig?.default_commission_rate?.toString() || "5.00");
                              }}
                            >
                              Définir taux
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
