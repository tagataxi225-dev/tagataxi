import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface FoodProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  sizes?: Array<{ label: string; priceModifier: number }>;
  extras?: Array<{ label: string; price: number }>;
}

interface FoodProductDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: FoodProduct;
  onAddToCart: (product: FoodProduct, quantity: number, selectedSize?: string, selectedExtras?: string[], specialInstructions?: string) => void;
}

export const FoodProductDetailSheet = ({
  open,
  onOpenChange,
  product,
  onAddToCart
}: FoodProductDetailSheetProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.sizes?.[0]?.label
  );
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const calculatePrice = () => {
    let total = product.price;
    
    if (selectedSize && product.sizes) {
      const size = product.sizes.find(s => s.label === selectedSize);
      if (size) total += size.priceModifier;
    }
    
    if (product.extras) {
      selectedExtras.forEach(extraLabel => {
        const extra = product.extras?.find(e => e.label === extraLabel);
        if (extra) total += extra.price;
      });
    }
    
    return total * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedSize, selectedExtras, specialInstructions);
    onOpenChange(false);
    // Reset state
    setQuantity(1);
    setSelectedExtras([]);
    setSpecialInstructions('');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-[32px] max-h-[90vh]">
        {/* Image */}
        {product.image && (
          <div className="relative w-full aspect-video overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}

        <div className="overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle className="text-xl font-bold">{product.name}</DrawerTitle>
            <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
            <p className="text-lg font-bold text-primary mt-2">
              {product.price.toLocaleString()} CDF
            </p>
          </DrawerHeader>

          <div className="px-6 pb-6 space-y-4">
            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Taille</h4>
                <div className="grid grid-cols-3 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size.label}
                      onClick={() => setSelectedSize(size.label)}
                      className={`py-2 px-3 rounded-lg border-2 transition-colors ${
                        selectedSize === size.label
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium text-sm">{size.label}</p>
                      {size.priceModifier > 0 && (
                        <p className="text-xs text-muted-foreground">
                          +{size.priceModifier} CDF
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Extras */}
            {product.extras && product.extras.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Extras</h4>
                <div className="space-y-2">
                  {product.extras.map((extra) => (
                    <button
                      key={extra.label}
                      onClick={() => {
                        setSelectedExtras(prev =>
                          prev.includes(extra.label)
                            ? prev.filter(e => e !== extra.label)
                            : [...prev, extra.label]
                        );
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                        selectedExtras.includes(extra.label)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="font-medium text-sm">{extra.label}</span>
                      <span className="text-sm text-muted-foreground">
                        +{extra.price} CDF
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Special Instructions */}
            <div>
              <h4 className="font-semibold mb-2">Instructions spéciales</h4>
              <Textarea
                placeholder="Ex: Sans oignons, bien cuit..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
              />
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between py-2">
              <span className="font-semibold">Quantité</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="px-6 pb-8 border-t">
          <Button
            size="lg"
            className="w-full text-base font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            onClick={handleAddToCart}
          >
            Ajouter au panier · {calculatePrice().toLocaleString()} CDF
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
