import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Home, Building, MapPin, Navigation, Search, Loader2, ChevronDown, Briefcase, Dumbbell, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHandle, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { useSimpleLocation } from '@/hooks/useSimpleLocation';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AddressChip, AddressData } from './AddressChip';
import { coordinateService } from '@/services/coordinateService';
import { cn } from '@/lib/utils';

export const MobileAddressManager = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { 
    addresses, 
    saveAddress, 
    updateAddress, 
    deleteAddress, 
    setDefaultAddress,
    incrementAddressUsage,
    getAddressesByType,
    isLoading 
  } = useSavedAddresses();

  const { getCurrentPosition } = useSimpleLocation();
  
  // Google Places Autocomplete pour la recherche d'adresse
  const { predictions, isLoading: autocompleteLoading, search, getPlaceDetails, clearPredictions } = 
    useGooglePlacesAutocomplete({ debounceMs: 300 });
  const [showPredictions, setShowPredictions] = useState(false);

  const fromPath = searchParams.get('from');

  // Auto-ouverture du formulaire si ?add=true
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setIsAddDialogOpen(true);
      searchParams.delete('add');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const [formData, setFormData] = useState({
    label: '',
    address_line: '',
    city: 'Kinshasa',
    commune: '',
    quartier: '',
    address_type: 'personal' as 'personal' | 'business',
    is_default: false,
    coordinates: null as any
  });

  const resetForm = () => {
    setFormData({
      label: '',
      address_line: '',
      city: 'Kinshasa',
      commune: '',
      quartier: '',
      address_type: 'personal',
      is_default: false,
      coordinates: null
    });
    setEditingAddress(null);
  };

  const handleUseCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const position = await getCurrentPosition();
      if (position) {
        setFormData(prev => ({
          ...prev,
          address_line: position.address,
          coordinates: { lat: position.lat, lng: position.lng }
        }));
        toast({
          title: "Position détectée",
          description: "Votre position actuelle a été utilisée.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de géolocalisation",
        description: "Impossible de détecter votre position.",
        variant: "destructive",
      });
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!formData.label || !formData.address_line) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir le nom et l'adresse.",
        variant: "destructive",
      });
      return;
    }

    // Valider/normaliser les coordonnées
    const normalizedCoords = coordinateService.normalize(formData.coordinates, formData.city);
    
    if (!normalizedCoords.isValid && !formData.coordinates) {
      toast({
        title: "Position recommandée",
        description: "Utilisez 'Ma position' ou recherchez une adresse précise pour une meilleure précision.",
      });
    }

    try {
      const addressToSave = {
        ...formData,
        coordinates: { lat: normalizedCoords.lat, lng: normalizedCoords.lng }
      };

      if (editingAddress) {
        await updateAddress(editingAddress.id, addressToSave);
      } else {
        await saveAddress(addressToSave);
      }
      resetForm();
      clearPredictions();
      setShowPredictions(false);
      setIsAddDialogOpen(false);
      if (fromPath) {
        navigate(fromPath);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'adresse.",
        variant: "destructive",
      });
    }
  };

  const handleAddressSearch = (value: string) => {
    setFormData({...formData, address_line: value});
    if (value.length >= 2) {
      search(value);
      setShowPredictions(true);
    } else {
      clearPredictions();
      setShowPredictions(false);
    }
  };

  const handleSelectPrediction = async (placeId: string, description: string) => {
    const details = await getPlaceDetails(placeId);
    if (details) {
      setFormData({
        ...formData,
        address_line: details.address,
        coordinates: { lat: details.coordinates.lat, lng: details.coordinates.lng }
      });
      toast({
        title: "Adresse sélectionnée",
        description: "Coordonnées GPS enregistrées.",
      });
    } else {
      setFormData({...formData, address_line: description});
    }
    setShowPredictions(false);
    clearPredictions();
  };

  const handleEdit = (address: AddressData) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      address_line: address.address_line,
      city: address.city,
      commune: address.commune || '',
      quartier: address.quartier || '',
      address_type: address.address_type as 'personal' | 'business',
      is_default: address.is_default,
      coordinates: address.coordinates
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await deleteAddress(deletingId);
      setDeletingId(null);
    }
  };

  const handleAddressClick = async (address: AddressData) => {
    try {
      // Vérifier coordonnées valides
      const hasValidCoords = address.coordinates &&
        typeof address.coordinates.lat === 'number' &&
        typeof address.coordinates.lng === 'number' &&
        !isNaN(address.coordinates.lat) &&
        !isNaN(address.coordinates.lng) &&
        Math.abs(address.coordinates.lat) > 0.01 &&
        Math.abs(address.coordinates.lng) > 0.01;

      let finalLat = address.coordinates?.lat;
      let finalLng = address.coordinates?.lng;

      // Si pas de coordonnées valides, utiliser fallback par ville
      if (!hasValidCoords) {
        const cityDefaults: Record<string, { lat: number; lng: number }> = {
          'Kinshasa': { lat: -4.3217, lng: 15.3069 },
          'Lubumbashi': { lat: -11.6792, lng: 27.4716 },
          'Kolwezi': { lat: -10.7147, lng: 25.4665 }
        };
        const cityCoords = cityDefaults[address.city || 'Kinshasa'] || cityDefaults['Kinshasa'];
        finalLat = cityCoords.lat;
        finalLng = cityCoords.lng;
      }

      // Incrémenter usage
      await incrementAddressUsage(address.id);
      
      // Naviguer vers taxi avec destination pré-remplie
      navigate('/transport', {
        state: {
          prefilledAddress: {
            address: address.address_line,
            name: address.label,
            lat: finalLat,
            lng: finalLng
          },
          addressType: 'destination'
        }
      });
    } catch (error) {
      console.error('Erreur navigation vers taxi:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la navigation',
        variant: 'destructive'
      });
    }
  };

  const personalAddresses = getAddressesByType('personal') as AddressData[];
  const businessAddresses = getAddressesByType('business') as AddressData[];

  const labelSuggestions = ['Maison', 'Bureau', 'Travail', 'Gym', 'École'];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/5 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/app/client');
              }
            }}
            className="h-8 w-8 p-0 -ml-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-medium text-foreground flex-1">Mes adresses</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
            className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 space-y-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : addresses.length > 0 ? (
          <div className="space-y-5">
            {/* Personal addresses */}
            {personalAddresses.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Personnelles
                </h3>
                <div className="bg-card rounded-2xl p-1 border border-border/5">
                  {personalAddresses.map((address, index) => (
                    <div key={address.id} className={cn(
                      index < personalAddresses.length - 1 && "border-b border-border/10"
                    )}>
                      <AddressChip
                        address={address}
                        showActions
                        onClick={() => handleAddressClick(address)}
                        onEdit={() => handleEdit(address)}
                        onDelete={() => handleDelete(address.id)}
                        onSetDefault={() => setDefaultAddress(address.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Business addresses */}
            {businessAddresses.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Professionnelles
                </h3>
                <div className="bg-card rounded-2xl p-1 border border-border/5">
                  {businessAddresses.map((address, index) => (
                    <div key={address.id} className={cn(
                      index < businessAddresses.length - 1 && "border-b border-border/10"
                    )}>
                      <AddressChip
                        address={address}
                        showActions
                        onClick={() => handleAddressClick(address)}
                        onEdit={() => handleEdit(address)}
                        onDelete={() => handleDelete(address.id)}
                        onSetDefault={() => setDefaultAddress(address.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
              <MapPin className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">Aucune adresse enregistrée</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Ajoutez vos adresses favorites pour commander plus rapidement.
            </p>
            <Button
              onClick={() => { resetForm(); setIsAddDialogOpen(true); }}
              className="w-full max-w-xs rounded-2xl h-11"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une adresse
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Drawer — mobile-first */}
      <Drawer open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open && fromPath) {
          navigate(fromPath);
        }
      }}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHandle />
          
          {/* Header */}
          <div className="px-6 pt-2 pb-4 border-b border-border/10">
            <DrawerTitle className="text-lg font-semibold">
              {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground mt-0.5">
              Ajoutez une adresse fréquente pour vos courses
            </DrawerDescription>
          </div>

          <div className="overflow-y-auto px-6 py-5 space-y-6">
            {/* Section Localisation */}
            <div className="bg-muted/20 rounded-2xl p-4 space-y-3">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isDetectingLocation}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-primary/8 hover:bg-primary/15 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  {isDetectingLocation ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <Navigation className="w-5 h-5 text-primary" />
                  )}
                </div>
                <span className="text-sm font-semibold text-primary">
                  {isDetectingLocation ? 'Détection...' : 'Utiliser ma position'}
                </span>
                {formData.coordinates && (
                  <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    GPS
                  </span>
                )}
              </button>

              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    placeholder="Rechercher une adresse..."
                    value={formData.address_line}
                    onChange={(e) => handleAddressSearch(e.target.value)}
                    onFocus={() => formData.address_line.length >= 2 && setShowPredictions(true)}
                    className="h-12 pl-10 bg-background border border-border/20 rounded-xl text-sm"
                  />
                  {autocompleteLoading && (
                    <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                  )}
                </div>
                
                {showPredictions && predictions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-background border border-border/20 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto">
                    {predictions.map((prediction) => (
                      <button
                        key={prediction.placeId}
                        type="button"
                        onClick={() => handleSelectPrediction(prediction.placeId, prediction.description)}
                        className="w-full px-4 py-3 text-left hover:bg-muted/50 active:bg-muted/70 transition-colors flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {prediction.structuredFormatting.mainText}
                          </p>
                          {prediction.structuredFormatting.secondaryText && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {prediction.structuredFormatting.secondaryText}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section Label */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Nommer cette adresse</p>
              {!editingAddress && (
                <div className="grid grid-cols-3 gap-2">
                  {labelSuggestions.map((label) => {
                    const iconMap: Record<string, React.ReactNode> = {
                      'Maison': <Home className="w-4 h-4" />,
                      'Bureau': <Building className="w-4 h-4" />,
                      'Travail': <Briefcase className="w-4 h-4" />,
                      'Gym': <Dumbbell className="w-4 h-4" />,
                      'École': <GraduationCap className="w-4 h-4" />,
                    };
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setFormData({ ...formData, label })}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.96]",
                          formData.label === label
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        {iconMap[label]}
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Champ nom personnalisé — toujours visible */}
              <Input
                placeholder={editingAddress ? "Nom de l'adresse" : "Ou saisissez un nom personnalisé..."}
                value={labelSuggestions.includes(formData.label) && !editingAddress ? '' : formData.label}
                onChange={(e) => setFormData({...formData, label: e.target.value})}
                className="h-12 bg-muted/20 border border-border/15 rounded-xl text-sm"
              />
            </div>

            {/* Section Type */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Type d'adresse</p>
              <div className="flex p-1.5 bg-muted/30 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, address_type: 'personal'})}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    formData.address_type === 'personal'
                      ? 'bg-background shadow-md text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Home className="w-4 h-4" />
                  Personnel
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, address_type: 'business'})}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    formData.address_type === 'business'
                      ? 'bg-background shadow-md text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Building className="w-4 h-4" />
                  Professionnel
                </button>
              </div>
            </div>

            {/* Section Détails optionnels */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 group">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plus de détails</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Commune</Label>
                    <Input
                      placeholder="Gombe"
                      value={formData.commune}
                      onChange={(e) => setFormData({...formData, commune: e.target.value})}
                      className="h-12 bg-muted/20 border border-border/15 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Quartier</Label>
                    <Input
                      placeholder="Socimat"
                      value={formData.quartier}
                      onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                      className="h-12 bg-muted/20 border border-border/15 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ville</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="h-12 bg-muted/20 border border-border/15 rounded-xl"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Section Favori */}
            <div className="border-t border-border/10 pt-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold text-foreground">Adresse favorite</Label>
                  <p className="text-[11px] text-muted-foreground">Utilisée par défaut pour vos courses</p>
                </div>
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({...formData, is_default: checked})}
                />
              </div>
            </div>

            {/* Bouton d'action */}
            <div className="pb-4">
              <Button
                onClick={handleSave}
                disabled={!formData.label || !formData.address_line}
                className="w-full h-13 rounded-2xl font-semibold text-sm shadow-lg"
              >
                {editingAddress ? 'Enregistrer les modifications' : 'Enregistrer l\'adresse'}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-[90vw]">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette adresse ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'adresse sera supprimée de vos favoris.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
