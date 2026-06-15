import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Eye,
  MoreHorizontal
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  contact_email: string;
  industry: string;
  team_size: number;
  status: string;
  created_at: string;
  member_count: number;
  total_bookings: number;
  total_revenue: number;
}

interface TeamOverviewProps {
  teams: Team[];
  onStatusChange: (teamId: string, status: string) => void;
}

export const TeamOverview: React.FC<TeamOverviewProps> = ({ teams, onStatusChange }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'suspended': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'suspended': return 'Suspendu';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <Badge variant={getStatusColor(team.status)}>
                  {getStatusLabel(team.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{team.industry}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{team.member_count} membres</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>{team.total_bookings} courses</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{team.total_revenue.toLocaleString()} CDF</span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Créé le {new Date(team.created_at).toLocaleDateString('fr-FR')}
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Détails
                </Button>
                
                {team.status === 'active' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onStatusChange(team.id, 'suspended')}
                  >
                    Suspendre
                  </Button>
                )}
                
                {team.status === 'suspended' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onStatusChange(team.id, 'active')}
                  >
                    Activer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {teams.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune équipe trouvée</h3>
            <p className="text-muted-foreground">
              Les équipes créées apparaîtront ici une fois qu'elles seront enregistrées.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};