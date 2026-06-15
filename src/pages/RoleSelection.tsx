import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSelectedRole } from '@/hooks/useSelectedRole';
import { UserRole } from '@/types/roles';
import { Loader2, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const RoleSelection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRoles, loading } = useUserRoles();
  const { selectedRole, setSelectedRole } = useSelectedRole();
  
  // Récupérer l'intention de connexion (driver/partner/client) si disponible
  const loginIntent = localStorage.getItem('kwenda_login_intent') as UserRole | null;
  const [tempSelectedRole, setTempSelectedRole] = useState<UserRole | null>(
    loginIntent || selectedRole || null
  );

  useEffect(() => {
    // Si une intention de connexion existe (ex: connexion via /driver/auth)
    if (loginIntent) {
      localStorage.removeItem('kwenda_login_intent');
      
      // Vérifier si l'utilisateur a bien ce rôle
      const availableRoles = userRoles.map(ur => ur.role as UserRole);
      const hasIntendedRole = availableRoles.includes(loginIntent);
      
      if (hasIntendedRole) {
        // Redirection automatique sans attendre le clic
        toast({
          title: t('auth.auto_redirect'),
          description: loginIntent === 'driver' 
            ? t('auth.accessing_space_driver')
            : loginIntent === 'client'
            ? t('auth.accessing_space_client')
            : loginIntent === 'partner'
            ? t('auth.accessing_space_partner')
            : t('auth.accessing_space_admin'),
        });
        setSelectedRole(loginIntent);
        navigateToRole(loginIntent);
        return;
      }
    }
    
    // Si l'utilisateur n'a qu'un seul rôle, rediriger automatiquement
    if (!loading && userRoles.length === 1) {
      const role = userRoles[0].role as UserRole;
      setSelectedRole(role);
      navigateToRole(role);
      return;
    }

    // Si utilisateur a plusieurs rôles MAIS un rôle 'client', auto-sélectionner client
    if (!loading && userRoles.length > 1 && !selectedRole) {
      const hasClientRole = userRoles.some(ur => ur.role === 'client');
      if (hasClientRole && !loginIntent) {
        // Auto-sélection du rôle client par défaut
        setSelectedRole('client');
        navigateToRole('client');
        return;
      }
    }
  }, [loading, userRoles, loginIntent]);

  const navigateToRole = (role: UserRole) => {
    const paths: Record<UserRole, string> = {
      admin: '/operatorx/admin',
      partner: '/app/partenaire',
      driver: '/app/chauffeur',
      client: '/app/client',
      restaurant: '/app/restaurant',
      vendor: '/vendeur'
    };
    navigate(paths[role] || '/');
  };

  const handleContinue = () => {
    if (tempSelectedRole) {
      setSelectedRole(tempSelectedRole);
      navigateToRole(tempSelectedRole);
    }
  };

  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de se déconnecter"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-gray-900 dark:to-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const availableRoles = userRoles.map(ur => ur.role as UserRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('auth.choose_space')}
          </h1>
          <p className="text-muted-foreground dark:text-gray-400">
            {t('auth.multiple_roles_info')}
          </p>
        </div>

        <RoleSelector
          availableRoles={availableRoles}
          onRoleSelect={setTempSelectedRole}
          selectedRole={tempSelectedRole}
        />

        <div className="flex justify-center gap-4 mt-8">
          <Button
            onClick={handleContinue}
            disabled={!tempSelectedRole}
            size="lg"
            className="px-8"
          >
            {t('common.continue')}
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="lg"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
