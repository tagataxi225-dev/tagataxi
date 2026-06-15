import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAdminPermissions } from '@/components/admin/AdminPermissionContext';
import { Permission } from '@/types/roles';
import {
  BarChart3,
  CreditCard,
  Percent,
  PieChart,
  Tag,
  MapPin,
  Car,
  Users,
  ShoppingBag,
  Headphones,
  Settings,
  Bell,
  Zap,
  Database,
  Megaphone,
  Trophy,
  Building,
  Shield,
  Cog,
  Package,
  Search,
  ChevronDown,
  ChevronRight,
  XCircle,
  UtensilsCrossed,
  Image,
  Crown,
  Star,
  Lightbulb,
  LogOut,
} from 'lucide-react';

interface AdminVerticalNavProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
  devMode?: boolean;
  isMobile?: boolean;
}

const NAV_ITEMS: Array<{
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group?: string;
  devMode?: boolean;
  badge?: string;
  path?: string;
  requiredPermissions: Permission[];
}> = [
  // Tableau de bord
  { id: 'overview', label: "Vue d'ensemble", icon: BarChart3, group: 'dashboard', requiredPermissions: ['analytics_read'] },
  
  // Finances
  { id: 'financial-stats', label: 'Revenus', icon: PieChart, group: 'finance', requiredPermissions: ['finance_read'] },
  { id: 'subscriptions', label: 'Abonnements', icon: Package, group: 'finance', requiredPermissions: ['finance_admin'] },
  
  // Opérations
  { id: 'transport-management', label: 'Transport', icon: Car, group: 'operations', requiredPermissions: ['transport_admin'] },
  { id: 'delivery-management', label: 'Livraisons', icon: Package, group: 'operations', requiredPermissions: ['transport_admin'] },
  { id: 'rental-analytics', label: 'Location', icon: Car, group: 'operations', requiredPermissions: ['transport_admin'] },
  { id: 'tarifs', label: 'Tarifs', icon: Tag, group: 'operations', requiredPermissions: ['finance_admin'] },
  { id: 'zones', label: 'Zones', icon: MapPin, group: 'operations', requiredPermissions: ['transport_admin'] },
  { id: 'vehicle-moderation', label: 'Modération véhicules', icon: Shield, group: 'operations', badge: 'NEW', requiredPermissions: ['transport_admin'] },
  
  // Utilisateurs
  { id: 'drivers', label: 'Chauffeurs', icon: Car, group: 'users', requiredPermissions: ['drivers_read'] },
  { id: 'partners', label: 'Partenaires', icon: Building, group: 'users', requiredPermissions: ['partners_read'] },
  { id: 'users', label: 'Utilisateurs', icon: Users, group: 'users', requiredPermissions: ['users_read'] },
  { id: 'roles', label: 'Rôles & Agents', icon: Shield, group: 'users', requiredPermissions: ['users_write'] },
  
  // Commerce
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, group: 'commerce', requiredPermissions: ['marketplace_read'] },
  { id: 'escrow', label: 'Escrow & Conflits', icon: Shield, group: 'commerce', badge: 'NEW', requiredPermissions: ['finance_admin'] },
  { id: 'food-management', label: 'Restaurants', icon: UtensilsCrossed, group: 'commerce', requiredPermissions: ['food_admin'] },
  { id: 'promocodes', label: 'Codes Promo', icon: Tag, group: 'commerce', requiredPermissions: ['marketplace_write'] },
  { id: 'ambassadors', label: 'Ambassadeurs', icon: Crown, group: 'commerce', badge: 'NEW', requiredPermissions: ['system_admin'] },
  { id: 'lottery', label: 'Tombola', icon: Trophy, group: 'commerce', requiredPermissions: ['system_admin'] },
  
  // Communication
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'communication', requiredPermissions: ['notifications_read'] },
  { id: 'support', label: 'Support', icon: Headphones, group: 'communication', requiredPermissions: ['support_read'] },
  { id: 'ratings', label: 'Évaluations', icon: Star, group: 'communication', requiredPermissions: ['support_read'] },
  { id: 'suggestions', label: 'Suggestions', icon: Lightbulb, group: 'communication', path: '/operatorx/admin/suggestions', requiredPermissions: ['support_read'] },
  
  // Contenu
  { id: 'banners', label: 'Bannières', icon: Image, group: 'commerce', requiredPermissions: ['notifications_write'] },
  
  // Système
  { id: 'cancellations', label: 'Annulations', icon: XCircle, group: 'system', requiredPermissions: ['analytics_read'] },
  { id: 'settings', label: 'Paramètres', icon: Settings, group: 'system', requiredPermissions: ['system_admin'] },
  { id: 'app-versions', label: 'Versions App', icon: Zap, group: 'system', requiredPermissions: ['system_admin'] },
  { id: 'test-data', label: 'Données de Test', icon: Database, group: 'system', devMode: true, requiredPermissions: ['system_admin'] },
];

