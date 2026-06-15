import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Radio, Clock, MapPin, User, Car, CheckCircle, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export const DispatchMonitoringPanel = () => {
  // Fetch dispatch logs from edge function logs
  const { data: dispatchLogs, isLoading } = useQuery({
    queryKey: ['adminDispatchLogs'],
    queryFn: async () => {
      // Fetch recent transport bookings with basic data only
      const { data, error } = await supabase
        .from('transport_bookings')
        .select('id, status, created_at, driver_assigned_at, driver_id')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000 // Refresh every 15s
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "En attente", variant: "secondary" as const, icon: Clock },
      searching_driver: { label: "Recherche chauffeur", variant: "default" as const, icon: Radio },
      driver_assigned: { label: "Chauffeur assigné", variant: "default" as const, icon: CheckCircle },
      confirmed: { label: "Confirmé", variant: "default" as const, icon: CheckCircle },
      in_progress: { label: "En cours", variant: "default" as const, icon: Car },
      completed: { label: "Complété", variant: "default" as const, icon: CheckCircle },
      cancelled: { label: "Annulé", variant: "destructive" as const, icon: XCircle }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Calculate dispatch stats
  const stats = dispatchLogs?.reduce((acc, log) => {
    acc.total++;
    if (log.status === 'driver_assigned' || log.status === 'confirmed') acc.assigned++;
    if (log.status === 'pending' || log.status === 'searching_driver') acc.pending++;
    if (log.driver_assigned_at) {
      const assignTime = new Date(log.driver_assigned_at).getTime() - new Date(log.created_at).getTime();
      acc.totalAssignTime += assignTime;
      acc.assignedCount++;
    }
    return acc;
  }, { total: 0, assigned: 0, pending: 0, totalAssignTime: 0, assignedCount: 0 });

  const avgAssignTime = stats && stats.assignedCount > 0 
    ? Math.round(stats.totalAssignTime / stats.assignedCount / 1000 / 60) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dispatches</CardTitle>
            <Radio className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Dernières 50 courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chauffeurs Assignés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.assigned || 0}</div>
            <p className="text-xs text-muted-foreground">Avec succès</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Sans chauffeur</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{avgAssignTime} min</div>
            <p className="text-xs text-muted-foreground">Pour assignation</p>
          </CardContent>
        </Card>
      </div>

      {/* Dispatch Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Logs Dispatch Transport Temps Réel
          </CardTitle>
          <CardDescription>
            Monitoring des assignations de chauffeurs et recherches en cours
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : dispatchLogs && dispatchLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Heure</TableHead>
                  <TableHead>Course ID</TableHead>
                  <TableHead>Chauffeur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Délai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispatchLogs.map((log) => {
                  const assignDelay = log.driver_assigned_at 
                    ? Math.round((new Date(log.driver_assigned_at).getTime() - new Date(log.created_at).getTime()) / 1000 / 60)
                    : null;

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          Course #{log.id.substring(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.driver_id ? (
                          <Badge variant="outline">Assigné</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Non assigné</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.status)}
                      </TableCell>
                      <TableCell>
                        {assignDelay !== null ? (
                          <span className={`text-sm font-medium ${assignDelay < 5 ? 'text-green-600' : assignDelay < 10 ? 'text-orange-600' : 'text-red-600'}`}>
                            {assignDelay} min
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              Aucun log de dispatch disponible
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
