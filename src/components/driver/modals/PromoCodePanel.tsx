import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gift, Check, X, Clock } from 'lucide-react';
import { usePromoCode } from '@/hooks/usePromoCode';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const PromoCodePanel: React.FC = () => {
  const [code, setCode] = useState('');
  const { activeCodes, usedCodes, applyPromoCode, isLoading } = usePromoCode();

  const handleApply = async () => {
    if (!code.trim()) {
      toast.error('Veuillez entrer un code promo');
      return;
    }

    const success = await applyPromoCode(code.trim().toUpperCase());
    if (success) {
      setCode('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Input pour entrer un code */}
      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="h-5 w-5" />
            <span className="text-sm opacity-90">Entrer un code promo</span>
          </div>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: PROMO2024"
              className="bg-white text-gray-900 border-0"
              maxLength={20}
            />
            <Button 
              onClick={handleApply}
              disabled={isLoading || !code.trim()}
              className="bg-white text-purple-600 hover:bg-white/90"
            >
              Appliquer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Codes actifs */}
      {activeCodes.length > 0 && (
        <>
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Codes actifs ({activeCodes.length})
            </h3>
            <div className="space-y-3">
              {activeCodes.map((promo) => (
                <Card key={promo.id} className="border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <code className="px-2 py-1 bg-white rounded text-sm font-bold">
                            {promo.code}
                          </code>
                          <Badge variant="outline" className="text-xs">
                            {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `${promo.discount_value} CDF`}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{promo.description}</p>
                        {promo.valid_until && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expire le {format(new Date(promo.valid_until), 'PPP', { locale: fr })}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-green-600">Actif</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Historique des codes utilisés */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <X className="h-4 w-4 text-muted-foreground" />
          Codes utilisés ({usedCodes.length})
        </h3>
        {usedCodes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Aucun code utilisé pour le moment
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {usedCodes.map((promo) => (
              <Card key={promo.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <code className="text-sm font-mono">{promo.code}</code>
                      <p className="text-xs text-muted-foreground">
                        Utilisé le {format(new Date(promo.used_at), 'PPP', { locale: fr })}
                      </p>
                    </div>
                    <Badge variant="secondary">Expiré</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
