import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Gift, Sparkles, Zap, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScratchCardGenerator } from '@/hooks/useScratchCardGenerator';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const TestLotteryPage = () => {
  const navigate = useNavigate();
  const { generateTestCard, generateMultipleCards } = useScratchCardGenerator();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, unscratched: 0, revealed: 0 });

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: wins } = await supabase
      .from('lottery_wins')
      .select('id, scratch_revealed_at')
      .eq('user_id', user.id);

    if (wins) {
      const unscratched = wins.filter(w => !w.scratch_revealed_at).length;
      setStats({
        total: wins.length,
        unscratched,
        revealed: wins.length - unscratched
      });
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleGenerate = async (rarity?: any) => {
    setLoading(true);
    await generateTestCard(rarity);
    await loadStats();
    setLoading(false);
  };

  const handleGenerateMultiple = async () => {
    setLoading(true);
    for (let i = 1; i <= 5; i++) {
      await generateTestCard();
      toast.success(`Carte ${i}/5 générée 🎰`);
      await loadStats();
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    setLoading(false);
    toast.success('🎉 5 cartes créées avec succès !');
  };

  const handleReset = async () => {
    if (!confirm('Supprimer toutes vos cartes à gratter ?')) return;
    
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('lottery_wins')
        .delete()
        .eq('user_id', user.id);
      toast.success('Cartes supprimées');
      await loadStats();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">🎰 Test Tombola</h1>
            <p className="text-sm text-muted-foreground">Générer des cartes à gratter de test</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-500">{stats.unscratched}</div>
              <div className="text-xs text-muted-foreground">À gratter</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-500">{stats.revealed}</div>
              <div className="text-xs text-muted-foreground">Révélées</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Génération rapide</CardTitle>
            <CardDescription>Créer des cartes aléatoires ou choisir la rareté</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => handleGenerate()}
              disabled={loading}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Générer 1 carte aléatoire
            </Button>
            <Button 
              className="w-full" 
              variant="secondary"
              onClick={handleGenerateMultiple}
              disabled={loading}
            >
              <Zap className="mr-2 h-4 w-4" />
              Générer 5 cartes d'un coup
            </Button>
          </CardContent>
        </Card>

        {/* Génération par rareté */}
        <Card>
          <CardHeader>
            <CardTitle>Générer par rareté</CardTitle>
            <CardDescription>Tester chaque type de carte</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              onClick={() => handleGenerate('common')}
              disabled={loading}
            >
              <Badge variant="secondary" className="mr-2">70%</Badge>
              Commune
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleGenerate('rare')}
              disabled={loading}
            >
              <Badge className="mr-2 bg-blue-500">20%</Badge>
              Rare
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleGenerate('epic')}
              disabled={loading}
            >
              <Badge className="mr-2 bg-purple-500">8%</Badge>
              Épique
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleGenerate('legendary')}
              disabled={loading}
            >
              <Badge className="mr-2 bg-yellow-500">2%</Badge>
              <Crown className="h-4 w-4 mr-1" />
              Légendaire
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => {
                loadStats();
                toast.success('Stats rafraîchies');
              }}
            >
              🔄 Rafraîchir les stats
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate('/app?view=lottery')}
            >
              <Gift className="mr-2 h-4 w-4" />
              Voir mes cartes à gratter
            </Button>
            <Button 
              className="w-full" 
              variant="destructive"
              onClick={handleReset}
              disabled={loading}
            >
              🗑️ Tout supprimer
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
