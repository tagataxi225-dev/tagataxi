import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ModernProductCard } from '@/components/marketplace/ModernProductCard';

interface HomeTrendsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: any[];
  onProductSelect: (product: any) => void;
}

export const HomeTrendsSheet = ({ open, onOpenChange, products, onProductSelect }: HomeTrendsSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <SheetTitle className="text-xl">Tendances du moment</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(85vh-56px)] px-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {products?.map((product) => (
              <div key={product.id} onClick={() => onProductSelect(product)}>
                <ModernProductCard 
                  product={product} 
                  onViewDetails={onProductSelect}
                  onAddToCart={() => {}}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default HomeTrendsSheet;
