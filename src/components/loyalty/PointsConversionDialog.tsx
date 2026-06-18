import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useKwendaPoints } from '@/hooks/useKwendaPoints';
import { Badge } from '@/components/ui/badge';
import { Gift, TrendingUp, Sparkles, Star } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

interface PointsConversionDialogProps {
  open: boolean;
  onClose: () => void;
}

export const PointsConversionDialog: React.FC<PointsConversionDialogProps> = ({ open, onClose }) => {
  const { points, convertToCredits, calculateConversionBonus, loading } = useKwendaPoints();
  const { fetchWallet: refreshWallet } = useWallet();
  const [pointsToConvert, setPointsToConvert] = useState(50);

  const bonusRate = calculateConversionBonus(pointsToConvert);
  const baseCredits = (pointsToConvert / 100) * 1000;
  const totalCredits = Math.round(baseCredits * (1 + bonusRate));

  const handleConvert = async () => {
    const success = await convertToCredits(pointsToConvert);
    if (success) {
      refreshWallet();
      onClose();
    }
  };

  const hasPoints = points.total_points >= 50;

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-primary/10">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            Convertir mes Points TAGA
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-6 pb-8 space-y-5 overflow-y-auto">
          {/* Points disponibles */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-5 rounded-2xl border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wide font-medium">Points disponibles</p>
                <p className="text-3xl font-black text-primary">
                  {points.total_points}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          {!hasPoints ? (
            /* État 0 points */
            <div className="text-center py-6 space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Pas encore assez de points</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Gagnez des points en effectuant des courses, livraisons et achats sur TAGA. Minimum 50 points requis.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                {[
                  { label: 'Course', pts: '+10' },
                  { label: 'Livraison', pts: '+15' },
                  { label: 'Achat', pts: '+5' },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center">
                    <p className="text-sm font-bold text-primary">{item.pts}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={onClose}>
                Compris
              </Button>
            </div>
          ) : (
            <>
              {/* Slider de conversion */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold text-foreground">Points à convertir</p>
                  <Badge variant="secondary" className="font-bold text-sm px-3 py-1">
                    {pointsToConvert} pts
                  </Badge>
                </div>
                <Slider
                  value={[pointsToConvert]}
                  onValueChange={([value]) => setPointsToConvert(value)}
                  min={50}
                  max={points.total_points}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>50 pts</span>
                  <span>{points.total_points} pts</span>
                </div>
              </div>

              {/* Résumé conversion */}
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Crédits de base</span>
                  <span className="font-semibold">{baseCredits.toLocaleString()} CDF</span>
                </div>
                {bonusRate > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Bonus +{Math.round(bonusRate * 100)}%
                    </span>
                    <span className="font-semibold">
                      +{Math.round(baseCredits * bonusRate).toLocaleString()} CDF
                    </span>
                  </div>
                )}
                <div className="border-t border-border/50 pt-3 flex justify-between items-center">
                  <span className="font-bold text-foreground">Total Solde Bonus</span>
                  <span className="text-xl font-black text-primary">{totalCredits.toLocaleString()} CDF</span>
                </div>
              </div>

              {/* Info */}
              <div className="bg-congo-yellow/5 border border-congo-yellow/20 p-3.5 rounded-xl">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 <strong>Important :</strong> Le Solde Bonus est utilisable pour les courses, livraisons et achats TAGA. Il n'est pas retirable.
                </p>
              </div>

              <Button
                className="w-full h-12 text-base font-bold rounded-2xl"
                onClick={handleConvert}
                disabled={loading || pointsToConvert < 50 || pointsToConvert > points.total_points}
              >
                {loading ? 'Conversion en cours...' : `Convertir ${pointsToConvert} points`}
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
