import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProductSpecificationsEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

export const ProductSpecificationsEditor: React.FC<ProductSpecificationsEditorProps> = ({ 
  value, 
  onChange 
}) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const specifications = Object.entries(value);
  const canAdd = specifications.length < 10;

  const handleAdd = () => {
    if (newKey.trim() && newValue.trim() && canAdd) {
      onChange({ ...value, [newKey.trim()]: newValue.trim() });
      setNewKey('');
      setNewValue('');
    }
  };

  const handleRemove = (key: string) => {
    const updated = { ...value };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <Label>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>Caractéristiques techniques (optionnel)</span>
        </div>
      </Label>
      <p className="text-xs text-muted-foreground">
        Ajoutez des détails techniques pour mieux décrire votre produit
      </p>

      {/* Liste des specifications existantes */}
      {specifications.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            {specifications.map(([key, val]) => (
              <div key={key} className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{key}:</span>
                  <span className="text-sm text-muted-foreground ml-2">{val}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleRemove(key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Ajouter nouvelle specification */}
      {canAdd && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Nom (ex: Couleur)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                maxLength={30}
              />
              <Input
                placeholder="Valeur (ex: Noir)"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                maxLength={50}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleAdd}
              disabled={!newKey.trim() || !newValue.trim()}
            >
              <Plus className="h-3 w-3 mr-1" />
              Ajouter une caractéristique
            </Button>
          </CardContent>
        </Card>
      )}

      {specifications.length >= 10 && (
        <p className="text-xs text-muted-foreground">
          Limite de 10 caractéristiques atteinte
        </p>
      )}
    </div>
  );
};
