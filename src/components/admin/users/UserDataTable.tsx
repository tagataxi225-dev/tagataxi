import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { UserProfile, UserFilters } from '@/hooks/useAdvancedUserManagement';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, MoreHorizontal, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserDataTableProps {
  users: UserProfile[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedUsers: string[];
  onSelectUser: (userId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  filters: UserFilters;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onViewUser?: (user: UserProfile) => void;
  onEditUser?: (user: UserProfile) => void;
  onVerifyUser?: (user: UserProfile) => void;
}

export const UserDataTable: React.FC<UserDataTableProps> = ({
  users,
  loading,
  error,
  currentPage,
  totalPages,
  onPageChange,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  filters,
  onSortChange,
  onViewUser,
  onEditUser,
  onVerifyUser,
}) => {
  const handleSort = (column: string) => {
    if (filters.sortBy === column) {
      onSortChange(column, filters.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(column, 'asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return filters.sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      case 'suspended':
        return 'bg-destructive text-destructive-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'bg-primary text-primary-foreground';
      case 'driver':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'partner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'client':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive text-body-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 sticky left-0 bg-background z-10">
                <Checkbox
                  checked={users.length > 0 && selectedUsers.length === users.length}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead className="sticky left-12 bg-background z-10">Utilisateur</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('user_type')}
                  className="h-auto p-0 font-medium"
                >
                  Type {getSortIcon('user_type')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('status')}
                  className="h-auto p-0 font-medium"
                >
                  Statut {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('created_at')}
                  className="h-auto p-0 font-medium"
                >
                  Inscription {getSortIcon('created_at')}
                </Button>
              </TableHead>
              <TableHead>Dernière Connexion</TableHead>
              <TableHead className="w-12 sticky right-0 bg-background z-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="sticky left-0 bg-background"><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell className="sticky left-12 bg-background">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="sticky right-0 bg-background"><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="sticky left-0 bg-background">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => onSelectUser(user.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="sticky left-12 bg-background">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>
                          {user.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {user.display_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getUserTypeColor(user.user_type)}>
                      {user.user_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <time className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                    </time>
                  </TableCell>
                   <TableCell>
                     {user.last_activity ? (
                       <div className="text-sm">
                         <p className="text-foreground">
                           {format(new Date(user.last_activity), 'dd/MM/yyyy HH:mm', { locale: fr })}
                         </p>
                         <div className="flex items-center gap-1 mt-1">
                           <div className={`h-2 w-2 rounded-full ${
                             user.last_activity && (new Date().getTime() - new Date(user.last_activity).getTime()) < 15 * 60 * 1000
                               ? 'bg-green-500' : 'bg-gray-400'
                           }`}></div>
                           <span className="text-xs text-muted-foreground">
                             {user.last_activity && (new Date().getTime() - new Date(user.last_activity).getTime()) < 15 * 60 * 1000
                               ? 'En ligne' : 'Hors ligne'}
                           </span>
                         </div>
                       </div>
                     ) : (
                       <span className="text-sm text-muted-foreground">Jamais connecté</span>
                     )}
                   </TableCell>
                  <TableCell className="sticky right-0 bg-background">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        side="bottom"
                        sideOffset={8}
                        collisionPadding={10}
                        className="w-56"
                      >
                        <DropdownMenuItem onClick={() => onViewUser?.(user)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir le profil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditUser?.(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onVerifyUser?.(user)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Vérifier le compte
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) onPageChange(currentPage - 1);
                  }}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) onPageChange(currentPage + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};