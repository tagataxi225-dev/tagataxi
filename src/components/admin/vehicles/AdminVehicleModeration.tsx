
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Shield, Clock, CheckCircle, XCircle, Car, Search, Building2, User, Users } from "lucide-react";

const CLASS_LABELS: Record<string, string> = {
  moto:        "🛵 Moto-taxi",
  eco:         "🚗 Économique",
  standard:    "🚙 Standard",
  premium:     "🚘 Premium",
  first_class: "🌟 Première Classe",
  bus:         "🚌 Bus / Minibus",
};

interface VehicleRow {
  id: string;
  partner_id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  vehicle_class: string;
  color: string | null;
  seats: number;
  license_plate: string;
  chassis_number: string | null;
  ownership_type: string;
  owner_name: string | null;
  owner_phone: string | null;
  insurance_expiry: string | null;
  inspection_expiry: string | null;
  document_urls: any;
  images: any;
  moderation_status: string;
  rejection_reason: string | null;
  admin_notes: string | null;
  approved_at: string | null;
  requested_classes: string[] | null;
  approved_classes: string[] | null;
  created_at: string;
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export const AdminVehicleModeration: React.FC = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [search, setSearch] = useState("");
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [approvedSelection, setApprovedSelection] = useState<Record<string, string[]>>({});

  const getApprovedSelection = (v: VehicleRow): string[] => {
    if (approvedSelection[v.id] !== undefined) return approvedSelection[v.id];
    const requested = Array.isArray(v.requested_classes) && v.requested_classes.length
      ? v.requested_classes
      : v.vehicle_class ? [v.vehicle_class] : [];
    return requested;
  };

  const toggleApprovalClass = (vehicleId: string, cls: string, allClasses: string[]) => {
    setApprovedSelection(prev => {
      const current = prev[vehicleId] ?? allClasses;
      const updated = current.includes(cls)
        ? current.filter(c => c !== cls)
        : [...current, cls];
      return { ...prev, [vehicleId]: updated };
    });
  };

