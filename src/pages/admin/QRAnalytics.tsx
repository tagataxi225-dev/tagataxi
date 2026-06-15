import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { QrCode, TrendingUp, Users, Smartphone } from 'lucide-react';
import { DISTRIBUTION_CHANNELS } from '@/utils/qrCodeUtils';

interface QRScan {
  channel_id: string;
  utm_source: string;
  device_type: string;
  converted: boolean;
  scanned_at: string;
}

interface ChannelStats {
  channel: string;
  scans: number;
  conversions: number;
  conversionRate: number;
  color: string;
}

export default function QRAnalytics() {
  const [scans, setScans] = useState<QRScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalScans, setTotalScans] = useState(0);
  const [totalConversions, setTotalConversions] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('qr_code_scans')
        .select('*')
        .order('scanned_at', { ascending: false });

      if (error) throw error;

      setScans(data || []);
      setTotalScans(data?.length || 0);
      setTotalConversions(data?.filter(s => s.converted).length || 0);
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const channelStats: ChannelStats[] = DISTRIBUTION_CHANNELS.map(channel => {
    const channelScans = scans.filter(s => s.channel_id === channel.id);
    const conversions = channelScans.filter(s => s.converted).length;
    
    return {
      channel: channel.name,
      scans: channelScans.length,
      conversions,
      conversionRate: channelScans.length > 0 
        ? Math.round((conversions / channelScans.length) * 100) 
        : 0,
      color: channel.color
    };
  }).filter(s => s.scans > 0)
    .sort((a, b) => b.scans - a.scans);

  const deviceStats = scans.reduce((acc, scan) => {
    const device = scan.device_type || 'unknown';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceData = Object.entries(deviceStats).map(([name, value]) => ({
    name: name === 'mobile' ? 'Mobile' : name === 'desktop' ? 'Desktop' : 'Tablette',
    value
  }));

  const COLORS = ['#DC2626', '#F59E0B', '#10B981', '#3B82F6'];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Chargement des analytics...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics QR Codes</h1>
        <p className="text-muted-foreground mt-1">
          Statistiques de performance de vos canaux marketing
        </p>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <QrCode className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScans}</div>
            <p className="text-xs text-muted-foreground">QR codes scannés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
            <p className="text-xs text-muted-foreground">
              {totalScans > 0 ? Math.round((totalConversions / totalScans) * 100) : 0}% de taux
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Canaux actifs</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channelStats.length}</div>
            <p className="text-xs text-muted-foreground">Avec scans enregistrés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Appareil principal</CardTitle>
            <Smartphone className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deviceData[0]?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {deviceData[0] ? `${Math.round((deviceData[0].value / totalScans) * 100)}% des scans` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top canaux */}
        <Card>
          <CardHeader>
            <CardTitle>Performance par canal</CardTitle>
            <CardDescription>Nombre de scans par canal marketing</CardDescription>
          </CardHeader>
          <CardContent>
            {channelStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={channelStats.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="scans" fill="#DC2626" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Répartition par appareil */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par appareil</CardTitle>
            <CardDescription>Type d'appareil utilisé pour scanner</CardDescription>
          </CardHeader>
          <CardContent>
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Détails par canal</CardTitle>
          <CardDescription>Statistiques complètes de chaque canal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {channelStats.length > 0 ? (
              channelStats.map((stat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg border"
                  style={{ borderLeftColor: stat.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex-1">
                    <div className="font-semibold">{stat.channel}</div>
                    <div className="text-sm text-muted-foreground">
                      {stat.scans} scans • {stat.conversions} conversions
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stat.conversionRate}%</div>
                    <div className="text-xs text-muted-foreground">Taux conversion</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucun scan enregistré pour le moment
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
