import React, { useState } from 'react';
import { Search, Gift, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Driver {
  user_id: string;
  display_name: string;
  email: string;
  phone_number: string;
  license_number: string;
}

export const TrialManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searching, setSearching] = useState(false);
  const [granting, setGranting] = useState<string | null>(null);
  const { toast } = useToast();

  const searchDrivers = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('user_id, display_name, email, phone_number, license_number')
        .or(`email.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,license_number.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      setDrivers(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "Aucun résultat",
          description: "Aucun chauffeur trouvé avec ces critères de recherche.",
        });
      }
    } catch (error: any) {
      console.error('Error searching drivers:', error);
      toast({
        title: "Erreur de recherche",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const grantTrial = async (driver: Driver) => {
    setGranting(driver.user_id);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-grant-trial', {
        body: {
          driverId: driver.user_id,
          trialDurationDays: 30,
          ridesIncluded: 20
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      toast({
        title: "✅ Essai gratuit accordé",
        description: `${driver.display_name} a reçu 30 jours d'essai avec 20 courses.`,
      });

      // Retirer le chauffeur de la liste
      setDrivers(prev => prev.filter(d => d.user_id !== driver.user_id));

    } catch (error: any) {
      console.error('Error granting trial:', error);
      toast({
        title: "Erreur",
        description: error.message || 'Impossible d\'accorder l\'essai gratuit.',
        variant: "destructive",
      });
    } finally {
      setGranting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Gestion des Essais Gratuits
        </CardTitle>
        <CardDescription>
          Accordez des périodes d'essai gratuites aux chauffeurs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barre de recherche */}
        <div className="flex gap-2">
          <Input
            placeholder="Rechercher par email, téléphone, nom ou permis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchDrivers()}
            className="flex-1"
          />
          <Button 
            onClick={searchDrivers}
            disabled={searching || !searchQuery.trim()}
          >
            <Search className="h-4 w-4 mr-2" />
            {searching ? 'Recherche...' : 'Rechercher'}
          </Button>
        </div>

        {/* Résultats de recherche */}
        {drivers.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">
              {drivers.length} chauffeur(s) trouvé(s)
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {drivers.map((driver) => (
                <Card key={driver.user_id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold truncate">
                        {driver.display_name || 'Sans nom'}
                      </h5>
                      <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-muted-foreground">
                        <span className="truncate">{driver.email}</span>
                        <span>{driver.phone_number}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Permis: {driver.license_number}
                      </p>
                    </div>
                    <Button
                      onClick={() => grantTrial(driver)}
                      disabled={granting === driver.user_id}
                      variant="default"
                      size="sm"
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      {granting === driver.user_id ? 'Attribution...' : 'Essai 30j'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Informations sur l'essai */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            Détails de l'essai gratuit
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• <strong>Durée:</strong> 30 jours</li>
            <li>• <strong>Courses incluses:</strong> 20</li>
            <li>• <strong>Prix:</strong> Gratuit</li>
            <li>• <strong>Renouvellement:</strong> Non automatique</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};