import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Drawer, DrawerContent, DrawerHandle, DrawerClose } from '@/components/ui/drawer';
import { usePromoCode } from '@/hooks/usePromoCode';
import { Tag, Percent, Gift, Clock, CheckCircle, X, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PromoCodePanelProps {
  open: boolean;
  onClose: () => void;
}

export const PromoCodePanel: React.FC<PromoCodePanelProps> = ({ open, onClose }) => {
  const { 
    activeCodes,
    usedCodes,
    applyPromoCode,
    isLoading 
  } = usePromoCode();
  
  const [newCode, setNewCode] = useState('');
  const { toast } = useToast();

  const handleApplyCode = async () => {
    if (!newCode.trim()) return;
    const success = await applyPromoCode(newCode.trim());
    if (success) {
      setNewCode('');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Code copié', description: code });
  };

  const getDiscountText = (code: any) => {
    if (code.discount_type === 'percentage') return `${code.discount_value}%`;
    return `${code.discount_value.toLocaleString()} CDF`;
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHandle />

        {/* Header */}
        <div className="relative px-5 pt-2 pb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Codes Promo
          </h2>
          <DrawerClose asChild>
            <button className="absolute top-2 right-4 p-1.5 rounded-full hover:bg-muted transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </DrawerClose>
        </div>

        {/* Content */}
        <div className="px-5 pb-6 overflow-y-auto">
          <Tabs defaultValue="available" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="available" className="text-xs">Disponibles</TabsTrigger>
              <TabsTrigger value="personalized" className="text-xs">Personnalisés</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-4 mt-0">
              {/* Inline input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Entrez un code promo"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button
                  onClick={handleApplyCode}
                  disabled={!newCode.trim() || isLoading}
                  size="default"
                >
                  {isLoading ? '...' : 'Appliquer'}
                </Button>
              </div>

              {/* Code list */}
              {activeCodes.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Tag className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">Aucun code disponible</p>
                  <p className="text-xs mt-1">Revenez plus tard pour de nouvelles offres</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeCodes.map((code) => (
                    <div
                      key={code.id}
                      className="flex items-start justify-between gap-3 p-3.5 bg-card rounded-2xl border border-border/50 shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {code.code}
                          </Badge>
                          <Badge className="text-xs bg-primary/10 text-primary border-0">
                            -{getDiscountText(code)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {code.description}
                        </p>
                        {code.valid_until && (
                          <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expire le {new Date(code.valid_until).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyCode(code.code)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          className="text-xs h-7 px-2.5"
                          onClick={() => setNewCode(code.code)}
                        >
                          Utiliser
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="personalized" className="mt-0">
              <div className="text-center py-10 text-muted-foreground">
                <Gift className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Aucune offre personnalisée</p>
                <p className="text-xs mt-1">Utilisez l'app pour débloquer des offres exclusives</p>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              {usedCodes.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">Aucun code utilisé</p>
                  <p className="text-xs mt-1">Vos codes utilisés apparaîtront ici</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {usedCodes.map((code) => (
                    <div
                      key={code.id}
                      className="flex items-center justify-between gap-3 p-3.5 bg-card rounded-2xl border border-border/50 shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-medium">{code.code}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {code.used_at && new Date(code.used_at).toLocaleDateString()} · {getDiscountText(code)}
                        </p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
