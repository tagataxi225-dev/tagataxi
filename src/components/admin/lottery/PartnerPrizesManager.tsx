import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Gift, Package, Star, Edit2, Trash2, Eye, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { usePartnerPrizes } from '@/hooks/usePartnerPrizes';
import { PartnerPrizeForm } from './PartnerPrizeForm';
import { RARITY_CONFIG, PRIZE_TYPE_CONFIG } from '@/types/partner-prize';
import type { PartnerPrize } from '@/types/partner-prize';
import { cn } from '@/lib/utils';

export const PartnerPrizesManager: React.FC = () => {
  const { prizes, isLoading, updatePrize, deletePrize } = usePartnerPrizes();
  const [showForm, setShowForm] = useState(false);
  const [editingPrize, setEditingPrize] = useState<PartnerPrize | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');

  const filteredPrizes = prizes.filter(p => {
    if (filter === 'active' && !p.is_active) return false;
    if (filter === 'inactive' && p.is_active) return false;
    if (rarityFilter !== 'all' && p.rarity_tier !== rarityFilter) return false;
    return true;
  });

  // Stats
  const stats = {
    total: prizes.length,
    active: prizes.filter(p => p.is_active).length,
    totalStock: prizes.reduce((sum, p) => sum + (p.stock_unlimited ? 999 : p.stock_quantity), 0),
    legendary: prizes.filter(p => p.rarity_tier === 'legendary').length
  };

  const handleEdit = (prize: PartnerPrize) => {
    setEditingPrize(prize);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir désactiver ce prix ?')) {
      await deletePrize.mutateAsync(id);
    }
  };

  const handleToggleActive = async (prize: PartnerPrize) => {
    await updatePrize.mutateAsync({ 
      id: prize.id, 
      is_active: !prize.is_active 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Cadeaux Partenaires
          </h2>
          <p className="text-muted-foreground text-sm">
            Gérez les prix physiques offerts par vos partenaires
          </p>
        </div>
        <Button onClick={() => { setEditingPrize(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un prix
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total prix</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalStock}</p>
                <p className="text-xs text-muted-foreground">En stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.legendary}</p>
                <p className="text-xs text-muted-foreground">Légendaires</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="inactive">Inactifs</SelectItem>
          </SelectContent>
        </Select>
        <Select value={rarityFilter} onValueChange={setRarityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Rareté" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="rare">Rare</SelectItem>
            <SelectItem value="epic">Épique</SelectItem>
            <SelectItem value="legendary">Légendaire</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Prizes list */}
      <div className="space-y-3">
        {filteredPrizes.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Aucun prix partenaire</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowForm(true)}
              >
                Ajouter le premier prix
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredPrizes.map((prize) => {
            const rarityConfig = RARITY_CONFIG[prize.rarity_tier];
            const typeConfig = PRIZE_TYPE_CONFIG[prize.prize_type];
            
            return (
              <motion.div
                key={prize.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={cn(!prize.is_active && "opacity-60")}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {prize.image_url ? (
                          <img 
                            src={prize.image_url} 
                            alt={prize.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">{typeConfig.icon}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{prize.name}</h3>
                          <Badge className={cn("text-xs", rarityConfig.bgColor, rarityConfig.color)}>
                            {rarityConfig.icon} {rarityConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{prize.partner_name}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>
                            Valeur: {prize.estimated_value?.toLocaleString()} {prize.currency}
                          </span>
                          <span>
                            Stock: {prize.stock_unlimited ? '∞' : `${prize.stock_quantity}`}
                          </span>
                          <span>
                            Prob: {(prize.distribution_probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={prize.is_active}
                          onCheckedChange={() => handleToggleActive(prize)}
                        />
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleEdit(prize)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(prize.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <PartnerPrizeForm
          prize={editingPrize}
          onClose={() => { setShowForm(false); setEditingPrize(null); }}
        />
      )}
    </div>
  );
};
