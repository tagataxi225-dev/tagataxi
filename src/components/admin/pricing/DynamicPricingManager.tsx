import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { MapPin, TrendingUp, Zap, RefreshCw, Pencil, Plane, Crown, Building2, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const CITIES = [
  { value: "Kinshasa", label: "🇨🇩 Kinshasa" },
  { value: "Lubumbashi", label: "🇨🇩 Lubumbashi" },
  { value: "Kolwezi", label: "🇨🇩 Kolwezi" },
  { value: "Abidjan", label: "🇨🇮 Abidjan" },
];

const ZONE_TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof MapPin }> = {
  airport: { label: "Aéroport", color: "bg-sky-100 text-sky-700 border-sky-200", icon: Plane },
  premium: { label: "Premium", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Crown },
  standard: { label: "Standard", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: MapPin },
  commercial: { label: "Commercial", color: "bg-violet-100 text-violet-700 border-violet-200", icon: ShoppingBag },
  industrial: { label: "Industriel", color: "bg-slate-100 text-slate-700 border-slate-200", icon: Building2 },
};

const DEMAND_LABELS: Record<string, { label: string; color: string }> = {
  very_high: { label: "Très haute", color: "text-red-600" },
  high: { label: "Haute", color: "text-orange-600" },
  moderate: { label: "Modérée", color: "text-amber-600" },
  normal: { label: "Normale", color: "text-emerald-600" },
  low: { label: "Faible", color: "text-blue-600" },
};

function getSurgeColor(multiplier: number) {
  if (multiplier <= 1.0) return "bg-emerald-500";
  if (multiplier <= 1.3) return "bg-amber-500";
  return "bg-red-500";
}

function getSurgeLabel(multiplier: number) {
  if (multiplier <= 1.0) return "Normal";
  if (multiplier <= 1.3) return "Modéré";
  return "Élevé";
}

interface ServiceZone {
  id: string;
  name: string;
  city: string;
  zone_type: string;
  is_active: boolean;
  surge_multiplier: number;
  base_price_multiplier: number;
  description: string | null;
  status: string | null;
  updated_at: string;
}

interface EditForm {
  surge_multiplier: string;
  base_price_multiplier: string;
  description: string;
}

