import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Plus, Home, Building } from 'lucide-react';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { AddressChip, AddressData } from '@/components/address/AddressChip';

export const SavedAddressesSection = () => {
  const { 
    addresses, 
    saveAddress, 
    updateAddress, 
    deleteAddress, 
    setDefaultAddress,
    getAddressesByType,
    isLoading 
  } = useSavedAddresses();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    address_line: '',
    city: 'Kinshasa',
    commune: '',
    quartier: '',
    address_type: 'personal' as 'personal' | 'business',
    is_default: false,
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
    });
    setEditingAddress(null);
  };

  const handleSave = async () => {
    if (editingAddress) {
      await updateAddress(editingAddress.id, formData);
    } else {
      await saveAddress(formData);
    }
    resetForm();
    setIsAddDialogOpen(false);
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
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Supprimer cette adresse ?')) {
      await deleteAddress(id);
    }
  };

  const personalAddresses = getAddressesByType('personal') as AddressData[];
  const businessAddresses = getAddressesByType('business') as AddressData[];

  const labelSuggestions = ['Maison', 'Bureau', 'Travail', 'Gym'];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-base font-medium">Mes adresses</CardTitle>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={resetForm}
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-medium">
                  {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Label suggestions */}
                {!editingAddress && (
                  <div className="flex flex-wrap gap-2">
                    {labelSuggestions.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setFormData({ ...formData, label })}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          formData.label === label
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nom</Label>
                    <Input
                      placeholder="Ex: Maison"
                      value={formData.label}
                      onChange={(e) => setFormData({...formData, label: e.target.value})}
                      className="h-11 bg-muted/30 border-0 rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Adresse</Label>
                    <Input
                      placeholder="Numéro, avenue, rue..."
                      value={formData.address_line}
                      onChange={(e) => setFormData({...formData, address_line: e.target.value})}
                      className="h-11 bg-muted/30 border-0 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Commune</Label>
                      <Input
                        placeholder="Gombe"
                        value={formData.commune}
                        onChange={(e) => setFormData({...formData, commune: e.target.value})}
                        className="h-11 bg-muted/30 border-0 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Quartier</Label>
                      <Input
                        placeholder="Socimat"
                        value={formData.quartier}
                        onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                        className="h-11 bg-muted/30 border-0 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <Select value={formData.address_type} onValueChange={(value: 'personal' | 'business') => setFormData({...formData, address_type: value})}>
                      <SelectTrigger className="h-11 bg-muted/30 border-0 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personnelle</SelectItem>
                        <SelectItem value="business">Professionnelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                      className="rounded border-muted-foreground/30"
                    />
                    <span className="text-sm text-muted-foreground">Adresse favorite</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1 h-11 rounded-xl"
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={!formData.label || !formData.address_line}
                    className="flex-1 h-11 rounded-xl"
                  >
                    {editingAddress ? 'Modifier' : 'Ajouter'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : addresses.length > 0 ? (
          <div className="space-y-4">
            {/* Personal addresses */}
            {personalAddresses.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Home className="h-3.5 w-3.5" />
                  <span>Personnelles</span>
                </div>
                <div className="space-y-2">
                  {personalAddresses.map((address) => (
                    <AddressChip
                      key={address.id}
                      address={address}
                      showActions
                      onEdit={() => handleEdit(address)}
                      onDelete={() => handleDelete(address.id)}
                      onSetDefault={() => setDefaultAddress(address.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Business addresses */}
            {businessAddresses.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building className="h-3.5 w-3.5" />
                  <span>Professionnelles</span>
                </div>
                <div className="space-y-2">
                  {businessAddresses.map((address) => (
                    <AddressChip
                      key={address.id}
                      address={address}
                      showActions
                      onEdit={() => handleEdit(address)}
                      onDelete={() => handleDelete(address.id)}
                      onSetDefault={() => setDefaultAddress(address.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-muted/30 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">Aucune adresse</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
