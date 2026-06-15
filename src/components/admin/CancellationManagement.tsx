/**
 * 📊 DASHBOARD ADMIN - GESTION DES ANNULATIONS
 * 
 * Fonctionnalités :
 * - Vue d'ensemble des annulations (stats)
 * - Analyse par type, raison, utilisateur
 * - Filtres et recherche avancée
 * - Export des données
 * - Actions de modération
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface CancellationRecord {
  id: string;
  reference_id: string;
  reference_type: 'transport' | 'delivery';
  cancelled_by: string;
  cancellation_type: 'client' | 'driver' | 'system';
  reason: string;
  status_at_cancellation: string;
  financial_impact: any;
  admin_reviewed: boolean;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  metadata: any;
}

interface CancellationStats {
  total: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  byType: { [key: string]: number };
  byReason: { [key: string]: number };
  byStatus: { [key: string]: number };
  pendingReview: number;
  totalFinancialImpact: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function CancellationManagement() {
  const { toast } = useToast();
  const [cancellations, setCancellations] = useState<CancellationRecord[]>([]);
  const [stats, setStats] = useState<CancellationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCancellation, setSelectedCancellation] = useState<CancellationRecord | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    cancellationType: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    searchQuery: ''
  });

  // Charger les données
  useEffect(() => {
    loadCancellations();
    loadStats();
  }, [filters]);

  const loadCancellations = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('cancellation_history')
        .select('*')
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters.type !== 'all') {
        query = query.eq('reference_type', filters.type);
      }
      if (filters.cancellationType !== 'all') {
        query = query.eq('cancellation_type', filters.cancellationType);
      }
      if (filters.status !== 'all') {
        query = query.eq('admin_reviewed', filters.status === 'reviewed');
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      // Filtrer par recherche si présente
      let filteredData = data || [];
      if (filters.searchQuery) {
        filteredData = filteredData.filter(c =>
          c.reason.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          c.reference_id.includes(filters.searchQuery)
        );
      }

      setCancellations(filteredData as CancellationRecord[]);
    } catch (error) {
      console.error('Error loading cancellations:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les annulations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('cancellation_history')
        .select('*');

      if (error) throw error;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const byType: { [key: string]: number } = {};
      const byReason: { [key: string]: number } = {};
      const byStatus: { [key: string]: number } = {};
      let totalFinancialImpact = 0;
      let todayCount = 0;
      let weekCount = 0;
      let monthCount = 0;
      let pendingReview = 0;

      data?.forEach((c) => {
        const createdAt = new Date(c.created_at);

        // Compter par période
        if (createdAt >= today) todayCount++;
        if (createdAt >= weekAgo) weekCount++;
        if (createdAt >= monthAgo) monthCount++;

        // Compter par type
        byType[c.reference_type] = (byType[c.reference_type] || 0) + 1;

        // Compter par raison (simplifiée)
        const reasonKey = c.reason.substring(0, 50);
        byReason[reasonKey] = (byReason[reasonKey] || 0) + 1;

        // Compter par statut
        byStatus[c.status_at_cancellation] = (byStatus[c.status_at_cancellation] || 0) + 1;

        // Impact financier
        if (c.financial_impact && typeof c.financial_impact === 'object') {
          const impact = c.financial_impact as any;
          if (impact.cancellation_fee) {
            totalFinancialImpact += Number(impact.cancellation_fee);
          }
        }

        // En attente de révision
        if (!c.admin_reviewed) pendingReview++;
      });

      setStats({
        total: data?.length || 0,
        todayCount,
        weekCount,
        monthCount,
        byType,
        byReason,
        byStatus,
        pendingReview,
        totalFinancialImpact
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const reviewCancellation = async (cancellationId: string) => {
    try {
      const { error } = await supabase
        .from('cancellation_history')
        .update({
          admin_reviewed: true,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', cancellationId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Annulation marquée comme révisée'
      });

      setSelectedCancellation(null);
      setAdminNotes('');
      loadCancellations();
      loadStats();
    } catch (error) {
      console.error('Error reviewing cancellation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de réviser l\'annulation',
        variant: 'destructive'
      });
    }
  };

  const exportData = () => {
    const csv = [
      ['Date', 'Type', 'Annulé par', 'Raison', 'Statut', 'Impact financier'].join(','),
      ...cancellations.map(c => [
        format(new Date(c.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
        c.reference_type,
        c.cancellation_type,
        `"${c.reason.replace(/"/g, '""')}"`,
        c.status_at_cancellation,
        c.financial_impact?.cancellation_fee || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annulations_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Préparer les données pour les graphiques
  const pieChartData = stats ? Object.entries(stats.byType).map(([name, value]) => ({
    name: name === 'transport' ? 'Transport' : 'Livraison',
    value
  })) : [];

  const reasonChartData = stats ? Object.entries(stats.byReason)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestion des Annulations</h2>
          <p className="text-muted-foreground">
            Analysez et gérez les annulations de réservations
          </p>
        </div>
        <Button onClick={exportData} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1" />
              {stats?.weekCount || 0} cette semaine
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                <p className="text-2xl font-bold">{stats?.todayCount || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Annulations du jour
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-orange-500">
                  {stats?.pendingReview || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              À réviser
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Impact financier</p>
                <p className="text-2xl font-bold">
                  {(stats?.totalFinancialImpact || 0).toLocaleString()} CDF
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Frais d'annulation
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 raisons</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reasonChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={filters.type} onValueChange={(v) => setFilters({...filters, type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="delivery">Livraison</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Annulé par</Label>
              <Select value={filters.cancellationType} onValueChange={(v) => setFilters({...filters, cancellationType: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="driver">Chauffeur</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Statut révision</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="reviewed">Révisé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date début</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              />
            </div>

            <div>
              <Label>Date fin</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              />
            </div>

            <div>
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Chercher..."
                  className="pl-8"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des annulations */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des annulations ({cancellations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : cancellations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune annulation trouvée
            </div>
          ) : (
            <div className="space-y-3">
              {cancellations.map((cancellation) => (
                <div
                  key={cancellation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={cancellation.reference_type === 'transport' ? 'default' : 'secondary'}>
                        {cancellation.reference_type}
                      </Badge>
                      <Badge variant={cancellation.cancellation_type === 'client' ? 'outline' : 'destructive'}>
                        {cancellation.cancellation_type}
                      </Badge>
                      {cancellation.admin_reviewed ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Révisé
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-500">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          En attente
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium">{cancellation.reason}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(cancellation.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </span>
                      <span>Statut: {cancellation.status_at_cancellation}</span>
                      {cancellation.financial_impact?.cancellation_fee && (
                        <span className="text-orange-600 font-medium">
                          Frais: {cancellation.financial_impact.cancellation_fee} CDF
                        </span>
                      )}
                    </div>
                  </div>
                  {!cancellation.admin_reviewed && (
                    <Button
                      size="sm"
                      onClick={() => setSelectedCancellation(cancellation)}
                    >
                      Réviser
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de révision */}
      {selectedCancellation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Réviser l'annulation</CardTitle>
              <CardDescription>
                Ajoutez des notes administratives et marquez comme révisé
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Raison de l'annulation</Label>
                <p className="text-sm bg-muted p-3 rounded mt-1">
                  {selectedCancellation.reason}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <p className="text-sm">{selectedCancellation.reference_type}</p>
                </div>
                <div>
                  <Label>Annulé par</Label>
                  <p className="text-sm">{selectedCancellation.cancellation_type}</p>
                </div>
                <div>
                  <Label>Statut lors de l'annulation</Label>
                  <p className="text-sm">{selectedCancellation.status_at_cancellation}</p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p className="text-sm">
                    {format(new Date(selectedCancellation.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>

              {selectedCancellation.financial_impact && (
                <div>
                  <Label>Impact financier</Label>
                  <div className="text-sm bg-orange-50 p-3 rounded mt-1">
                    <p>Frais d'annulation: {selectedCancellation.financial_impact.cancellation_fee || 0} CDF</p>
                    {selectedCancellation.financial_impact.refund_amount && (
                      <p>Montant remboursé: {selectedCancellation.financial_impact.refund_amount} CDF</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label>Notes administratives</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ajoutez vos observations..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setSelectedCancellation(null);
                  setAdminNotes('');
                }}>
                  Annuler
                </Button>
                <Button onClick={() => reviewCancellation(selectedCancellation.id)}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Marquer comme révisé
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
