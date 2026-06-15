import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LegalFooterLinks } from '@/components/shared/LegalFooterLinks';
import { toast } from 'sonner';
import { 
  Briefcase, 
  Calendar,
  Settings,
  Car,
  TrendingUp,
  Users
} from 'lucide-react';

export const PartnerProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 px-4">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-green-500">
            <AvatarImage src="" />
            <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-xl">
              PT
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">Partenaire Tembea</h2>
            <p className="text-sm text-muted-foreground">{user?.email || 'Email non disponible'}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Espace Partenaire
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <Briefcase className="h-3 w-3 mr-1" />
            Partenaire Actif
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Car className="h-4 w-4" />
              Chauffeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">Gérez vos chauffeurs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">-</p>
            <p className="text-xs text-muted-foreground">À venir</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/app/partenaire')}
          >
            <Users className="h-4 w-4 mr-2" />
            Gérer mes chauffeurs
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/app/partenaire')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Voir les analytics
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/app/partenaire')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Mon portefeuille
          </Button>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informations du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email || 'Non renseigné'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Statut</span>
            <Badge className="bg-green-100 text-green-700">Actif</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Liens légaux */}
      <LegalFooterLinks />
    </div>
  );
};
