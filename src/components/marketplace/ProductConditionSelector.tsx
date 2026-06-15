import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Star, CheckCircle, AlertCircle, Wrench } from 'lucide-react';

interface ProductConditionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const conditionOptions = [
  { 
    value: 'new', 
    label: 'Neuf', 
    icon: Sparkles,
    description: 'Produit jamais utilisé, emballage intact'
  },
  { 
    value: 'like_new', 
    label: 'Comme neuf', 
    icon: Star,
    description: 'Utilisé une ou deux fois, état impeccable'
  },
  { 
    value: 'good', 
    label: 'Bon état', 
    icon: CheckCircle,
    description: 'Traces d\'usage normales, fonctionne parfaitement'
  },
  { 
    value: 'fair', 
    label: 'État correct', 
    icon: AlertCircle,
    description: 'Signes d\'usure visibles, fonctionnel'
  },
  { 
    value: 'refurbished', 
    label: 'Reconditionné', 
    icon: Wrench,
    description: 'Remis à neuf par professionnel, garanti'
  },
];

export const ProductConditionSelector: React.FC<ProductConditionSelectorProps> = ({ 
  value, 
  onChange, 
  error 
}) => {
  const selectedOption = conditionOptions.find(opt => opt.value === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="condition">
        État du produit <span className="text-destructive">*</span>
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          id="condition" 
          className={error ? 'border-destructive' : ''}
        >
          <SelectValue placeholder="Sélectionnez l'état du produit">
            {selectedOption && (
              <div className="flex items-center gap-2">
                <selectedOption.icon className="h-4 w-4" />
                <span>{selectedOption.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {conditionOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-start gap-2 py-1">
                <option.icon className="h-4 w-4 mt-1 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedOption && (
        <p className="text-xs text-muted-foreground">
          {selectedOption.description}
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};
