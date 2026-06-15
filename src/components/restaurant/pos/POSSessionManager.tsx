import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, DollarSign, Loader2 } from 'lucide-react';
import { usePOSSession } from '@/hooks/usePOSSession';

interface POSSessionManagerProps {
  restaurantId: string;
  onSessionOpened?: () => void;
  compact?: boolean;
}

export const POSSessionManager = ({ restaurantId, onSessionOpened, compact = false }: POSSessionManagerProps) => {
  const [openingCash, setOpeningCash] = useState('50000');
  const { openSession, loading } = usePOSSession();

  const handleOpenSession = async () => {
    const cash = parseFloat(openingCash);
    if (isNaN(cash) || cash < 0) return;

    const result = await openSession(restaurantId, cash);
    if (result && onSessionOpened) {
      onSessionOpened();
    }
  };

  // Compact mode for embedding in POSHub
  if (compact) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <p className="text-muted-foreground mb-4">Aucune session ouverte</p>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="opening-cash-compact" className="text-sm">Fond de caisse (CDF)</Label>
              <div className="relative max-w-xs mx-auto">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="opening-cash-compact"
                  type="number"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="pl-10"
                  placeholder="50000"
                  min="0"
                  step="1000"
                />
              </div>
            </div>
            <Button
              onClick={handleOpenSession}
              disabled={loading || !openingCash}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              Ouvrir une session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Ouvrir la caisse</CardTitle>
          </div>
          <CardDescription>
            Saisissez le montant du fond de caisse pour démarrer la session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="opening-cash">Fond de caisse (CDF)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="opening-cash"
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="pl-10 text-lg"
                placeholder="50000"
                min="0"
                step="1000"
              />
            </div>
          </div>

          <Button
            onClick={handleOpenSession}
            disabled={loading || !openingCash}
            className="w-full h-12 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Ouverture...
              </>
            ) : 'Ouvrir la session'}
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            <p>La session sera ouverte en votre nom.</p>
            <p className="mt-1">Vous pourrez la fermer à la fin de votre service.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
