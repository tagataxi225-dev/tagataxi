import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useRoleManagement } from '@/hooks/useRoleManagement';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Users, Shield, Settings, UserCheck, Crown, History, FileText, AlertTriangle, Trash2, RefreshCw, Upload } from 'lucide-react';
import { UserRole, AdminRole, Permission, ROLE_LABELS, ADMIN_ROLE_LABELS, PERMISSION_LABELS } from '@/types/roles';

interface UserWithRoles {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  created_at: string;
  userRoles: Array<{
    role: UserRole;
    admin_role?: AdminRole;
    assigned_at: string;
    is_active: boolean;
  }>;
}

interface RoleHistory {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  user_id?: string;
  metadata?: any;
}

// Matrice des permissions par rôle admin
const PERMISSION_MATRIX: Record<AdminRole, Permission[]> = {
  super_admin: Object.keys(PERMISSION_LABELS) as Permission[],
  admin_financier: ['finance_read', 'finance_write', 'finance_admin', 'analytics_read', 'users_read'],
  admin_transport: ['transport_read', 'transport_write', 'transport_admin', 'drivers_read', 'drivers_write', 'drivers_validate', 'vehicle_settings_manage', 'analytics_read'],
  admin_marketplace: ['marketplace_read', 'marketplace_write', 'marketplace_moderate', 'analytics_read', 'users_read'],
  admin_food: ['food_read', 'food_write', 'food_moderate', 'food_admin', 'analytics_read'],
  admin_support: ['support_read', 'support_write', 'support_admin', 'users_read', 'notifications_read', 'notifications_write'],
  moderator: ['users_read', 'marketplace_moderate', 'food_moderate', 'support_read', 'notifications_read'],
};

