import React, { useState } from 'react';
import { Calendar, Download, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CommissionHistoryCard } from './CommissionHistoryCard';
import { toast } from 'sonner';

export const PartnerCommissionHistory: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['partner-commissions', user?.id, filterType, filterPeriod],
    queryFn: async () => {
      if (!user?.id) return [];

      // Récupérer l'ID du partenaire
      const { data: partnerData } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partnerData) return [];

      // Construire la requête de base
      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('activity_type', ['commission_received', 'subscription_payment_received'])
        .order('created_at', { ascending: false });

      // Filtrer par période
      if (filterPeriod !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (filterPeriod) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const filteredCommissions = commissions?.filter((commission) => {
    const matchesSearch = searchQuery === '' || 
      commission.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commission.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || 
      (filterType === 'driver' && commission.activity_type === 'commission_received') ||
      (filterType === 'subscription' && commission.activity_type === 'subscription_payment_received');

    return matchesSearch && matchesType;
  });

  const totalCommissions = filteredCommissions?.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0
  ) || 0;

  const handleExport = () => {
    toast.success('Export CSV en cours de préparation...');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="card-floating animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card className="card-floating border-0 bg-gradient-to-r from-primary to-primary/80 text-white">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-body-sm opacity-90 mb-2">Total des commissions</p>
            <p className="text-display-lg font-bold">{totalCommissions.toLocaleString()} CDF</p>
            <p className="text-caption opacity-75 mt-1">
              {filteredCommissions?.length || 0} transaction(s)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card className="card-floating border-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="driver">Commissions chauffeurs</SelectItem>
                <SelectItem value="subscription">Abonnements</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exporter CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commissions */}
      <div className="space-y-3">
        {filteredCommissions && filteredCommissions.length > 0 ? (
          filteredCommissions.map((commission) => (
            <CommissionHistoryCard key={commission.id} commission={commission} />
          ))
        ) : (
          <Card className="card-floating border-0">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-body-md text-muted-foreground">Aucune commission trouvée</p>
              <p className="text-caption text-muted-foreground mt-1">
                Essayez de modifier vos filtres
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
