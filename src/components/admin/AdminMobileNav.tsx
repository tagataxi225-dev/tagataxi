import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  FileText, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAdminPermissions } from '@/components/admin/AdminPermissionContext';
import { Permission } from '@/types/roles';

interface AdminMobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  requiredPermissions: Permission[];
}

export const AdminMobileNav: React.FC<AdminMobileNavProps> = ({
  activeTab,
  onTabChange
}) => {
  const { hasAnyPermission, isSuperAdmin } = useUserRoles();
  const { showAllSections } = useAdminPermissions();

  const navItems: NavItem[] = [
    { id: 'overview', icon: LayoutDashboard, label: 'Accueil', requiredPermissions: ['analytics_read'] },
    { id: 'users', icon: Users, label: 'Utilisateurs', requiredPermissions: ['users_read'] },
    { id: 'operations', icon: TrendingUp, label: 'Opérations', requiredPermissions: ['transport_read'] },
    { id: 'reports', icon: FileText, label: 'Rapports', requiredPermissions: ['analytics_read'] },
    { id: 'settings', icon: Settings, label: 'Paramètres', requiredPermissions: ['system_admin'] },
  ];

  const filteredItems = useMemo(() => {
    return navItems.filter(item => {
      if (isSuperAdmin || showAllSections) return true;
      return hasAnyPermission(item.requiredPermissions);
    });
  }, [isSuperAdmin, showAllSections, hasAnyPermission]);

  return (
    <nav className="flex items-center justify-around px-2 py-2">
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'relative flex flex-col items-center gap-1 p-2 min-w-14 rounded-lg transition-all',
              isActive ? 'bg-primary/10' : 'hover:bg-accent'
            )}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.05 }}
              className={cn(
                'transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-6 w-6" />
            </motion.div>
            
            <span className={cn(
              'text-[10px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}>
              {item.label}
            </span>
            
            {isActive && (
              <motion.div
                layoutId="adminActiveIndicator"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 bg-primary rounded-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
