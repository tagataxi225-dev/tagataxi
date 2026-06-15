import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Package, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductStockInputProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

export const ProductStockInput: React.FC<ProductStockInputProps> = ({ 
  value, 
  onChange, 
  error 
}) => {
  const { t } = useLanguage();
  const increment = () => onChange(Math.min(9999, value + 1));
  const decrement = () => onChange(Math.max(1, value - 1));

  return (
    <div className="space-y-2">
      <Label htmlFor="stock">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span>{t('product.stock_available')} <span className="text-destructive">{t('product.stock_required')}</span></span>
        </div>
      </Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={decrement}
          disabled={value <= 1}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          id="stock"
          type="number"
          min="1"
          max="9999"
          value={value}
          onChange={(e) => {
            const num = parseInt(e.target.value, 10);
            if (!isNaN(num) && num >= 1 && num <= 9999) {
              onChange(num);
            }
          }}
          className={`text-center tabular-nums ${error ? 'border-destructive' : ''}`}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={increment}
          disabled={value >= 9999}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t('product.stock_help_text')}
      </p>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};
