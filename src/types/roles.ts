// Types pour le système de rôles et permissions

export type UserRole = 'client' | 'driver' | 'partner' | 'admin' | 'restaurant' | 'vendor';

export type AdminRole = 
  | 'super_admin'
  | 'admin_financier' 
  | 'admin_transport'
  | 'admin_marketplace'
  | 'admin_food'
  | 'admin_support'
  | 'moderator';

export type Permission = 
  | 'users_read'
  | 'users_write'
  | 'users_delete'
  | 'drivers_read'
  | 'drivers_write'
  | 'drivers_validate'
  | 'partners_read'
  | 'partners_write'
  | 'partners_validate'
  | 'finance_read'
  | 'finance_write'
  | 'finance_admin'
  | 'transport_read'
  | 'transport_write'
  | 'transport_admin'
  | 'marketplace_read'
  | 'marketplace_write'
  | 'marketplace_moderate'
  | 'food_read'
  | 'food_write'
  | 'food_moderate'
  | 'food_admin'
  | 'support_read'
  | 'support_write'
  | 'support_admin'
  | 'analytics_read'
  | 'analytics_admin'
  | 'vehicle_settings_manage'
  | 'notifications_read'
  | 'notifications_write'
  | 'notifications_admin'
  | 'system_admin';

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  admin_role?: AdminRole;
  assigned_by?: string;
  assigned_at: string;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  admin_role?: AdminRole;
  permission: Permission;
  is_active: boolean;
  created_at: string;
}

export interface UserRoleInfo {
  role: UserRole;
  admin_role?: AdminRole;
  permissions: Permission[];
}

// Mapping des rôles pour l'affichage
export const ROLE_LABELS: Record<UserRole, string> = {
  client: 'Client',
  driver: 'Chauffeur',
  vendor: 'Vendeur',
  partner: 'Partenaire', 
  admin: 'Administrateur',
  restaurant: 'Restaurant'
};

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Administrateur',
  admin_financier: 'Admin Financier',
  admin_transport: 'Admin Transport',
  admin_marketplace: 'Admin Marketplace',
  admin_food: 'Admin Food',
  admin_support: 'Admin Support',
  moderator: 'Modérateur'
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  users_read: 'Voir les utilisateurs',
  users_write: 'Modifier les utilisateurs',
  users_delete: 'Supprimer les utilisateurs',
  drivers_read: 'Voir les chauffeurs',
  drivers_write: 'Modifier les chauffeurs',
  drivers_validate: 'Valider les chauffeurs',
  partners_read: 'Voir les partenaires',
  partners_write: 'Modifier les partenaires',
  partners_validate: 'Valider les partenaires',
  finance_read: 'Voir les finances',
  finance_write: 'Modifier les finances',
  finance_admin: 'Admin finances',
  transport_read: 'Voir transport',
  transport_write: 'Modifier transport',
  transport_admin: 'Admin transport',
  marketplace_read: 'Voir marketplace',
  marketplace_write: 'Modifier marketplace',
  marketplace_moderate: 'Modérer marketplace',
  food_read: 'Voir Food',
  food_write: 'Modifier Food',
  food_moderate: 'Modérer Food',
  food_admin: 'Admin Food',
  support_read: 'Voir support',
  support_write: 'Modifier support',
  support_admin: 'Admin support',
  analytics_read: 'Voir analytics',
  analytics_admin: 'Admin analytics',
  vehicle_settings_manage: 'Gérer types de véhicules',
  notifications_read: 'Voir notifications',
  notifications_write: 'Envoyer notifications',
  notifications_admin: 'Admin notifications',
  system_admin: 'Admin système'
};

// Navigation pour chaque rôle admin
export interface AdminNavItem {
  id: string;
  label: string;
  requiredPermissions: Permission[];
  icon?: string;
}

export const ADMIN_NAVIGATION: AdminNavItem[] = [
  {
    id: 'overview',
    label: 'Vue d\'ensemble',
    requiredPermissions: ['analytics_read'],
    icon: 'BarChart3'
  },
  {
    id: 'users',
    label: 'Utilisateurs',
    requiredPermissions: ['users_read'],
    icon: 'Users'
  },
  {
    id: 'drivers',
    label: 'Chauffeurs',
    requiredPermissions: ['drivers_read'],
    icon: 'Car'
  },
  {
    id: 'partners',
    label: 'Partenaires',
    requiredPermissions: ['partners_read'],
    icon: 'Building'
  },
  {
    id: 'transport',
    label: 'Transport',
    requiredPermissions: ['transport_read'],
    icon: 'MapPin'
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    requiredPermissions: ['marketplace_read'],
    icon: 'ShoppingBag'
  },
  {
    id: 'finance',
    label: 'Finances',
    requiredPermissions: ['finance_read'],
    icon: 'DollarSign'
  },
  {
    id: 'support',
    label: 'Support',
    requiredPermissions: ['support_read'],
    icon: 'HelpCircle'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    requiredPermissions: ['analytics_admin'],
    icon: 'TrendingUp'
  },
  {
    id: 'settings',
    label: 'Paramètres',
    requiredPermissions: ['system_admin'],
    icon: 'Settings'
  }
];