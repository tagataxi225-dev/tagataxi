import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  TrendingDown, 
  ArrowRight, 
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeprecationStats {
  totalDrivers: number;
  migrated: number;
  pending: number;
  failed: number;
}

export const CommissionDeprecationBanner = () => {
  const [stats, setStats] = useState<DeprecationStats>({
    totalDrivers: 150,
    migrated: 120,
    pending: 25,
    failed: 5,
  });
  const { toast } = useToast();

  const migrationProgress = (stats.migrated / stats.totalDrivers) * 100;

  const handleMigrateDriver = async () => {
    toast({
      title: "Migration en cours",
      description: "La migration des chauffeurs vers le système d'abonnement est en cours...",
    });
    
    // TODO: Implémenter la logique de migration réelle
    // Pour l'instant, c'est une simulation
  };

  return (
    <div className="space-y-4">
      {/* Banner principal d'alerte */}
      <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <AlertTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2">
          ⚠️ Système de Commissions en cours de Dépréciation
          <Badge variant="outline" className="border-orange-500 text-orange-700">
            Migration Active
          </Badge>
        </AlertTitle>
        <AlertDescription className="text-orange-700 dark:text-orange-300 space-y-2">
          <p>
            Le système de commissions est progressivement remplacé par le nouveau système d'abonnements par tickets. 
            Cette transition permet aux chauffeurs de mieux contrôler leurs coûts et d'avoir une tarification transparente.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <TrendingDown className="h-4 w-4" />
            <span className="font-medium">
              Les commissions seront complètement désactivées d'ici le 31 décembre 2025
            </span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Carte de progression de migration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progression de la Migration</span>
            <Badge 
              variant={migrationProgress >= 100 ? "default" : "secondary"}
              className="text-lg px-4"
            >
              {Math.round(migrationProgress)}%
            </Badge>
          </CardTitle>
          <CardDescription>
            Transition des chauffeurs du système de commissions vers les abonnements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Barre de progression */}
          <div className="space-y-2">
            <Progress value={migrationProgress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{stats.migrated} chauffeurs migrés</span>
              <span>{stats.totalDrivers} total</span>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Migrés
                  </span>
                </div>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {stats.migrated}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Abonnements actifs
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    En attente
                  </span>
                </div>
                <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
                  {stats.pending}
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Migration planifiée
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50 dark:bg-red-950">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    Échecs
                  </span>
                </div>
                <div className="text-3xl font-bold text-red-700 dark:text-red-300">
                  {stats.failed}
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Nécessitent intervention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleMigrateDriver} className="flex-1">
              <ArrowRight className="h-4 w-4 mr-2" />
              Migrer les chauffeurs en attente
            </Button>
            <Button variant="outline" className="flex-1">
              Voir les détails de migration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline de dépréciation */}
      <Card>
        <CardHeader>
          <CardTitle>Calendrier de Dépréciation</CardTitle>
          <CardDescription>
            Étapes clés de la transition vers le système d'abonnements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Phase 1 : Lancement (Complété)</div>
                <p className="text-sm text-muted-foreground">
                  Mise en place du système d'abonnements et migration des premiers chauffeurs volontaires
                </p>
                <Badge variant="outline" className="mt-1">Septembre 2025</Badge>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Phase 2 : Migration de masse (En cours)</div>
                <p className="text-sm text-muted-foreground">
                  Migration progressive de tous les chauffeurs actifs vers les abonnements
                </p>
                <Badge variant="secondary" className="mt-1">Octobre - Novembre 2025</Badge>
              </div>
            </div>

            <div className="flex items-start gap-4 opacity-60">
              <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Phase 3 : Arrêt définitif des commissions</div>
                <p className="text-sm text-muted-foreground">
                  Désactivation complète du système de commissions et passage 100% abonnements
                </p>
                <Badge variant="outline" className="mt-1">31 Décembre 2025</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
