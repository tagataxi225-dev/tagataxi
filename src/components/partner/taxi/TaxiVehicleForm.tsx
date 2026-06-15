
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TaxiVehicle, usePartnerTaxiVehicles } from "@/hooks/usePartnerTaxiVehicles";
import { Building2, User, Users, Save, X } from "lucide-react";

const VEHICLE_CLASS_OPTIONS = [
  { value: "moto",        label: "Moto-taxi",       icon: "🛵", desc: "Moto ou scooter" },
  { value: "eco",         label: "Économique",       icon: "🚗", desc: "Voiture entrée de gamme" },
  { value: "standard",   label: "Standard",          icon: "🚙", desc: "Berline confort" },
  { value: "premium",    label: "Premium",            icon: "🚘", desc: "Voiture haut de gamme" },
  { value: "first_class",label: "Première Classe",   icon: "🌟", desc: "Berline luxe" },
  { value: "bus",        label: "Bus / Minibus",      icon: "🚌", desc: "Transport collectif" },
];

interface Props {
  initial?: Partial<TaxiVehicle>;
  onSaved?: () => void;
}

export default function TaxiVehicleForm({ initial, onSaved }: Props) {
  const { createVehicle, updateVehicle } = usePartnerTaxiVehicles();
  const { toast } = useToast();

  const [values, setValues] = useState<Partial<TaxiVehicle>>({
    name: initial?.name || "",
    brand: initial?.brand || "",
    model: initial?.model || "",
    year: initial?.year || new Date().getFullYear(),
    vehicle_class: initial?.vehicle_class || "eco",
    requested_classes: initial?.requested_classes?.length
      ? initial.requested_classes
      : initial?.vehicle_class
        ? [initial.vehicle_class]
        : [],
    color: initial?.color || "",
    seats: initial?.seats || 4,
    images: initial?.images || [],
    license_plate: initial?.license_plate || "",
    ownership_type: initial?.ownership_type || "partner",
    owner_name: initial?.owner_name || "",
    owner_phone: initial?.owner_phone || "",
    chassis_number: initial?.chassis_number || "",
    insurance_expiry: initial?.insurance_expiry || "",
    inspection_expiry: initial?.inspection_expiry || "",
  });

  const toggleClass = (cls: string) => {
    setValues((prev) => {
      const current = prev.requested_classes || [];
      const updated = current.includes(cls)
        ? current.filter((c) => c !== cls)
        : [...current, cls];
      return { ...prev, requested_classes: updated };
    });
  };

  const isEditing = !!initial?.id;

  const handleChange = (key: keyof TaxiVehicle, v: any) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const handleSubmit = async () => {
    if (!values.name || !values.brand || !values.model || !values.license_plate) {
      toast({ title: "Champs requis manquants", description: "Nom, Marque, Modèle et Immatriculation sont requis", variant: "destructive" });
      return;
    }

    const requested = values.requested_classes || [];
    if (requested.length === 0) {
      toast({ title: "Type de véhicule requis", description: "Sélectionnez au moins un type de véhicule", variant: "destructive" });
      return;
    }

    const payload: Partial<TaxiVehicle> = {
      ...values,
      requested_classes: requested,
      vehicle_class: requested[0],
      images: (values.images || []) as string[],
      color: values.color || null,
      chassis_number: values.chassis_number || null,
      insurance_expiry: values.insurance_expiry || null,
      inspection_expiry: values.inspection_expiry || null,
      owner_name: values.owner_name || null,
      owner_phone: values.owner_phone || null,
      is_active: true,
      is_available: true,
      moderation_status: isEditing ? initial?.moderation_status : "pending",
    };

    try {
      if (isEditing && initial?.id) {
        await updateVehicle.mutateAsync({ id: initial.id, updates: payload });
        toast({ title: "Véhicule mis à jour avec succès" });
      } else {
        const { data: existing } = await supabase
          .from("partner_taxi_vehicles")
          .select("id")
          .eq("license_plate", values.license_plate as string)
          .maybeSingle();
        if (existing) {
          toast({ title: "Plaque déjà enregistrée", description: "Cette plaque d'immatriculation existe déjà dans le système.", variant: "destructive" });
          return;
        }
        await createVehicle.mutateAsync(payload);
        toast({ title: "Véhicule ajouté (en attente de validation admin)" });
      }
      onSaved?.();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const ownershipOptions = [
    { value: "partner", label: "Partenaire", icon: <Building2 className="w-4 h-4" />, desc: "Le véhicule vous appartient" },
    { value: "driver", label: "Chauffeur", icon: <User className="w-4 h-4" />, desc: "Le véhicule appartient au chauffeur" },
    { value: "third_party", label: "Tierce personne", icon: <Users className="w-4 h-4" />, desc: "Le véhicule appartient à un tiers" },
  ];

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">{children}</h4>
  );

  return (
    <Card className="rounded-2xl border-0 shadow-md bg-card">
      <CardContent className="p-5 space-y-6">

        {/* ===== PLAQUE D'IMMATRICULATION - CHAMP VEDETTE ===== */}
        <div>
          <SectionTitle>🚗 Plaque d'immatriculation *</SectionTitle>
          <div className="bg-muted border-2 border-foreground/20 rounded-xl p-4 text-center">
            <Input
              className="text-center font-mono font-extrabold text-2xl tracking-[0.25em] uppercase border-0 bg-transparent focus-visible:ring-0 h-auto py-1"
              value={values.license_plate as string}
              onChange={(e) => handleChange("license_plate", e.target.value.toUpperCase())}
              placeholder="AB 123 CD"
            />
          </div>
        </div>

        {/* ===== INFORMATIONS VÉHICULE ===== */}
        <div>
          <SectionTitle>📋 Informations véhicule</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nom du véhicule *</label>
              <Input className="mt-1 rounded-xl" value={values.name as string} onChange={(e) => handleChange("name", e.target.value)} placeholder="Ex: Toyota Corolla Blanc" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Marque *</label>
              <Input className="mt-1 rounded-xl" value={values.brand as string} onChange={(e) => handleChange("brand", e.target.value)} placeholder="Toyota" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Modèle *</label>
              <Input className="mt-1 rounded-xl" value={values.model as string} onChange={(e) => handleChange("model", e.target.value)} placeholder="Corolla" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Année</label>
              <Input type="number" className="mt-1 rounded-xl" value={values.year as number} onChange={(e) => handleChange("year", Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Couleur</label>
              <Input className="mt-1 rounded-xl" value={values.color as string} onChange={(e) => handleChange("color", e.target.value)} placeholder="Blanc" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Places</label>
              <Input type="number" className="mt-1 rounded-xl" value={values.seats as number} onChange={(e) => handleChange("seats", Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">N° de châssis (VIN)</label>
              <Input className="mt-1 rounded-xl font-mono text-sm" value={values.chassis_number as string} onChange={(e) => handleChange("chassis_number", e.target.value.toUpperCase())} placeholder="Optionnel" />
            </div>
          </div>
        </div>

        {/* ===== TYPES DE VÉHICULE ===== */}
        <div>
          <SectionTitle>🚦 Types de véhicule proposés *</SectionTitle>
          <p className="text-xs text-muted-foreground mb-3">
            Cochez tous les types applicables. Chaque type sera validé individuellement par l'administration.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VEHICLE_CLASS_OPTIONS.map((opt) => {
              const checked = (values.requested_classes || []).includes(opt.value);
              const approved = (initial?.approved_classes || []).includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 bg-card"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleClass(opt.value)}
                    className="shrink-0"
                  />
                  <span className="text-xl">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                      {approved && (
                        <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                          ✓ Approuvé
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{opt.desc}</span>
                  </div>
                </label>
              );
            })}
          </div>
          {(values.requested_classes || []).length === 0 && (
            <p className="text-xs text-destructive mt-2">Sélectionnez au moins un type</p>
          )}
        </div>

        {/* ===== PROPRIÉTÉ DU VÉHICULE ===== */}
        <div>
          <SectionTitle>🏠 Propriété du véhicule</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ownershipOptions.map((opt) => {
              const selected = values.ownership_type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange("ownership_type", opt.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 bg-card"
                  }`}
                >
                  <div className={`${selected ? "text-primary" : "text-muted-foreground"}`}>{opt.icon}</div>
                  <div>
                    <div className={`text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {values.ownership_type === "third_party" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 p-3 bg-violet-50 dark:bg-violet-950/20 rounded-xl border border-violet-200 dark:border-violet-800">
              <div>
                <label className="text-xs font-medium text-violet-700 dark:text-violet-400">Nom du propriétaire</label>
                <Input className="mt-1 rounded-xl" value={values.owner_name as string} onChange={(e) => handleChange("owner_name", e.target.value)} placeholder="Nom complet" />
              </div>
              <div>
                <label className="text-xs font-medium text-violet-700 dark:text-violet-400">Téléphone du propriétaire</label>
                <Input className="mt-1 rounded-xl" value={values.owner_phone as string} onChange={(e) => handleChange("owner_phone", e.target.value)} placeholder="+243..." />
              </div>
            </div>
          )}
        </div>

        {/* ===== DOCUMENTS & ASSURANCE ===== */}
        <div>
          <SectionTitle>📄 Documents & Assurance</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Expiration assurance</label>
              <Input type="date" className="mt-1 rounded-xl" value={values.insurance_expiry as string} onChange={(e) => handleChange("insurance_expiry", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Expiration contrôle technique</label>
              <Input type="date" className="mt-1 rounded-xl" value={values.inspection_expiry as string} onChange={(e) => handleChange("inspection_expiry", e.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs font-medium text-muted-foreground">Images du véhicule (URLs séparées par des virgules)</label>
            <Input
              className="mt-1 rounded-xl"
              value={(values.images as string[])?.join(", ") || ""}
              onChange={(e) =>
                handleChange("images", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
              }
              placeholder="https://..."
            />
          </div>
        </div>

        {/* ===== ACTIONS ===== */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onSaved?.()} className="rounded-xl">
            <X className="w-4 h-4 mr-1.5" /> Annuler
          </Button>
          <Button onClick={handleSubmit} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
            <Save className="w-4 h-4 mr-1.5" /> {isEditing ? "Mettre à jour" : "Ajouter le véhicule"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