const GROUP_LABELS = {
  dashboard: 'Tableau de bord',
  finance: 'Finances',
  operations: 'Opérations',
  users: 'Utilisateurs',
  commerce: 'Commerce',
  communication: 'Communication',
  system: 'Système'
};

export const AdminVerticalNav: React.FC<AdminVerticalNavProps> = ({ 
  activeTab, 
  onTabChange, 
  className, 
  devMode = true,
  isMobile = false
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('admin-nav-collapsed');
    const defaults = saved ? JSON.parse(saved) : {};
    defaults.finance = false;
    return defaults;
  });

  const { hasAnyPermission, isSuperAdmin, loading: rolesLoading } = useUserRoles();
  const { showAllSections } = useAdminPermissions();

  // Filter nav items based on user permissions
  const permittedItems = useMemo(() => {
    return NAV_ITEMS.filter(item => {
      if (item.devMode && !devMode) return false;
      // Super admin or "show all" mode → see everything
      if (isSuperAdmin || showAllSections) return true;
      // Check if user has at least one required permission
      return hasAnyPermission(item.requiredPermissions);
    });
  }, [devMode, isSuperAdmin, showAllSections, hasAnyPermission]);

  const groupedItems = useMemo(() => {
    return permittedItems.reduce((groups, item) => {
      const group = item.group || 'other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, typeof NAV_ITEMS>);
  }, [permittedItems]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedItems;
    
    const filtered: Record<string, typeof NAV_ITEMS> = {};
    Object.entries(groupedItems).forEach(([groupKey, items]) => {
      const matchingItems = items.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (GROUP_LABELS[groupKey as keyof typeof GROUP_LABELS] || groupKey)
          .toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingItems.length > 0) {
        filtered[groupKey] = matchingItems;
      }
    });
    return filtered;
  }, [groupedItems, searchQuery]);

  const toggleGroup = (groupKey: string) => {
    const newCollapsed = { 
      ...collapsedGroups, 
      [groupKey]: !collapsedGroups[groupKey] 
    };
    setCollapsedGroups(newCollapsed);
    localStorage.setItem('admin-nav-collapsed', JSON.stringify(newCollapsed));
  };

  const isGroupExpanded = (groupKey: string) => {
    if (searchQuery.trim()) return true;
    const hasActiveItem = groupedItems[groupKey]?.some(item => item.id === activeTab);
    if (hasActiveItem) return true;
    return !collapsedGroups[groupKey];
  };

  return (
    <div className={cn('flex flex-col h-full w-full', className)}>
      {isMobile && (
        <div className="shrink-0 p-3 border-b border-border/60 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-background/50"
            />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 w-full admin-scrollbar">
        <nav role="navigation" aria-label="Navigation admin" className="p-3 pb-20 space-y-2 smooth-scroll">
          {Object.entries(filteredGroups).map(([groupKey, items], groupIndex) => {
            const isExpanded = isGroupExpanded(groupKey);
            const groupLabel = GROUP_LABELS[groupKey as keyof typeof GROUP_LABELS] || groupKey;
            
            return (
              <Collapsible key={groupKey} open={isExpanded} onOpenChange={() => toggleGroup(groupKey)}>
                {groupIndex > 0 && <Separator className="my-3" />}
                
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-between px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/40 rounded-md',
                      isMobile && 'h-11 text-sm'
                    )}
                  >
                    <span>{groupLabel}</span>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-1 mt-1 pl-2">
                  {items.map(({ id, label, icon: Icon, devMode: isDevMode, badge, path }) => {
                    const active = activeTab === id;
                    return (
                      <Button
                        key={id}
                        variant={active ? "secondary" : "ghost"}
                        className={cn(
                          'w-full justify-start gap-3 px-3 py-2 h-auto text-sm font-medium rounded-md transition-all',
                          active
                            ? 'bg-secondary text-secondary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                          isMobile && 'py-2.5 text-base'
                        )}
                        onClick={() => path ? navigate(path) : onTabChange(id)}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{label}</span>
                        {badge && (
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold bg-primary/20 text-primary rounded">
                            {badge}
                          </span>
                        )}
                        {isDevMode && (
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-400 rounded">
                            DEV
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-10" />
      </ScrollArea>

      {/* Logout — always at the bottom of the nav */}
      <div className="mt-auto pt-4 border-t border-gray-200 px-3 pb-3">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );
};

export default AdminVerticalNav;
