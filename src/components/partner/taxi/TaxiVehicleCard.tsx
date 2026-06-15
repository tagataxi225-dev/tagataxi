
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, UserCheck, Building2, User, Users, Shield, AlertTriangle, FileCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TaxiVehicle, usePartnerTaxiVehicles } from "@/hooks/usePartnerTaxiVehicles";
import { useIsMobile } from "@/hooks/use-mobile";
import { VehicleAssignmentDialog } from "./VehicleAssignmentDialog";

export default function TaxiVehicleCard({
  vehicle,
  onEdit,
}: {
  vehicle: TaxiVehicle;
  onEdit: (v: TaxiVehicle) => void;
}) {
  const { deleteVehicle, assignDriverToVehicle } = usePartnerTaxiVehicles();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce taxi ?")) return;
    await deleteVehicle.mutateAsync(vehicle.id);
    toast({ title: "Taxi supprimé avec succès" });
  };

  const statusConfig = {
    approved: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", label: "Vérifié", icon: <Shield className="w-3 h-3" /> },
    rejected: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800", label: "Rejeté", icon: <AlertTriangle className="w-3 h-3" /> },
    pending: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", label: "En attente", icon: <FileCheck className="w-3 h-3" /> }
  };

  const ownershipConfig = {
    partner: { icon: <Building2 className="w-3.5 h-3.5" />, label: "Partenaire", color: "text-primary" },
    driver: { icon: <User className="w-3.5 h-3.5" />, label: "Chauffeur", color: "text-blue-600 dark:text-blue-400" },
    third_party: { icon: <Users className="w-3.5 h-3.5" />, label: "Tiers", color: "text-violet-600 dark:text-violet-400" }
  };

  const status = vehicle.moderation_status === "approved" ? "approved" : 
                 vehicle.moderation_status === "rejected" ? "rejected" : "pending";
  const ownership = ownershipConfig[vehicle.ownership_type || "partner"];
  const sc = statusConfig[status];

  return (
    <Card className="group rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <CardContent className={`${isMobile ? 'p-4' : 'p-5'} space-y-4`}>
        
        {/* ===== PLAQUE D'IMMATRICULATION - MISE EN AVANT ===== */}
        <div className="flex items-center justify-between gap-3">
          <div className="bg-muted border-2 border-foreground/20 rounded-lg px-4 py-2 inline-flex items-center gap-2 shadow-sm">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <span className="font-mono font-extrabold text-foreground tracking-[0.2em] text-lg uppercase">
              {vehicle.license_plate}
            </span>
          </div>
          <Badge className={`${sc.bg} ${sc.text} ${sc.border} border rounded-full px-2.5 py-1 text-xs font-medium flex items-center gap-1`}>
            {sc.icon} {sc.label}
          </Badge>
        </div>

        {/* ===== NOM + MARQUE/MODÈLE ===== */}
        <div>
          <h3 className={`font-bold text-card-foreground ${isMobile ? 'text-base' : 'text-lg'} leading-tight`}>
            {vehicle.name}
          </h3>
          <p className="text-muted-foreground text-sm mt-0.5">
            {vehicle.brand} {vehicle.model} • {vehicle.year} • {vehicle.seats} places
            {vehicle.color && <> • {vehicle.color}</>}
          </p>
        </div>

        {/* ===== INFOS GRILLE ===== */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/50 rounded-xl p-2.5">
            <div className="text-muted-foreground text-xs mb-0.5">Classe</div>
            <div className="font-semibold text-card-foreground text-sm capitalize">
              {vehicle.vehicle_class === "first_class" ? "1ère Classe" : vehicle.vehicle_class || "—"}
            </div>
          </div>
          <div className="bg-muted/50 rounded-xl p-2.5">
            <div className="text-muted-foreground text-xs mb-0.5">Propriété</div>
            <div className={`font-semibold text-sm flex items-center gap-1 ${ownership.color}`}>
              {ownership.icon} {ownership.label}
            </div>
          </div>
        </div>

        {/* ===== OWNER TIERS ===== */}
        {vehicle.ownership_type === "third_party" && vehicle.owner_name && (
          <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-2.5">
            <div className="text-violet-700 dark:text-violet-400 text-xs font-medium">
              Propriétaire : {vehicle.owner_name}
              {vehicle.owner_phone && <span className="ml-2">• {vehicle.owner_phone}</span>}
            </div>
          </div>
        )}

        {/* ===== CHASSIS + DOCUMENTS ===== */}
        {vehicle.chassis_number && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Châssis :</span> <span className="font-mono">{vehicle.chassis_number}</span>
          </div>
        )}

        {/* ===== REJECTION REASON ===== */}
        {status === "rejected" && vehicle.rejection_reason && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-2.5">
            <div className="text-red-700 dark:text-red-400 text-xs">
              <span className="font-semibold">Motif :</span> {vehicle.rejection_reason}
            </div>
          </div>
        )}

        {/* ===== CHAUFFEUR ASSIGNÉ ===== */}
        {vehicle.assigned_driver_id && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              Chauffeur assigné
            </span>
          </div>
        )}

        {/* ===== ACTIONS ===== */}
        <div className={`flex gap-2 pt-1 ${isMobile ? 'flex-col' : 'flex-row'}`}>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAssignDialog(true)}
            className="rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all flex-1"
          >
            <UserCheck className="w-4 h-4 mr-1.5" /> 
            {vehicle.assigned_driver_id ? 'Réassigner' : 'Assigner'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(vehicle)}
            className="rounded-xl hover:bg-muted transition-all flex-1"
          >
            <Edit className="w-4 h-4 mr-1.5" /> Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all flex-1"
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Supprimer
          </Button>
        </div>
      </CardContent>

      <VehicleAssignmentDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        vehicleId={vehicle.id}
        vehicleName={vehicle.name}
        currentDriverId={vehicle.assigned_driver_id}
        onAssign={async (driverId) => {
          await assignDriverToVehicle.mutateAsync({ vehicleId: vehicle.id, driverId });
        }}
      />
    </Card>
  );
}