export const EnhancedRoleManagement = () => {
  const { toast } = useToast();
  const { isSuperAdmin } = useUserRoles();
  const { assignRole, removeRole, syncPermissionsToDb, loading } = useRoleManagement();
  
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roleHistory, setRoleHistory] = useState<RoleHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [selectedAdminRole, setSelectedAdminRole] = useState<AdminRole | undefined>();
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; role: UserRole; adminRole?: AdminRole; email: string } | null>(null);

  const [roleStats, setRoleStats] = useState({
    totalUsers: 0,
    admins: 0,
    drivers: 0,
    partners: 0,
    clients: 0,
    recentAssignments: 0
  });

  const fetchUsersWithRoles = async () => {
    try {
      setLoadingUsers(true);
      
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (rolesError) throw rolesError;

      const { data: clientsData } = await supabase
        .from('clients')
        .select('user_id, display_name, email');

      const { data: driversData } = await supabase
        .from('chauffeurs')
        .select('user_id, display_name, email');

      const { data: adminsData } = await supabase
        .from('admins')
        .select('user_id, display_name, email');

      const profilesMap = new Map<string, { email: string; displayName: string }>();

      clientsData?.forEach(c => profilesMap.set(c.user_id, { email: c.email, displayName: c.display_name }));
      driversData?.forEach(d => profilesMap.set(d.user_id, { email: d.email, displayName: d.display_name || '' }));
      adminsData?.forEach(a => profilesMap.set(a.user_id, { email: a.email, displayName: a.display_name }));

      const allUserIds = [...new Set(rolesData?.map((r: any) => r.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, phone_number')
        .in('user_id', allUserIds);
      const phoneMap = new Map((profilesData || []).map((p: any) => [p.user_id, p.phone_number as string | undefined]));

      const userRolesMap = new Map<string, Array<{
        role: UserRole;
        admin_role?: AdminRole;
        assigned_at: string;
        is_active: boolean;
      }>>();

      rolesData?.forEach(r => {
        const userId = r.user_id;
        if (!userRolesMap.has(userId)) {
          userRolesMap.set(userId, []);
        }
        userRolesMap.get(userId)!.push({
          role: r.role as UserRole,
          admin_role: r.admin_role as AdminRole | undefined,
          assigned_at: r.assigned_at,
          is_active: r.is_active
        });
      });

      const usersWithRoles: UserWithRoles[] = Array.from(userRolesMap.entries()).map(([userId, roles]) => {
        const profile = profilesMap.get(userId);
        return {
          id: userId,
          email: profile?.email || 'Email inconnu',
          displayName: profile?.displayName || '',
          phone: phoneMap.get(userId),
          created_at: roles[0]?.assigned_at || new Date().toISOString(),
          userRoles: roles
        };
      });

      setUsers(usersWithRoles);

      const stats = {
        totalUsers: usersWithRoles.length,
        admins: usersWithRoles.filter(u => u.userRoles.some(r => r.role === 'admin')).length,
        drivers: usersWithRoles.filter(u => u.userRoles.some(r => r.role === 'driver')).length,
        partners: usersWithRoles.filter(u => u.userRoles.some(r => r.role === 'partner')).length,
        clients: usersWithRoles.filter(u => u.userRoles.some(r => r.role === 'client')).length,
        recentAssignments: rolesData?.filter(r => 
          new Date(r.assigned_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length || 0
      };
      setRoleStats(stats);

    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchRoleHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('activity_type', 'role_assignment')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setRoleHistory(data || []);
    } catch (error) {
      console.error('Error fetching role history:', error);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsersWithRoles();
      fetchRoleHistory();
    }
  }, [isSuperAdmin]);

  const handleAssignRole = async () => {
    if (!selectedUser) return;

    const success = await assignRole(
      selectedUser.id, 
      selectedRole, 
      selectedRole === 'admin' ? selectedAdminRole : undefined
    );

    if (success) {
      toast({
        title: "Rôle assigné",
        description: `Le rôle ${ROLE_LABELS[selectedRole]}${selectedAdminRole ? ` (${ADMIN_ROLE_LABELS[selectedAdminRole]})` : ''} a été assigné avec succès.`,
      });
      fetchUsersWithRoles();
      fetchRoleHistory();
      setDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole('client');
      setSelectedAdminRole(undefined);
    }
  };

  const handleRemoveRole = async () => {
    if (!deleteConfirm) return;
    
    const success = await removeRole(deleteConfirm.userId, deleteConfirm.role, deleteConfirm.adminRole);

    if (success) {
      toast({
        title: "Rôle retiré",
        description: `Le rôle a été retiré avec succès.`,
      });
      fetchUsersWithRoles();
      fetchRoleHistory();
    }
    setDeleteConfirm(null);
  };

  const handleSyncPermissions = async () => {
    setSyncing(true);
    const success = await syncPermissionsToDb(PERMISSION_MATRIX as Record<string, Permission[]>);
    setSyncing(false);
    if (success) {
      toast({
        title: "Permissions synchronisées",
        description: "La matrice de permissions a été synchronisée avec la base de données.",
      });
    } else {
      toast({
        title: "Erreur",
        description: "La synchronisation a échoué.",
        variant: "destructive",
      });
    }
  };

  const openAssignDialog = (user: UserWithRoles) => {
    setSelectedUser(user);
    setSelectedRole('client');
    setSelectedAdminRole(undefined);
    setDialogOpen(true);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = user.email.toLowerCase().includes(query) ||
             user.displayName.toLowerCase().includes(query) ||
             (user.phone?.toLowerCase().includes(query) ?? false);
      
      if (roleFilter === 'all') return matchesSearch;
      
      return matchesSearch && user.userRoles.some(r => {
        if (roleFilter.startsWith('admin_') || roleFilter === 'super_admin' || roleFilter === 'moderator') {
          return r.role === 'admin' && r.admin_role === roleFilter && r.is_active;
        }
        return r.role === roleFilter && r.is_active;
      });
    });
  }, [users, searchQuery, roleFilter]);

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Accès refusé</p>
            <p className="text-muted-foreground">Seuls les super administrateurs peuvent gérer les rôles.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion Avancée des Rôles</h1>
          <p className="text-muted-foreground">
            Gérez les rôles, permissions et accès des utilisateurs avec audit complet
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Crown className="w-4 h-4" />
          Super Admin uniquement
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{roleStats.totalUsers}</p>
              </div>
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-blue-600">{roleStats.admins}</p>
              </div>
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chauffeurs</p>
                <p className="text-2xl font-bold text-green-600">{roleStats.drivers}</p>
              </div>
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Partenaires</p>
                <p className="text-2xl font-bold text-purple-600">{roleStats.partners}</p>
              </div>
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold text-orange-600">{roleStats.clients}</p>
              </div>
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Récents</p>
                <p className="text-2xl font-bold text-emerald-600">{roleStats.recentAssignments}</p>
              </div>
              <History className="h-6 w-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Utilisateurs & Rôles</TabsTrigger>
          <TabsTrigger value="admins">Admins actifs</TabsTrigger>
          <TabsTrigger value="permissions">Matrice Permissions</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Search + Filter */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher par email, nom ou téléphone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Filtrer :</span>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="client">Clients</SelectItem>
                    <SelectItem value="driver">Chauffeurs</SelectItem>
                    <SelectItem value="partner">Partenaires</SelectItem>
                    <SelectItem value="admin">Admins (tous)</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin_transport">Admin Transport</SelectItem>
                    <SelectItem value="admin_food">Admin Food</SelectItem>
                    <SelectItem value="admin_marketplace">Admin Marketplace</SelectItem>
                    <SelectItem value="admin_financier">Admin Financier</SelectItem>
                    <SelectItem value="admin_support">Admin Support</SelectItem>
                    <SelectItem value="moderator">Modérateur</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={fetchUsersWithRoles} disabled={loadingUsers}>
                  <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs et Rôles ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Rôles Actuels</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.displayName || user.email}</div>
                              {user.displayName && (
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              )}
                              {user.phone && (
                                <div className="text-xs text-muted-foreground">{user.phone}</div>
                              )}
                              <div className="text-xs text-muted-foreground">{user.id.substring(0, 8)}...</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.userRoles.length === 0 ? (
                                <Badge variant="outline">Aucun rôle</Badge>
                              ) : (
                                user.userRoles.map((userRole, index) => (
                                  <Badge 
                                    key={index}
                                    variant={userRole.role === 'admin' ? 'default' : 'secondary'}
                                    className={`gap-1 ${!userRole.is_active ? 'opacity-50 line-through' : ''}`}
                                  >
                                    {ROLE_LABELS[userRole.role]}
                                    {userRole.admin_role && ` (${ADMIN_ROLE_LABELS[userRole.admin_role]})`}
                                    <button
                                      onClick={() => setDeleteConfirm({ 
                                        userId: user.id, 
                                        role: userRole.role, 
                                        adminRole: userRole.admin_role, 
                                        email: user.email 
                                      })}
                                      className="ml-1 text-xs hover:text-destructive transition-colors"
                                      disabled={loading}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.userRoles.every(r => r.is_active) ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">Actif</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800">Mixte</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openAssignDialog(user)}
                            >
                              Gérer rôles
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Administrateurs actifs ({users.filter(u => u.userRoles.some(r => r.role === 'admin' && r.is_active)).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Administrateur</TableHead>
                      <TableHead>Rôle admin</TableHead>
                      <TableHead>Assigné le</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter(u => u.userRoles.some(r => r.role === 'admin' && r.is_active))
                      .map(user => {
                        const adminRoles = user.userRoles.filter(r => r.role === 'admin' && r.is_active);
                        return adminRoles.map((adminRole, idx) => (
                          <TableRow key={`${user.id}-${idx}`}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.displayName || user.email}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                {user.phone && <div className="text-xs text-muted-foreground">{user.phone}</div>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default" className="gap-1">
                                <Crown className="w-3 h-3" />
                                {adminRole.admin_role ? ADMIN_ROLE_LABELS[adminRole.admin_role] : 'Admin'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(adminRole.assigned_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteConfirm({
                                  userId: user.id,
                                  role: 'admin',
                                  adminRole: adminRole.admin_role,
                                  email: user.email
                                })}
                                disabled={loading}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Révoquer
                              </Button>
                            </TableCell>
                          </TableRow>
                        ));
                      })}
                    {users.filter(u => u.userRoles.some(r => r.role === 'admin' && r.is_active)).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Aucun administrateur actif
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Matrice des Permissions par Rôle Admin
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSyncPermissions}
                  disabled={syncing}
                  className="gap-2"
                >
                  <Upload className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  Synchroniser vers DB
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Permission</TableHead>
                    {(Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map(role => (
                      <TableHead key={role} className="text-center min-w-[100px]">
                        <span className="text-xs">{ADMIN_ROLE_LABELS[role]}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Object.keys(PERMISSION_LABELS) as Permission[]).map(permission => (
                    <TableRow key={permission}>
                      <TableCell className="text-sm font-medium">{PERMISSION_LABELS[permission]}</TableCell>
                      {(Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map(role => {
                        const hasPermission = PERMISSION_MATRIX[role]?.includes(permission);
                        return (
                          <TableCell key={role} className="text-center">
                            <Checkbox
                              checked={hasPermission}
                              disabled
                              className={hasPermission ? 'data-[state=checked]:bg-primary' : ''}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historique des Assignations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roleHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Aucun historique disponible</p>
                ) : (
                  roleHistory.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{entry.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{entry.activity_type}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Role Dialog — extracted, single instance */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setSelectedUser(null);
          setSelectedRole('client');
          setSelectedAdminRole(undefined);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un rôle</DialogTitle>
            <DialogDescription>{selectedUser?.displayName || selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rôle principal</label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[400]">
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="driver">Chauffeur</SelectItem>
                  <SelectItem value="partner">Partenaire</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="vendor">Vendeur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRole === 'admin' && (
              <div>
                <label className="text-sm font-medium">Rôle administrateur</label>
                <Select value={selectedAdminRole} onValueChange={(value) => setSelectedAdminRole(value as AdminRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle admin" />
                  </SelectTrigger>
                  <SelectContent className="z-[400]">
                    <SelectItem value="super_admin">Super Administrateur</SelectItem>
                    <SelectItem value="admin_financier">Admin Financier</SelectItem>
                    <SelectItem value="admin_transport">Admin Transport</SelectItem>
                    <SelectItem value="admin_marketplace">Admin Marketplace</SelectItem>
                    <SelectItem value="admin_food">Admin Food</SelectItem>
                    <SelectItem value="admin_support">Admin Support</SelectItem>
                    <SelectItem value="moderator">Modérateur</SelectItem>
                  </SelectContent>
                </Select>

                {selectedAdminRole && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Permissions incluses :</p>
                    <div className="flex flex-wrap gap-1">
                      {PERMISSION_MATRIX[selectedAdminRole]?.map(perm => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {PERMISSION_LABELS[perm]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button 
                onClick={handleAssignRole}
                disabled={loading || !selectedUser || (selectedRole === 'admin' && !selectedAdminRole)}
              >
                Assigner le rôle
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmer la suppression du rôle
            </AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment retirer le rôle <strong>{deleteConfirm && ROLE_LABELS[deleteConfirm.role]}</strong>
              {deleteConfirm?.adminRole && ` (${ADMIN_ROLE_LABELS[deleteConfirm.adminRole]})`} de l'utilisateur <strong>{deleteConfirm?.email}</strong> ?
              <br /><br />
              Cette action est irréversible et l'utilisateur perdra immédiatement les accès associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Retirer le rôle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
