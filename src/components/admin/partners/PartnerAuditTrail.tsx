import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuditLog {
  id: string;
  partner_id: string;
  admin_id: string;
  action_type: string;
  old_status?: string | null;
  new_status?: string | null;
  reason?: string | null;
  ip_address?: unknown;
  user_agent?: string | null;
  metadata: any;
  created_at: string;
}

interface PartnerAuditTrailProps {
  partnerId?: string;
}

export const PartnerAuditTrail: React.FC<PartnerAuditTrailProps> = ({ partnerId }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const { toast } = useToast();

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('partner_audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (partnerId) {
        query = query.eq('partner_id', partnerId);
      }

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des logs d'audit",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLogs = async () => {
    try {
      const csvContent = [
        ['Date', 'Action', 'Ancien Statut', 'Nouveau Statut', 'Raison', 'Admin ID'].join(','),
        ...auditLogs.map(log => [
          new Date(log.created_at).toLocaleString('fr-FR'),
          log.action_type,
          log.old_status || '',
          log.new_status || '',
          log.reason || '',
          log.admin_id
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `partner-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Les logs d'audit ont été exportés en CSV"
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les logs",
        variant: "destructive"
      });
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'activated': return 'default';
      case 'deactivated': return 'secondary';
      case 'created': return 'outline';
      case 'updated': return 'secondary';
      case 'viewed': return 'outline';
      default: return 'outline';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'created': 'Créé',
      'approved': 'Approuvé',
      'rejected': 'Rejeté',
      'activated': 'Activé',
      'deactivated': 'Désactivé',
      'updated': 'Modifié',
      'viewed': 'Consulté'
    };
    return labels[action] || action;
  };

  useEffect(() => {
    loadAuditLogs();
  }, [partnerId, actionFilter]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">
          {partnerId ? 'Historique des Actions' : 'Audit Trail Partenaires'}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes actions</SelectItem>
              <SelectItem value="created">Créations</SelectItem>
              <SelectItem value="approved">Approbations</SelectItem>
              <SelectItem value="rejected">Rejets</SelectItem>
              <SelectItem value="activated">Activations</SelectItem>
              <SelectItem value="deactivated">Désactivations</SelectItem>
              <SelectItem value="updated">Modifications</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadAuditLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={exportAuditLogs}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun log d'audit trouvé
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={getActionBadgeVariant(log.action_type)}>
                      {getActionLabel(log.action_type)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </span>
                  </div>
                  
                  {(log.old_status || log.new_status) && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Statut : </span>
                      {log.old_status && (
                        <span className="text-red-600">{log.old_status}</span>
                      )}
                      {log.old_status && log.new_status && ' → '}
                      {log.new_status && (
                        <span className="text-green-600">{log.new_status}</span>
                      )}
                    </div>
                  )}
                  
                  {log.reason && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Raison : </span>
                      <span>{log.reason}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Admin: {log.admin_id.slice(0, 8)}...
                    {log.ip_address && ` • IP: ${log.ip_address}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};