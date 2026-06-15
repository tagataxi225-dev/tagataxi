/**
 * Visualiseur de Heatmap pour analyser les zones de clics
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Monitor, Smartphone, Tablet, RefreshCw, Download } from 'lucide-react';
import { 
  generateHeatmapGrid, 
  applyGaussianBlur, 
  drawHeatmap,
  formatHeatmapStats 
} from '@/utils/heatmapUtils';
import { useToast } from '@/hooks/use-toast';

interface HeatmapClick {
  relative_x: number;
  relative_y: number;
  device_type: string;
  page: string;
  element_type?: string;
  element_id?: string;
  created_at: string;
}

export const HeatmapViewer = () => {
  const [selectedPage, setSelectedPage] = useState<string>('/');
  const [selectedDevice, setSelectedDevice] = useState<'all' | 'mobile' | 'tablet' | 'desktop'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [clicks, setClicks] = useState<HeatmapClick[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    loadClicks();
  }, [selectedPage, selectedDevice, dateRange]);

  useEffect(() => {
    if (clicks.length > 0 && canvasRef.current) {
      renderHeatmap();
    }
  }, [clicks]);

  const loadPages = async () => {
    try {
      const { data, error } = await supabase
        .from('heatmap_clicks')
        .select('page')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const uniquePages = Array.from(new Set(data?.map(d => d.page) || []));
      setPages(uniquePages);
    } catch (error) {
      console.error('Erreur chargement pages:', error);
    }
  };

  const loadClicks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('heatmap_clicks')
        .select('*')
        .eq('page', selectedPage);

      // Filtre device
      if (selectedDevice !== 'all') {
        query = query.eq('device_type', selectedDevice);
      }

      // Filtre date
      const now = new Date();
      if (dateRange === '7d') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte('created_at', sevenDaysAgo.toISOString());
      } else if (dateRange === '30d') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte('created_at', thirtyDaysAgo.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setClicks(data || []);
      setStats(formatHeatmapStats(data || []));
    } catch (error) {
      console.error('Erreur chargement clics:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de clics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderHeatmap = () => {
    if (!canvasRef.current || clicks.length === 0) return;

    // Générer la grille
    const grid = generateHeatmapGrid(clicks);
    
    // Appliquer blur Gaussian
    const blurred = applyGaussianBlur(grid, 50, 2);

    // Dessiner sur canvas
    drawHeatmap(canvasRef.current, blurred, 1200, 800);
  };

  const handleExport = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob(blob => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heatmap-${selectedPage}-${selectedDevice}-${dateRange}.png`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Exporté',
        description: 'Heatmap téléchargée avec succès'
      });
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🔥 Heatmap Viewer
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualisez les zones les plus cliquées de votre application
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadClicks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={handleExport} disabled={clicks.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Page</label>
            <Select value={selectedPage} onValueChange={setSelectedPage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pages.map(page => (
                  <SelectItem key={page} value={page}>
                    {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Device</label>
            <Tabs value={selectedDevice} onValueChange={(v) => setSelectedDevice(v as any)}>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="all">Tous</TabsTrigger>
                <TabsTrigger value="desktop">
                  <Monitor className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="tablet">
                  <Tablet className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="mobile">
                  <Smartphone className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Période</label>
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="all">Tout</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Clics totaux</div>
            <div className="text-2xl font-bold mt-1">{stats.totalClicks.toLocaleString()}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Utilisateurs</div>
            <div className="text-2xl font-bold mt-1">{stats.uniqueUsers.toLocaleString()}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Sessions</div>
            <div className="text-2xl font-bold mt-1">{stats.uniqueSessions.toLocaleString()}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Clics/Session</div>
            <div className="text-2xl font-bold mt-1">{stats.avgClicksPerSession.toFixed(1)}</div>
          </Card>
        </div>
      )}

      {/* Heatmap Canvas */}
      <Card className="p-6">
        {loading ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Chargement des données...</p>
            </div>
          </div>
        ) : clicks.length === 0 ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Aucune donnée de clic pour cette page</p>
              <p className="text-sm text-muted-foreground mt-2">
                Les clics seront trackés automatiquement
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="secondary">{clicks.length} clics</Badge>
              <div className="flex items-center gap-1 ml-auto text-xs">
                <span>Faible</span>
                <div className="w-20 h-4 rounded" style={{
                  background: 'linear-gradient(to right, rgba(0,0,255,0.3), rgba(0,255,255,0.5), rgba(0,255,0,0.7), rgba(255,255,0,0.8), rgba(255,0,0,1))'
                }} />
                <span>Élevé</span>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                className="w-full h-auto"
                style={{ maxHeight: '800px' }}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
