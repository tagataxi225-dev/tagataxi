import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserDataTable } from './UserDataTable';
import { UserFilters } from './UserFilters';
import { UserStatsCards } from './UserStatsCards';
import { BulkActions } from './BulkActions';
import { UserProfileDialog } from './UserProfileDialog';
import { UserEditDialog } from './UserEditDialog';
import { VerificationDetailDialog } from '../VerificationDetailDialog';
import { useAdvancedUserManagement } from '@/hooks/useAdvancedUserManagement';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Users } from 'lucide-react';

export const AdvancedUserManagement: React.FC = () => {
  const {
    users,
    stats,
    loading,
    error,
    totalPages,
    currentPage,
    filters,
    setFilters,
    setCurrentPage,
    refreshData,
    exportUsers,
    bulkAction,
  } = useAdvancedUserManagement();

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [verifyingUser, setVerifyingUser] = useState<any>(null);

  const handleSelectUser = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;
    
    await bulkAction(selectedUsers, action);
    setSelectedUsers([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-heading-lg font-bold text-foreground">
              Gestion des Utilisateurs
            </h1>
            <p className="text-body-sm text-muted-foreground">
              Gérez tous les utilisateurs, chauffeurs et partenaires de la plateforme
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportUsers}
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <UserStatsCards stats={stats} />

      {/* Filters */}
      <UserFilters
        filters={filters}
        onFiltersChange={setFilters}
        loading={loading}
      />

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <BulkActions
          selectedCount={selectedUsers.length}
          onAction={handleBulkAction}
          onClear={() => setSelectedUsers([])}
        />
      )}

      {/* Main Data Table */}
      <Card className="card-floating border-0">
        <CardHeader>
          <CardTitle className="text-heading-md">
            Liste des Utilisateurs
            {users.length > 0 && (
              <span className="text-muted-foreground text-body-sm font-normal ml-2">
                ({users.length} utilisateurs affichés)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserDataTable
            users={users}
            loading={loading}
            error={error}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            selectedUsers={selectedUsers}
            onSelectUser={handleSelectUser}
            onSelectAll={handleSelectAll}
            filters={filters}
            onSortChange={(sortBy, sortOrder) => 
              setFilters({ sortBy, sortOrder })
            }
            onViewUser={setViewingUser}
            onEditUser={setEditingUser}
            onVerifyUser={setVerifyingUser}
          />
        </CardContent>
      </Card>

      {/* Dialogues */}
      <UserProfileDialog
        user={viewingUser}
        open={!!viewingUser}
        onOpenChange={(open) => !open && setViewingUser(null)}
      />

      <UserEditDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSuccess={refreshData}
      />

      {verifyingUser && (
        <VerificationDetailDialog
          verification={{
            id: crypto.randomUUID(),
            user_id: verifyingUser.id,
            user_type: verifyingUser.user_type || 'client',
            verification_type: 'identity',
            status: 'pending',
            phone_verified: false,
            identity_verified: false,
            verification_level: 'none',
            verification_data: {},
            verification_documents: [],
            documents: [],
            verified_by: null,
            verified_at: null,
            expires_at: null,
            rejection_reason: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }}
          open={!!verifyingUser}
          onClose={() => setVerifyingUser(null)}
          onSuccess={() => {
            setVerifyingUser(null);
            refreshData();
          }}
        />
      )}
    </div>
  );
};