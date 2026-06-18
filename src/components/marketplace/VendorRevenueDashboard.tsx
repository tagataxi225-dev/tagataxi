import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVendorEarnings } from "@/hooks/useVendorEarnings";
import { TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#22c55e'];

export default function VendorRevenueDashboard() {
  const { earnings, summary, loading, markAsPaid, getEarningsByPeriod } = useVendorEarnings();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [periodData, setPeriodData] = useState<any[]>([]);
  const [loadingPeriodData, setLoadingPeriodData] = useState(false);

  useEffect(() => {
    const fetchPeriodData = async () => {
      setLoadingPeriodData(true);
      try {
        const data = await getEarningsByPeriod(selectedPeriod);
        setPeriodData(data);
      } catch (error) {
        console.error('Error fetching period data:', error);
      } finally {
        setLoadingPeriodData(false);
      }
    };

    fetchPeriodData();
  }, [selectedPeriod, getEarningsByPeriod]);

  const handleMarkAsPaid = async (earningId: string) => {
    try {
      await markAsPaid(earningId, 'kwenda_pay');
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'destructive';
      case 'confirmed':
        return 'default';
      case 'paid':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <AlertCircle className="h-4 w-4" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const pieChartData = [
    { name: 'En attente', value: summary.pending.amount, color: '#ef4444' },
    { name: 'Confirmé', value: summary.confirmed.amount, color: '#f97316' },
    { name: 'Payé', value: summary.paid.amount, color: '#22c55e' },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tableau de bord TAGA Market</h2>
        <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Jour</SelectItem>
            <SelectItem value="week">Semaine</SelectItem>
            <SelectItem value="month">Mois</SelectItem>
            <SelectItem value="year">Année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">En attente</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {summary.pending.amount.toLocaleString()} FC
            </div>
            <p className="text-xs text-red-600">
              {summary.pending.count} commande{summary.pending.count !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Confirmé</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {summary.confirmed.amount.toLocaleString()} FC
            </div>
            <p className="text-xs text-orange-600">
              {summary.confirmed.count} commande{summary.confirmed.count !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Revenus effectifs</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {summary.paid.amount.toLocaleString()} FC
            </div>
            <p className="text-xs text-green-600">
              {summary.paid.count} commande{summary.paid.count !== 1 ? 's' : ''} payée{summary.paid.count !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {summary.total.amount.toLocaleString()} FC
            </div>
            <p className="text-xs text-blue-600">
              {summary.total.count} commande{summary.total.count !== 1 ? 's' : ''} au total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="earnings">Revenus détaillés</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} FC`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenus par statut</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'En attente', amount: summary.pending.amount },
                    { name: 'Confirmé', amount: summary.confirmed.amount },
                    { name: 'Payé', amount: summary.paid.amount },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} FC`} />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des revenus par {selectedPeriod}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPeriodData ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={periodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} FC`} />
                    <Line type="monotone" dataKey="paid" stroke="#22c55e" name="Payé" strokeWidth={2} />
                    <Line type="monotone" dataKey="confirmed" stroke="#f97316" name="Confirmé" strokeWidth={2} />
                    <Line type="monotone" dataKey="pending" stroke="#ef4444" name="En attente" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {earnings.slice(0, 20).map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(earning.status)}
                      <div>
                        <p className="font-medium">{earning.amount.toLocaleString()} FC</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(earning.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(earning.status)}>
                        {earning.status === 'pending' && 'En attente'}
                        {earning.status === 'confirmed' && 'Confirmé'}
                        {earning.status === 'paid' && 'Payé'}
                      </Badge>
                      {earning.status === 'confirmed' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleMarkAsPaid(earning.id)}
                          className="ml-2"
                        >
                          Marquer payé
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {earnings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun revenu enregistré pour le moment
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}