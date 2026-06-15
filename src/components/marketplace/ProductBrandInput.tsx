import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Store } from 'lucide-react';

interface ProductBrandInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const ProductBrandInput: React.FC<ProductBrandInputProps> = ({ 
  value, 
  onChange, 
  error 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="brand">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4" />
          <span>Marque (optionnel)</span>
        </div>
      </Label>
      <Input
        id="brand"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex: Samsung, Apple, Nike..."
        maxLength={50}
        className={error ? 'border-destructive' : ''}
      />
      <p className="text-xs text-muted-foreground">
        Indiquez la marque du produit si applicable
      </p>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};
