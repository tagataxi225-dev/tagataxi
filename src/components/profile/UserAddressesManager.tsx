import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlaces } from '@/hooks/usePlaces';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Briefcase, Heart, Plus, Edit2, Trash2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const UserAddressesManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { places, homePlace, workPlace, favoritePlaces, addPlace, updatePlace, deletePlace, loading } = usePlaces();
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [editingPlace, setEditingPlace] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    place_type: 'favorite' as 'home' | 'work' | 'favorite',
  });

  const getPlaceIcon = (type: string) => {
    switch (type) {
      case 'home': return Home;
      case 'work': return Briefcase;
      case 'favorite': return Heart;
      default: return MapPin;
    }
  };

  const getPlaceTypeLabel = (type: string) => {
    switch (type) {
      case 'home': return 'Domicile';
      case 'work': return 'Bureau';
      case 'favorite': return 'Favori';
      default: return 'Autre';
    }
  };

  const handleAddPlace = async () => {
    if (!formData.name || !formData.address) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addPlace({ 
        ...formData, 
        coordinates: { lat: -4.4419, lng: 15.2663 } 
      });
      toast({
        title: "Adresse ajoutée",
        description: "Votre adresse a été ajoutée avec succès.",
      });
      setIsAddingPlace(false);
      setFormData({ name: '', address: '', place_type: 'favorite' });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'adresse.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePlace = async (placeId: string, updates: any) => {
    try {
      await updatePlace(placeId, updates);
      toast({
        title: "Adresse mise à jour",
        description: "L'adresse a été mise à jour avec succès.",
      });
      setEditingPlace(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'adresse.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlace = async (placeId: string) => {
    try {
      await deletePlace(placeId);
      toast({
        title: "Adresse supprimée",
        description: "L'adresse a été supprimée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'adresse.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mes adresses</h2>
          <p className="text-muted-foreground">Gérez vos adresses sauvegardées</p>
        </div>
        <Dialog open={isAddingPlace} onOpenChange={setIsAddingPlace}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une adresse
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>Ajouter une adresse</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de l'adresse</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Maison, Bureau..."
                />
              </div>
              <div>
                <Label htmlFor="address">Adresse complète</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Ex: Avenue Kasaï, Gombe, Kinshasa"
                />
              </div>
              <div>
                <Label htmlFor="place_type">Type d'adresse</Label>
                <Select
                  value={formData.place_type}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, place_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Domicile</SelectItem>
                    <SelectItem value="work">Bureau</SelectItem>
                    <SelectItem value="favorite">Favori</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddPlace} className="flex-1">
                  Ajouter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingPlace(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Special places */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {homePlace && (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg shrink-0">
                    <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{homePlace.name}</h3>
                      <Badge variant="secondary" className="shrink-0">Domicile</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{homePlace.address}</p>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePlace(homePlace.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {workPlace && (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg shrink-0">
                    <Briefcase className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{workPlace.name}</h3>
                      <Badge variant="secondary" className="shrink-0">Bureau</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{workPlace.address}</p>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePlace(workPlace.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Favorite places */}
      {favoritePlaces.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">Adresses favorites</h3>
          <div className="grid grid-cols-1 gap-4">
            {favoritePlaces.map((place) => {
              const IconComponent = getPlaceIcon(place.place_type);
              return (
                <Card key={place.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg shrink-0">
                          <IconComponent className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{place.name}</h3>
                            <Badge variant="outline" className="shrink-0">
                              {getPlaceTypeLabel(place.place_type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{place.address}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Utilisé {place.usage_count} fois
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlace(place.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {places.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Aucune adresse sauvegardée</h3>
            <p className="text-muted-foreground mb-4">
              Ajoutez vos adresses fréquentes pour gagner du temps lors de vos réservations.
            </p>
            <Button onClick={() => setIsAddingPlace(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter votre première adresse
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};