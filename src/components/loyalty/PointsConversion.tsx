import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useKwendaPoints } from '@/hooks/useKwendaPoints';
import { Coins, Zap, Ticket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const PointsConversion = () => {
  const { points, loading, convertToCredits, enterSuperLottery } = useKwendaPoints();
  const [pointsToConvert, setPointsToConvert] = useState('100');
  const [converting, setConverting] = useState(false);

  const conversionRate = 10; // 100 points = 1000 CDF
  const creditsFromPoints = (parseInt(pointsToConvert) / 100) * 1000;

  const handleConvert = async () => {
    const amount = parseInt(pointsToConvert);
    if (isNaN(amount) || amount < 100) return;

    setConverting(true);
    await convertToCredits(amount);
    setConverting(false);
    setPointsToConvert('100');
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Chargement...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance Actuelle */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Mes Points TAGA</p>
            <p className="text-3xl font-bold text-primary">
              {points.total_points.toLocaleString()}
            </p>
          </div>
          <Coins className="h-12 w-12 text-primary opacity-50" />
        </div>
      </Card>

      {/* Options de Conversion */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Convertir en Crédits
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Points à convertir
            </label>
            <Input
              type="number"
              value={pointsToConvert}
              onChange={(e) => setPointsToConvert(e.target.value)}
              min={100}
              step={100}
              placeholder="100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 100 points
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Points</span>
              <span className="font-semibold">{pointsToConvert || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Crédits TAGAPay</span>
              <span className="font-semibold text-primary">
                {isNaN(creditsFromPoints) ? 0 : creditsFromPoints.toLocaleString()} CDF
              </span>
            </div>
          </div>

          <Button
            onClick={handleConvert}
            disabled={
              converting ||
              points.total_points < parseInt(pointsToConvert) ||
              isNaN(parseInt(pointsToConvert)) ||
              parseInt(pointsToConvert) < 100
            }
            className="w-full"
          >
            {converting ? 'Conversion...' : 'Convertir maintenant'}
          </Button>
        </div>
      </Card>

      {/* Taux de Conversion */}
      <Card className="p-6">
        <h4 className="font-semibold mb-3">📊 Taux de Conversion</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span>100 points</span>
            <span className="font-semibold">= 1,000 CDF</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span>500 points</span>
            <Badge>1 Ticket Super Tombola</Badge>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span>1,000 points</span>
            <Badge variant="secondary">1 Carte Rare Garantie</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