export function DynamicPricingManager() {
  const [selectedCity, setSelectedCity] = useState("Kinshasa");
  const [editingZone, setEditingZone] = useState<ServiceZone | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ surge_multiplier: "", base_price_multiplier: "", description: "" });
  const queryClient = useQueryClient();

  const { data: zones = [], isLoading: zonesLoading, refetch: refetchZones } = useQuery({
    queryKey: ["serviceZones", selectedCity],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_zones")
        .select("id, name, city, zone_type, is_active, surge_multiplier, base_price_multiplier, description, status, updated_at")
        .eq("city", selectedCity)
        .order("zone_type")
        .order("name");
      if (error) throw error;
      return data as ServiceZone[];
    },
  });

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["dynamicPricingHistory", selectedCity],
    queryFn: async () => {
      const zoneIds = zones.map((z) => z.id);
      if (zoneIds.length === 0) return [];
      const { data, error } = await supabase
        .from("dynamic_pricing")
        .select("id, zone_id, vehicle_class, surge_multiplier, demand_level, available_drivers, pending_requests, calculated_at")
        .in("zone_id", zoneIds)
        .order("calculated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: zones.length > 0,
  });

  const updateZoneMutation = useMutation({
    mutationFn: async ({ id, surge_multiplier, base_price_multiplier, description }: { id: string; surge_multiplier: number; base_price_multiplier: number; description: string }) => {
      const { error } = await supabase
        .from("service_zones")
        .update({ surge_multiplier, base_price_multiplier, description, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceZones"] });
      setEditingZone(null);
      toast({ title: "Zone mise à jour", description: "Les multiplicateurs ont été sauvegardés." });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de mettre à jour la zone.", variant: "destructive" }),
  });

  const toggleZoneMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("service_zones")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceZones"] });
      toast({ title: "Statut mis à jour" });
    },
  });

  const openEdit = (zone: ServiceZone) => {
    setEditForm({
      surge_multiplier: String(zone.surge_multiplier),
      base_price_multiplier: String(zone.base_price_multiplier),
      description: zone.description || "",
    });
    setEditingZone(zone);
  };

  const handleSave = () => {
    if (!editingZone) return;
    const surge = parseFloat(editForm.surge_multiplier);
    const base = parseFloat(editForm.base_price_multiplier);
    if (isNaN(surge) || surge < 0.5 || surge > 5.0 || isNaN(base) || base < 0.5 || base > 5.0) {
      toast({ title: "Valeur invalide", description: "Les multiplicateurs doivent être entre 0.5 et 5.0.", variant: "destructive" });
      return;
    }
    updateZoneMutation.mutate({ id: editingZone.id, surge_multiplier: surge, base_price_multiplier: base, description: editForm.description });
  };

  const zoneNameById = (id: string) => zones.find((z) => z.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      {/* City selector */}
      <div className="flex items-center gap-3">
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetchZones()} disabled={zonesLoading}>
          <RefreshCw className={`h-4 w-4 ${zonesLoading ? "animate-spin" : ""}`} />
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {zones.length} zone{zones.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Zones list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-amber-500" />
            Zones de tarification
          </CardTitle>
          <CardDescription>Gérez les multiplicateurs de surge et de base par zone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {zonesLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Chargement…</p>
          ) : zones.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Aucune zone configurée pour cette ville</p>
          ) : (
            zones.map((zone) => {
              const cfg = ZONE_TYPE_CONFIG[zone.zone_type] ?? ZONE_TYPE_CONFIG.standard;
              const Icon = cfg.icon;
              return (
                <div key={zone.id} className="flex items-center gap-4 rounded-xl border p-4 hover:bg-accent/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{zone.name}</span>
                      <Badge variant="outline" className={`text-xs border ${cfg.color}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Base: <strong className="text-foreground">×{zone.base_price_multiplier}</strong></span>
                      <span>Surge: <strong className="text-foreground">×{zone.surge_multiplier}</strong></span>
                    </div>
                    {/* Surge bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={Math.min((zone.surge_multiplier / 3) * 100, 100)} className="h-2 flex-1 [&>div]:transition-all" style={{ ["--tw-progress-color" as string]: undefined }}>
                      </Progress>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSurgeColor(zone.surge_multiplier)} text-white`}>
                        {getSurgeLabel(zone.surge_multiplier)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={zone.is_active}
                      onCheckedChange={(checked) => toggleZoneMutation.mutate({ id: zone.id, is_active: checked })}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(zone)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Historique Surge Pricing
          </CardTitle>
          <CardDescription>20 derniers calculs dynamiques</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Chargement…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aucun historique disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Zone</th>
                    <th className="pb-2 font-medium">Classe</th>
                    <th className="pb-2 font-medium">Multi.</th>
                    <th className="pb-2 font-medium">Demande</th>
                    <th className="pb-2 font-medium">Chauffeurs</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => {
                    const demand = DEMAND_LABELS[h.demand_level] ?? { label: h.demand_level, color: "text-foreground" };
                    return (
                      <tr key={h.id} className="border-b last:border-0 hover:bg-accent/20">
                        <td className="py-2 font-medium">{zoneNameById(h.zone_id)}</td>
                        <td className="py-2">{h.vehicle_class}</td>
                        <td className="py-2">
                          <span className={`font-semibold ${h.surge_multiplier > 1.3 ? "text-red-600" : h.surge_multiplier > 1 ? "text-amber-600" : "text-emerald-600"}`}>
                            ×{h.surge_multiplier}
                          </span>
                        </td>
                        <td className={`py-2 font-medium ${demand.color}`}>{demand.label}</td>
                        <td className="py-2">{h.available_drivers}</td>
                        <td className="py-2 text-muted-foreground">{format(new Date(h.calculated_at), "dd MMM HH:mm", { locale: fr })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editingZone} onOpenChange={(open) => !open && setEditingZone(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier — {editingZone?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Multiplicateur Surge (0.5 – 5.0)</Label>
              <Input
                type="number"
                step="0.1"
                min="0.5"
                max="5.0"
                value={editForm.surge_multiplier}
                onChange={(e) => setEditForm((f) => ({ ...f, surge_multiplier: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Multiplicateur Base (0.5 – 5.0)</Label>
              <Input
                type="number"
                step="0.1"
                min="0.5"
                max="5.0"
                value={editForm.base_price_multiplier}
                onChange={(e) => setEditForm((f) => ({ ...f, base_price_multiplier: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optionnel)</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Ex: Zone aéroportuaire haute fréquentation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingZone(null)}>Annuler</Button>
            <Button onClick={handleSave} disabled={updateZoneMutation.isPending}>
              {updateZoneMutation.isPending ? "Sauvegarde…" : "Sauvegarder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