  const { data: vehicles = [], isLoading } = useQuery<VehicleRow[]>({
    queryKey: ["admin-taxi-vehicles", filter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("partner_taxi_vehicles")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("moderation_status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({
      vehicleId, action, reason, notes, approvedClasses,
    }: {
      vehicleId: string;
      action: "approve" | "reject";
      reason?: string;
      notes?: string;
      approvedClasses?: string[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const adminId = userData.user?.id;

      const updates: any = {
        moderation_status: action === "approve" ? "approved" : "rejected",
        admin_notes: notes || null,
        approved_at: action === "approve" ? new Date().toISOString() : null,
        approved_by: action === "approve" ? adminId : null,
        rejection_reason: action === "reject" ? (reason || "Non spécifié") : null,
      };

      if (action === "approve" && approvedClasses) {
        updates.approved_classes = approvedClasses;
        updates.vehicle_class = approvedClasses[0] || null;
      }

      const { error } = await (supabase as any)
        .from("partner_taxi_vehicles")
        .update(updates)
        .eq("id", vehicleId);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-taxi-vehicles"] });
      const label = vars.action === "approve"
        ? `Véhicule approuvé ✓ (${vars.approvedClasses?.length || 0} type(s))`
        : "Véhicule rejeté";
      toast({ title: label });
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    },
  });

  const filtered = vehicles.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.name?.toLowerCase().includes(q) ||
      v.license_plate?.toLowerCase().includes(q) ||
      v.brand?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q)
    );
  });

  const statusBadge = (s: string) => {
    const cfg: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      approved: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", icon: <CheckCircle className="w-3 h-3" />, label: "Approuvé" },
      rejected: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", icon: <XCircle className="w-3 h-3" />, label: "Rejeté" },
      pending: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", icon: <Clock className="w-3 h-3" />, label: "En attente" },
    };
    const c = cfg[s] || cfg.pending;
    return (
      <Badge className={`${c.bg} ${c.text} border-0 rounded-full px-2.5 py-1 text-xs font-medium flex items-center gap-1`}>
        {c.icon} {c.label}
      </Badge>
    );
  };

  const ownershipIcon = (type: string) => {
    if (type === "driver") return <User className="w-3.5 h-3.5 text-blue-500" />;
    if (type === "third_party") return <Users className="w-3.5 h-3.5 text-violet-500" />;
    return <Building2 className="w-3.5 h-3.5 text-primary" />;
  };

  const counts = {
    all: vehicles.length,
    pending: vehicles.filter(v => v.moderation_status === "pending").length,
    approved: vehicles.filter(v => v.moderation_status === "approved").length,
    rejected: vehicles.filter(v => v.moderation_status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Modération des véhicules</h2>
          <p className="text-sm text-muted-foreground">Vérifiez et validez les véhicules des partenaires</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "approved", "rejected"] as FilterStatus[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="rounded-xl text-xs"
            >
              {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "approved" ? "Approuvés" : "Rejetés"}
              <span className="ml-1.5 bg-background/20 text-xs px-1.5 py-0.5 rounded-full">{counts[f]}</span>
            </Button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher plaque, marque..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {/* Vehicle list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Car className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun véhicule trouvé</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((v) => (
            <Card key={v.id} className="rounded-2xl border border-border/50">
              <CardContent className={`${isMobile ? 'p-4' : 'p-5'} space-y-4`}>
                <div className="flex items-start justify-between gap-3">
                  {/* Plaque */}
                  <div className="flex items-center gap-3">
                    <div className="bg-muted border-2 border-foreground/20 rounded-lg px-3 py-1.5 shadow-sm">
                      <span className="font-mono font-extrabold text-foreground tracking-[0.15em] text-base uppercase">
                        {v.license_plate}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{v.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {v.brand} {v.model} • {v.year} • {v.seats}pl
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ownershipIcon(v.ownership_type)}
                    {statusBadge(v.moderation_status)}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-muted/50 rounded-lg p-2 col-span-2 sm:col-span-4">
                    <span className="text-muted-foreground block mb-1">Types demandés :</span>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(v.requested_classes) && v.requested_classes.length
                        ? v.requested_classes
                        : [v.vehicle_class]
                      ).map(cls => (
                        <span key={cls} className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-medium">
                          {CLASS_LABELS[cls] ?? cls}
                        </span>
                      ))}
                    </div>
                    {Array.isArray(v.approved_classes) && v.approved_classes.length > 0 && (
                      <div className="mt-1.5">
                        <span className="text-muted-foreground block mb-1">Types approuvés :</span>
                        <div className="flex flex-wrap gap-1">
                          {v.approved_classes.map(cls => (
                            <span key={cls} className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-xs font-medium">
                              ✓ {CLASS_LABELS[cls] ?? cls}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <span className="text-muted-foreground">Couleur:</span>{" "}
                    <span className="font-medium">{v.color || "—"}</span>
                  </div>
                  {v.chassis_number && (
                    <div className="bg-muted/50 rounded-lg p-2 col-span-2">
                      <span className="text-muted-foreground">Châssis:</span>{" "}
                      <span className="font-mono font-medium">{v.chassis_number}</span>
                    </div>
                  )}
                  {v.insurance_expiry && (
                    <div className="bg-muted/50 rounded-lg p-2">
                      <span className="text-muted-foreground">Assurance:</span>{" "}
                      <span className="font-medium">{v.insurance_expiry}</span>
                    </div>
                  )}
                  {v.ownership_type === "third_party" && v.owner_name && (
                    <div className="bg-violet-50 dark:bg-violet-950/20 rounded-lg p-2 col-span-2">
                      <span className="text-violet-600">Propriétaire:</span>{" "}
                      <span className="font-medium">{v.owner_name} {v.owner_phone && `• ${v.owner_phone}`}</span>
                    </div>
                  )}
                </div>

                {/* Admin actions for pending */}
                {v.moderation_status === "pending" && (() => {
                  const requested = Array.isArray(v.requested_classes) && v.requested_classes.length
                    ? v.requested_classes
                    : v.vehicle_class ? [v.vehicle_class] : [];
                  const selection = getApprovedSelection(v);
                  return (
                    <div className="space-y-3 pt-2 border-t border-border">
                      {/* Types à approuver */}
                      {requested.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Types à approuver :
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {requested.map(cls => (
                              <label
                                key={cls}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 cursor-pointer transition-all text-xs font-medium select-none ${
                                  selection.includes(cls)
                                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                                    : "border-border bg-muted/30 text-muted-foreground"
                                }`}
                              >
                                <Checkbox
                                  checked={selection.includes(cls)}
                                  onCheckedChange={() => toggleApprovalClass(v.id, cls, requested)}
                                  className="h-3.5 w-3.5"
                                />
                                {CLASS_LABELS[cls] ?? cls}
                              </label>
                            ))}
                          </div>
                          {selection.length === 0 && (
                            <p className="text-xs text-amber-600 mt-1">
                              Sélectionnez au moins un type pour approuver
                            </p>
                          )}
                        </div>
                      )}

                      <Textarea
                        placeholder="Notes admin (optionnel)..."
                        value={adminNotes[v.id] || ""}
                        onChange={(e) => setAdminNotes((p) => ({ ...p, [v.id]: e.target.value }))}
                        className="rounded-xl text-sm min-h-[60px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            moderateMutation.mutate({
                              vehicleId: v.id,
                              action: "approve",
                              notes: adminNotes[v.id],
                              approvedClasses: selection,
                            })
                          }
                          disabled={moderateMutation.isPending || selection.length === 0}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Approuver ({selection.length})
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const reason = rejectionReason[v.id] || prompt("Motif du rejet :");
                            if (reason) {
                              moderateMutation.mutate({ vehicleId: v.id, action: "reject", reason, notes: adminNotes[v.id] });
                            }
                          }}
                          disabled={moderateMutation.isPending}
                          className="rounded-xl flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" /> Rejeter
                        </Button>
                      </div>
                    </div>
                  );
                })()}

                {/* Show rejection reason for rejected */}
                {v.moderation_status === "rejected" && v.rejection_reason && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-700 dark:text-red-400">
                    <span className="font-semibold">Motif :</span> {v.rejection_reason}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
