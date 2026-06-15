import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  Activity,
  MapPin,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
} from 'lucide-react';
import { Zone, ZoneStatistics } from '@/hooks/useZoneManagement';
import { formatCurrency } from '@/lib/utils';

interface ZoneListViewProps {
  zones: Zone[];
  zoneStatistics: Record<string, ZoneStatistics>;
  onZoneSelect: (zoneId: string) => void;
  onZoneEdit: (zoneId: string) => void;
  onZoneDelete: (zoneId: string) => void;
  onZoneStatusChange: (zoneId: string, status: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  className?: string;
}

export const ZoneListView: React.FC<ZoneListViewProps> = ({
  zones,
  zoneStatistics,
  onZoneSelect,
  onZoneEdit,
  onZoneDelete,
  onZoneStatusChange,
  onExport,
  onImport,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof Zone>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filtrer et trier les zones
  const filteredZones = zones
    .filter(zone => {
      const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          zone.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || zone.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field: keyof Zone) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectZone = (zoneId: string) => {
    setSelectedZones(prev => 
      prev.includes(zoneId) 
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  const handleSelectAll = () => {
    if (selectedZones.length === filteredZones.length) {
      setSelectedZones([]);
    } else {
      setSelectedZones(filteredZones.map(zone => zone.id));
    }
  };

  const handleBulkAction = (action: string) => {
    selectedZones.forEach(zoneId => {
      switch (action) {
        case 'activate':
          onZoneStatusChange(zoneId, 'active');
          break;
        case 'deactivate':
          onZoneStatusChange(zoneId, 'inactive');
          break;
        case 'maintenance':
          onZoneStatusChange(zoneId, 'maintenance');
          break;
        case 'delete':
          if (confirm('Supprimer les zones sélectionnées ?')) {
            onZoneDelete(zoneId);
          }
          break;
      }
    });
    setSelectedZones([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'inactive':
        return 'bg-destructive text-destructive-foreground';
      case 'maintenance':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'maintenance':
        return 'Maintenance';
      default:
        return status;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Gestion des zones ({filteredZones.length})
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv,.json';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) onImport(file);
                };
                input.click();
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions groupées */}
        {selectedZones.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedZones.length} zone(s) sélectionnée(s)
            </span>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('activate')}
            >
              Activer
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('deactivate')}
            >
              Désactiver
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('maintenance')}
            >
              Maintenance
            </Button>
            
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkAction('delete')}
            >
              Supprimer
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedZones.length === filteredZones.length && filteredZones.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                Nom
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('city')}>
                Ville
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                Statut
              </TableHead>
              <TableHead>Statistiques</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('surge_multiplier')}>
                Multiplicateur
              </TableHead>
              <TableHead className="w-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {filteredZones.map((zone) => {
              const stats = zoneStatistics[zone.id];
              
              return (
                <TableRow 
                  key={zone.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onZoneSelect(zone.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedZones.includes(zone.id)}
                      onCheckedChange={() => handleSelectZone(zone.id)}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium">{zone.name}</div>
                      <div className="text-sm text-muted-foreground">{zone.zone_type}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div>{zone.city}</div>
                      <div className="text-sm text-muted-foreground">Zone {zone.zone_type}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getStatusColor(zone.status)}>
                      {getStatusLabel(zone.status)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {stats ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {stats.total_rides + stats.total_deliveries}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {stats.active_drivers}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(stats.total_revenue)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.round(stats.average_wait_time)}min
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Pas de données
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      {zone.surge_multiplier}x
                    </Badge>
                  </TableCell>
                  
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onZoneEdit(zone.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onZoneSelect(zone.id)}>
                          <MapPin className="h-4 w-4 mr-2" />
                          Voir sur carte
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onZoneDelete(zone.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredZones.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Aucune zone trouvée
          </div>
        )}
      </CardContent>
    </Card>
  );
};