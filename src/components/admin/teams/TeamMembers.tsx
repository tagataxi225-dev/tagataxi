import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  UserCheck, 
  UserX,
  Crown,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  team_name: string;
  user_email?: string;
}

export const TeamMembers: React.FC = () => {
  // Fetch all team members
  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          team_accounts!inner(name)
        `)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Get user emails from auth.admin.listUsers (simplified approach)
      const enhancedMembers = (data || []).map(member => ({
        ...member,
        team_name: member.team_accounts?.name || 'Équipe inconnue',
        user_email: `user${member.user_id.slice(-4)}@example.com` // Placeholder
      }));

      return enhancedMembers;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Crown;
      case 'member': return User;
      default: return User;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'member': return 'Membre';
      default: return role;
    }
  };

  // Group members by team
  const membersByTeam = React.useMemo(() => {
    if (!members) return {};
    
    return members.reduce((acc, member) => {
      const teamName = member.team_name;
      if (!acc[teamName]) {
        acc[teamName] = [];
      }
      acc[teamName].push(member);
      return acc;
    }, {} as Record<string, TeamMember[]>);
  }, [members]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membres des équipes ({members?.length || 0})
          </CardTitle>
        </CardHeader>
      </Card>

      {Object.entries(membersByTeam).map(([teamName, teamMembers]) => (
        <Card key={teamName}>
          <CardHeader>
            <CardTitle className="text-lg">{teamName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map((member) => {
                const RoleIcon = getRoleIcon(member.role);
                
                return (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {member.user_email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <p className="font-medium text-sm">
                          {member.user_email || `Utilisateur ${member.user_id.slice(-6)}`}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <RoleIcon className="h-3 w-3" />
                          <span>{getRoleLabel(member.role)}</span>
                          <span>•</span>
                          <span>Rejoint le {new Date(member.joined_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant={getStatusColor(member.status)}>
                      {getStatusLabel(member.status)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {Object.keys(membersByTeam).length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun membre trouvé</h3>
            <p className="text-muted-foreground">
              Les membres des équipes apparaîtront ici une fois qu'ils seront ajoutés.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};