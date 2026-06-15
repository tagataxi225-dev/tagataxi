import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { 
  User, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle 
} from 'lucide-react';

interface AuthStatusCheckerProps {
  showDetails?: boolean;
  compact?: boolean;
}

export const AuthStatusChecker: React.FC<AuthStatusCheckerProps> = ({ 
  showDetails = true, 
  compact = false 
}) => {
  const { user, session, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading } = useRoleBasedAuth();
  const { 
    userRoles, 
    permissions, 
    isAdmin, 
    isSuperAdmin, 
    primaryRole,
    loading: rolesLoading 
  } = useUserRoles();

  const getAuthStatus = () => {
    if (authLoading || roleLoading || rolesLoading) {
      return { status: 'loading', icon: Clock, message: 'Vérification...' };
    }
    
    if (!user || !session) {
      return { status: 'disconnected', icon: XCircle, message: 'Non connecté' };
    }
    
    if (!userRole) {
      return { status: 'warning', icon: AlertTriangle, message: 'Rôle non défini' };
    }
    
    return { status: 'connected', icon: CheckCircle, message: 'Connecté' };
  };

  const { status, icon: StatusIcon, message } = getAuthStatus();

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-card rounded-lg border">
        <StatusIcon className={`h-4 w-4 ${
          status === 'connected' ? 'text-green-500' :
          status === 'warning' ? 'text-yellow-500' :
          status === 'loading' ? 'text-blue-500 animate-spin' :
          'text-red-500'
        }`} />
        <span className="text-sm font-medium">{message}</span>
        {user && (
          <Badge variant="outline" className="text-xs">
            {primaryRole || userRole?.role || 'N/A'}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <StatusIcon className={`h-5 w-5 ${
            status === 'connected' ? 'text-green-500' :
            status === 'warning' ? 'text-yellow-500' :
            status === 'loading' ? 'text-blue-500 animate-spin' :
            'text-red-500'
          }`} />
          État d'Authentification
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Statut:</span>
          <Badge variant={
            status === 'connected' ? 'default' :
            status === 'warning' ? 'secondary' :
            status === 'loading' ? 'outline' :
            'destructive'
          }>
            {message}
          </Badge>
        </div>

        {showDetails && user && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Utilisateur:</span>
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
            </div>

            {userRole && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rôle principal:</span>
                <Badge variant="outline">
                  {primaryRole || userRole.role}
                </Badge>
              </div>
            )}

            {(isAdmin || isSuperAdmin) && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Privilèges:</span>
                <div className="flex gap-1">
                  {isAdmin && (
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {isSuperAdmin && (
                    <Badge className="bg-purple-100 text-purple-800 text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Super
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {permissions && permissions.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Permissions:</span>
                <Badge variant="outline" className="text-xs">
                  {permissions.length} active(s)
                </Badge>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Session:</span>
              <Badge variant="outline" className="text-xs">
                {session ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};