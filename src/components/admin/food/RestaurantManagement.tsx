import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, Check, Ban, Eye, Star } from 'lucide-react';
import { useAdminRestaurants, RestaurantFilters } from '@/hooks/admin/useAdminRestaurants';

export const RestaurantManagement = () => {
  const { restaurants, loading, fetchRestaurants, approveRestaurant, suspendRestaurant } = useAdminRestaurants();
  const [filters, setFilters] = useState<RestaurantFilters>({});

  useEffect(() => {
    fetchRestaurants(filters);
  }, [filters]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      approved: { variant: 'default', label: 'Approuvé' },
      pending: { variant: 'secondary', label: 'En attente' },
      rejected: { variant: 'destructive', label: 'Rejeté' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des restaurants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtres */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un restaurant..."
              className="pl-9"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => setFilters({ ...filters, status: value as any })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="approved">Approuvés</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="rejected">Rejetés</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.city || 'all'}
            onValueChange={(value) => setFilters({ ...filters, city: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ville" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="Kinshasa">Kinshasa</SelectItem>
              <SelectItem value="Lubumbashi">Lubumbashi</SelectItem>
              <SelectItem value="Kolwezi">Kolwezi</SelectItem>
              <SelectItem value="Abidjan">Abidjan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Propriétaire</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : restaurants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun restaurant trouvé
                  </TableCell>
                </TableRow>
              ) : (
                restaurants.map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={restaurant.logo_url || ''} />
                          <AvatarFallback>{restaurant.restaurant_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{restaurant.restaurant_name}</p>
                          <p className="text-sm text-muted-foreground">{restaurant.cuisine_type}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{restaurant.owner_name}</p>
                        <p className="text-sm text-muted-foreground">{restaurant.owner_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{restaurant.city}</TableCell>
                    <TableCell>{getStatusBadge(restaurant.verification_status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{restaurant.rating_average.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          {restaurant.verification_status === 'pending' && (
                            <DropdownMenuItem onClick={() => approveRestaurant(restaurant.id)}>
                              <Check className="h-4 w-4 mr-2" />
                              Approuver
                            </DropdownMenuItem>
                          )}
                          {restaurant.is_active && (
                            <DropdownMenuItem onClick={() => suspendRestaurant(restaurant.id, 'Suspension administrative')}>
                              <Ban className="h-4 w-4 mr-2" />
                              Suspendre
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
