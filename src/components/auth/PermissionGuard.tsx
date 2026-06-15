import { ReactNode } from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Permission, UserRole } from '@/types/roles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  requireAll?: boolean; // true = toutes les permissions requises, false = au moins une
  fallback?: ReactNode;
  showError?: boolean;
}

export const PermissionGuard = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAll = false,
  fallback = null,
  showError = false
}: PermissionGuardProps) => {
  const { hasPermission, hasAnyPermission, hasRole, loading } = useUserRoles();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Vérifier les permissions
  let hasRequiredPermissions = true;
  if (requiredPermissions.length > 0) {
    if (requireAll) {
      hasRequiredPermissions = requiredPermissions.every(permission => hasPermission(permission));
    } else {
      hasRequiredPermissions = hasAnyPermission(requiredPermissions);
    }
  }

  // Vérifier les rôles
  let hasRequiredRoles = true;
  if (requiredRoles.length > 0) {
    if (requireAll) {
      hasRequiredRoles = requiredRoles.every(role => hasRole(role));
    } else {
      hasRequiredRoles = requiredRoles.some(role => hasRole(role));
    }
  }

  const hasAccess = hasRequiredPermissions && hasRequiredRoles;

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showError) {
      return (
        <Alert className="m-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  return <>{children}</>;
};