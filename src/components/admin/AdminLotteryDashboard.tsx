import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Ticket, Trophy, Timer, Plus, Calendar, Users, TrendingUp, Play,
  Settings, Gift, AlertCircle, CheckCircle, Package, RefreshCw,
  Crown, UserPlus, BarChart3, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PartnerPrizesManager } from './lottery/PartnerPrizesManager';
import { PartnerPrizeClaimsTracker } from './lottery/PartnerPrizeClaimsTracker';
import { toast as sonnerToast } from 'sonner';

interface LotteryDraw {
  id: string;
  name: string;
  draw_type: string;
  scheduled_date: string;
  status: string;
  min_tickets_required: number;
  max_winners: number;
  total_participants: number;
  prize_pool: any;
  total_tickets_used: number;
}

interface LotteryStats {
  totalTicketsIssued: number;
  totalParticipants: number;
  totalPrizesAwarded: number;
  activeDraws: number;
}

interface GrattaStats {
  total_cards: number;
  unscratched: number;
  revealed: number;
  today_generated: number;
  today_scratched: number;
  total_xp_distributed: number;
}

export const AdminLotteryDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<LotteryStats>({
    totalTicketsIssued: 0,
    totalParticipants: 0,
    totalPrizesAwarded: 0,
    activeDraws: 0
  });
  const [grattaStats, setGrattaStats] = useState<GrattaStats | null>(null);
  const [draws, setDraws] = useState<LotteryDraw[]>([]);
  const [isCreatingDraw, setIsCreatingDraw] = useState(false);
  const [recentWins, setRecentWins] = useState<any[]>([]);

  // Manual card assignment
  const [assignUserId, setAssignUserId] = useState('');
  const [assignCardType, setAssignCardType] = useState('standard');
  const [assigning, setAssigning] = useState(false);

  // Form states
  const [newDrawForm, setNewDrawForm] = useState({
    name: '',
    draw_type: 'daily',
    scheduled_date: '',
    min_tickets_required: 1,
    max_winners: 1,
    prize_pool: [{ type: 'credits', value: 5000, quantity: 1, name: 'Prix Principal' }]
  });

  const loadStats = async () => {
    try {
      const { count: ticketsCount } = await supabase
        .from('lottery_tickets')
        .select('*', { count: 'exact', head: true });

      const { data: participants } = await supabase
        .from('lottery_entries')
        .select('user_id');

      const { count: prizesCount } = await supabase
        .from('lottery_wins')
        .select('*', { count: 'exact', head: true });

      const { count: activeDrawsCount } = await supabase
        .from('lottery_draws')
        .select('*', { count: 'exact', head: true })
        .in('status', ['scheduled', 'active']);

      setStats({
        totalTicketsIssued: ticketsCount || 0,
        totalParticipants: new Set(participants?.map(p => p.user_id) || []).size,
        totalPrizesAwarded: prizesCount || 0,
        activeDraws: activeDrawsCount || 0
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const loadGrattaStats = async () => {
    try {
      const { data } = await supabase.functions.invoke('lottery-system', {
        body: { action: 'admin_stats' }
      });
      if (data?.success && data?.stats?.gratta) {
        setGrattaStats(data.stats.gratta);
      }

      const { data: recent } = await supabase
        .from('lottery_wins')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setRecentWins(recent || []);
    } catch (error) {
      console.error('Erreur chargement gratta stats:', error);
    }
  };

  const loadDraws = async () => {
    try {
      const { data, error } = await supabase
        .from('lottery_draws')
        .select('*')
        .order('scheduled_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      setDraws(data || []);
    } catch (error) {
      console.error('Erreur chargement tirages:', error);
    }
  };

  useEffect(() => {
    loadStats();
    loadDraws();
    loadGrattaStats();
  }, []);

  const handleCreateDraw = async () => {
    if (!newDrawForm.name || !newDrawForm.scheduled_date) {
      toast({ title: "Erreur", description: "Remplissez tous les champs", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('lottery_draws').insert({
        name: newDrawForm.name,
        draw_type: newDrawForm.draw_type,
        scheduled_date: newDrawForm.scheduled_date,
        min_tickets_required: newDrawForm.min_tickets_required,
        max_winners: newDrawForm.max_winners,
        prize_pool: newDrawForm.prize_pool,
        status: 'scheduled'
      });
      if (error) throw error;
      toast({ title: "Tirage créé", description: `"${newDrawForm.name}" programmé` });
      setIsCreatingDraw(false);
      setNewDrawForm({ name: '', draw_type: 'daily', scheduled_date: '', min_tickets_required: 1, max_winners: 1, prize_pool: [{ type: 'credits', value: 5000, quantity: 1, name: 'Prix Principal' }] });
      loadDraws();
      loadStats();
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de créer le tirage", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerDraw = async (drawId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('lottery-system', {
        body: { action: 'drawLottery', drawId }
      });
      if (error) throw error;
      toast({ title: "Tirage lancé", description: "Exécuté avec succès" });
      loadDraws();
      loadStats();
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de lancer le tirage", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCard = async () => {
    if (!assignUserId.trim()) {
      sonnerToast.error('Entrez un ID utilisateur');
      return;
    }
    setAssigning(true);
    try {
      const { data, error } = await supabase.functions.invoke('lottery-system', {
        body: { action: 'generate_scratch_card', userId: assignUserId.trim(), cardType: assignCardType }
      });
      if (error) throw error;
      if (data?.success) {
        sonnerToast.success('Carte attribuée avec succès !');
        setAssignUserId('');
        loadGrattaStats();
      } else {
        sonnerToast.error(data?.error || 'Erreur attribution');
      }
    } catch (error) {
      sonnerToast.error('Erreur lors de l\'attribution');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'active': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'completed': return 'bg-gray-500/10 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programmé';
      case 'active': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const rarityColors: Record<string, string> = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-yellow-500'
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Gestion Tombola
          </h1>
          <p className="text-muted-foreground">TAGA Gratta & Tirages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { loadStats(); loadDraws(); loadGrattaStats(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => setIsCreatingDraw(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Tirage
          </Button>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg"><Ticket className="h-6 w-6 text-primary" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cartes</p>
                <p className="text-2xl font-bold">{grattaStats?.total_cards || stats.totalTicketsIssued}</p>
                {grattaStats && <p className="text-xs text-muted-foreground">{grattaStats.unscratched} non grattées</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Révélées</p>
                <p className="text-2xl font-bold">{grattaStats?.revealed || stats.totalPrizesAwarded}</p>
                {grattaStats && grattaStats.total_cards > 0 && (
                  <p className="text-xs text-muted-foreground">{((grattaStats.revealed / grattaStats.total_cards) * 100).toFixed(0)}%</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-lg"><Calendar className="h-6 w-6 text-orange-600" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aujourd'hui</p>
                <p className="text-2xl font-bold">{grattaStats?.today_generated || 0}</p>
                <p className="text-xs text-muted-foreground">{grattaStats?.today_scratched || 0} grattées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg"><Gift className="h-6 w-6 text-purple-600" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">XP Distribué</p>
                <p className="text-2xl font-bold">{(grattaStats?.total_xp_distributed || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="draws">Tirages</TabsTrigger>
          <TabsTrigger value="assign">
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            Attribuer
          </TabsTrigger>
          <TabsTrigger value="partner-prizes">
            <Gift className="h-3.5 w-3.5 mr-1" />
            Cadeaux
          </TabsTrigger>
          <TabsTrigger value="claims">
            <Package className="h-3.5 w-3.5 mr-1" />
            Réclamations
          </TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dernières cartes */}
            <Card>
              <CardHeader>
                <CardTitle>10 Dernières Cartes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentWins.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucune carte</p>
                  ) : (
                    recentWins.map((win) => {
                      const details = win.prize_details as any;
                      return (
                        <div key={win.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Badge className={rarityColors[win.rarity] || 'bg-gray-500'}>
                              {win.rarity || 'common'}
                            </Badge>
                            <div>
                              <div className="font-medium text-sm">{details?.name || 'Prix'}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(win.created_at).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">{win.reward_type === 'nothing' ? '❌' : `${details?.value || 0} XP`}</div>
                            <div className="text-xs text-muted-foreground">
                              {win.scratch_revealed_at ? '✅ Révélée' : '⏳ En attente'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tirages récents */}
            <Card>
              <CardHeader>
                <CardTitle>Tirages Récents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {draws.slice(0, 5).map((draw) => (
                    <div key={draw.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{draw.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(draw.scheduled_date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </p>
                      </div>
                      <Badge className={getStatusColor(draw.status)}>
                        {getStatusLabel(draw.status)}
                      </Badge>
                    </div>
                  ))}
                  {draws.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Aucun tirage</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tirages */}
        <TabsContent value="draws" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tous les Tirages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {draws.map((draw) => (
                  <div key={draw.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{draw.name}</h4>
                        <Badge variant="outline">{draw.draw_type}</Badge>
                        <Badge className={getStatusColor(draw.status)}>{getStatusLabel(draw.status)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(draw.scheduled_date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Participants: {draw.total_participants}</span>
                        <span>Tickets: {draw.total_tickets_used}</span>
                        <span>Max gagnants: {draw.max_winners}</span>
                      </div>
                    </div>
                    {draw.status === 'scheduled' && (
                      <Button size="sm" onClick={() => handleTriggerDraw(draw.id)} disabled={loading} className="ml-4">
                        <Play className="h-4 w-4 mr-1" />
                        Exécuter
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attribution manuelle */}
        <TabsContent value="assign" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Attribuer une carte manuellement
              </CardTitle>
              <CardDescription>Générer une carte à gratter pour un utilisateur spécifique</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userId">ID Utilisateur (UUID)</Label>
                <Input
                  id="userId"
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  placeholder="ex: 123e4567-e89b-12d3-a456-426614174000"
                />
              </div>
              <div>
                <Label>Type de carte</Label>
                <Select value={assignCardType} onValueChange={setAssignCardType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (Common)</SelectItem>
                    <SelectItem value="active">Active (Rare garanti)</SelectItem>
                    <SelectItem value="premium">Premium (Epic garanti)</SelectItem>
                    <SelectItem value="mega">Méga (Legendary garanti)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAssignCard} disabled={assigning} className="w-full">
                {assigning ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Attribution...</>
                ) : (
                  <><Gift className="h-4 w-4 mr-2" />Attribuer la carte</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partner-prizes" className="space-y-6">
          <PartnerPrizesManager />
        </TabsContent>

        <TabsContent value="claims" className="space-y-6">
          <PartnerPrizeClaimsTracker />
        </TabsContent>
      </Tabs>

      {/* Modal création tirage */}
      {isCreatingDraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCreatingDraw(false)} />
          <Card className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle>Nouveau Tirage</CardTitle>
              <CardDescription>Créer un nouveau tirage de tombola</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du tirage</Label>
                <Input id="name" value={newDrawForm.name} onChange={(e) => setNewDrawForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Tirage Flash du Vendredi" />
              </div>
              <div>
                <Label>Type de tirage</Label>
                <Select value={newDrawForm.draw_type} onValueChange={(v) => setNewDrawForm(prev => ({ ...prev, draw_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="special">Spécial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date et heure</Label>
                <Input type="datetime-local" value={newDrawForm.scheduled_date} onChange={(e) => setNewDrawForm(prev => ({ ...prev, scheduled_date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tickets min</Label>
                  <Input type="number" min="1" value={newDrawForm.min_tickets_required} onChange={(e) => setNewDrawForm(prev => ({ ...prev, min_tickets_required: parseInt(e.target.value) || 1 }))} />
                </div>
                <div>
                  <Label>Max gagnants</Label>
                  <Input type="number" min="1" value={newDrawForm.max_winners} onChange={(e) => setNewDrawForm(prev => ({ ...prev, max_winners: parseInt(e.target.value) || 1 }))} />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreatingDraw(false)} className="flex-1">Annuler</Button>
                <Button onClick={handleCreateDraw} disabled={loading} className="flex-1">{loading ? 'Création...' : 'Créer'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
