/**
 * Gestionnaire des segments d'audience pour ciblage notifications
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Users,
  Plus,
  Filter,
  Target,
  MapPin,
  Car,
  Calendar,
  Activity,
  DollarSign,
  Clock,
  Edit,
  Eye,
  Trash2,
  Search
} from 'lucide-react';

interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    user_type?: string[];
    cities?: string[];
    registration_date?: {
      from?: string;
      to?: string;
    };
    activity_level?: string;
    total_orders?: {
      min?: number;
      max?: number;
    };
    last_activity?: {
      days: number;
    };
  };
  estimated_size: number;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}

interface SegmentFormData {
  name: string;
  description: string;
  criteria: any;
}

export const AudienceSegments: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<AudienceSegment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - remplacer par vraies données
  const segments: AudienceSegment[] = [
    {
      id: '1',
      name: 'Nouveaux Clients',
      description: 'Clients inscrits dans les 30 derniers jours',
      criteria: {
        user_type: ['client'],
        registration_date: { 
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      estimated_size: 1245,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Chauffeurs Kinshasa Actifs',
      description: 'Chauffeurs de Kinshasa avec activité récente',
      criteria: {
        user_type: ['driver'],
        cities: ['Kinshasa'],
        last_activity: { days: 7 }
      },
      estimated_size: 892,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Clients VIP',
      description: 'Clients avec plus de 20 commandes',
      criteria: {
        user_type: ['client'],
        total_orders: { min: 20 }
      },
      estimated_size: 156,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Inactifs 30 jours',
      description: 'Utilisateurs sans activité depuis 30 jours',
      criteria: {
        last_activity: { days: 30 }
      },
      estimated_size: 523,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const [formData, setFormData] = useState<SegmentFormData>({
    name: '',
    description: '',
    criteria: {}
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  const formatCriteria = (criteria: any) => {
    const parts = [];
    
    if (criteria.user_type?.length) {
      parts.push(`Type: ${criteria.user_type.join(', ')}`);
    }
    
    if (criteria.cities?.length) {
      parts.push(`Villes: ${criteria.cities.join(', ')}`);
    }
    
    if (criteria.total_orders?.min) {
      parts.push(`Min ${criteria.total_orders.min} commandes`);
    }
    
    if (criteria.last_activity?.days) {
      parts.push(`Actif ${criteria.last_activity.days}j`);
    }
    
    return parts.slice(0, 2).join(' • ') + (parts.length > 2 ? ` +${parts.length - 2}` : '');
  };

  const filteredSegments = segments.filter(segment =>
    segment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    segment.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SegmentForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>
          {selectedSegment ? 'Modifier le Segment' : 'Nouveau Segment'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations de base */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Nom du segment</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Nouveaux clients actifs"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez les critères de ce segment..."
              rows={2}
            />
          </div>
        </div>

        <Separator />

        {/* Critères de segmentation */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Critères de Segmentation
          </h4>

          {/* Type d'utilisateur */}
          <div className="space-y-2">
            <Label>Type d'utilisateur</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="client" />
                <Label htmlFor="client">Clients</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="driver" />
                <Label htmlFor="driver">Chauffeurs</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="partner" />
                <Label htmlFor="partner">Partenaires</Label>
              </div>
            </div>
          </div>

          {/* Localisation */}
          <div className="space-y-2">
            <Label>Villes</Label>
            <Select>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sélectionner les villes..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kinshasa">Kinshasa</SelectItem>
                 <SelectItem value="lubumbashi">Lubumbashi</SelectItem>
                 <SelectItem value="kolwezi">Kolwezi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Niveau d'activité */}
          <div className="space-y-2">
            <Label>Niveau d'activité</Label>
            <Select>
              <SelectTrigger>
                <Activity className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sélectionner le niveau..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very_active">Très actif (quotidien)</SelectItem>
                <SelectItem value="active">Actif (hebdomadaire)</SelectItem>
                <SelectItem value="moderate">Modéré (mensuel)</SelectItem>
                <SelectItem value="inactive">Inactif (+30 jours)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nombre de commandes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Commandes min</Label>
              <Input type="number" placeholder="Ex: 5" />
            </div>
            <div>
              <Label>Commandes max</Label>
              <Input type="number" placeholder="Ex: 50" />
            </div>
          </div>

          {/* Date d'inscription */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Inscrit après</Label>
              <Input type="date" />
            </div>
            <div>
              <Label>Inscrit avant</Label>
              <Input type="date" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Estimation */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Users className="h-4 w-4" />
            <span className="font-medium">Taille estimée du segment</span>
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-1">~1,250 utilisateurs</p>
          <p className="text-sm text-blue-600">Basé sur les critères actuels</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={() => {
            setShowCreateForm(false);
            setSelectedSegment(null);
          }}>
            Enregistrer
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              setShowCreateForm(false);
              setSelectedSegment(null);
            }}
          >
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (showCreateForm || selectedSegment) {
    return <SegmentForm />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Segments d'Audience</h3>
          <p className="text-sm text-muted-foreground">
            Créez des segments pour cibler vos notifications
          </p>
        </div>
        
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nouveau Segment
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un segment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Liste des segments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSegments.map((segment) => (
          <Card key={segment.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{segment.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {segment.description}
                  </p>
                </div>
                <Badge variant={getStatusColor(segment.status)}>
                  {segment.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{segment.estimated_size.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">utilisateurs</span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p className="font-medium">Critères:</p>
                <p>{formatCriteria(segment.criteria)}</p>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedSegment(segment)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  Voir
                </Button>
                <Button size="sm" variant="outline">
                  <Target className="h-3 w-3 mr-1" />
                  Cibler
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSegments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun segment trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Aucun segment ne correspond à votre recherche.' : 'Créez votre premier segment d\'audience.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Créer un Segment
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};