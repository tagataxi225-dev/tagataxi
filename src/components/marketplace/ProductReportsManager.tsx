import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Flag, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductReport {
  id: string;
  product_id: string;
  reporter_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  admin_notes: string;
  created_at: string;
  product?: {
    title: string;
    images: string[];
    seller_id: string;
  };
}

export const ProductReportsManager: React.FC = () => {
  const { toast } = useToast();
  const { formatCurrency } = useLanguage();
  const [reports, setReports] = useState<ProductReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ProductReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_reports')
        .select('*, product:marketplace_products(title, images, seller_id)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data as any[]) || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les signalements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: 'reviewed' | 'dismissed', notes: string) => {
    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('product_reports')
        .update({
          status: newStatus,
          admin_notes: notes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: newStatus === 'reviewed' ? 'Signalement traité' : 'Signalement ignoré',
        description: `Le signalement a été ${newStatus === 'reviewed' ? 'marqué comme traité' : 'ignoré'}`,
      });

      setSelectedReport(null);
      setAdminNotes('');
      loadReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le signalement',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'secondary', icon: Flag, label: 'En attente' },
      reviewed: { variant: 'default', icon: CheckCircle, label: 'Traité' },
      dismissed: { variant: 'outline', icon: XCircle, label: 'Ignoré' }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      inappropriate_images: 'Images inappropriées',
      fake_product: 'Produit contrefait',
      misleading_description: 'Description mensongère',
      suspicious_price: 'Prix suspect',
      scam: 'Arnaque',
      other: 'Autre'
    };
    return reasons[reason] || reason;
  };

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Signalements de produits</h2>
          <p className="text-muted-foreground">
            {pendingCount} signalement{pendingCount !== 1 ? 's' : ''} en attente de traitement
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="space-y-3 p-4">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Flag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucun signalement</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Aucun produit n'a été signalé pour le moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold line-clamp-1">
                      {report.product?.title || 'Produit supprimé'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getReasonLabel(report.reason)}
                    </p>
                  </div>
                  {getStatusBadge(report.status)}
                </div>

                {report.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {report.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setAdminNotes(report.admin_notes || '');
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Détails
                    </Button>
                    {report.status === 'pending' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setAdminNotes('');
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateReportStatus(report.id, 'dismissed', 'Signalement non fondé')}
                          disabled={actionLoading}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Report Details Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => {
        setSelectedReport(null);
        setAdminNotes('');
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du signalement</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Produit signalé</label>
                <p className="mt-1">{selectedReport.product?.title || 'Produit supprimé'}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Raison</label>
                <p className="mt-1">{getReasonLabel(selectedReport.reason)}</p>
              </div>

              {selectedReport.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedReport.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Date du signalement</label>
                <p className="mt-1 text-sm">
                  {new Date(selectedReport.created_at).toLocaleString('fr-FR')}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Notes administratives</label>
                <Textarea
                  placeholder="Ajoutez vos notes sur ce signalement..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedReport(null);
              setAdminNotes('');
            }}>
              Fermer
            </Button>
            {selectedReport?.status === 'pending' && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => updateReportStatus(selectedReport.id, 'dismissed', adminNotes || 'Signalement non fondé')}
                  disabled={actionLoading}
                >
                  Ignorer
                </Button>
                <Button
                  variant="default"
                  onClick={() => updateReportStatus(selectedReport.id, 'reviewed', adminNotes || 'Signalement traité')}
                  disabled={actionLoading}
                >
                  Marquer comme traité
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};