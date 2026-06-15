import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingDown, TrendingUp, X } from 'lucide-react';
import { performanceMonitor } from '@/utils/performanceUtils';

export default function PerformanceDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setStats(performanceMonitor.getAllStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          variant="outline"
          className="shadow-lg"
        >
          <Activity className="h-4 w-4 mr-2" />
          Performance
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-xl border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Métriques de Performance</h3>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              size="sm"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.keys(stats).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune métrique disponible
              </p>
            ) : (
              Object.entries(stats).map(([name, data]: [string, any]) => {
                const isGood = data.avg < 100;
                const isSlow = data.avg > 500;

                return (
                  <div
                    key={name}
                    className="p-3 bg-muted/20 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {name.replace(/_/g, ' ')}
                      </span>
                      <Badge
                        variant={isGood ? 'default' : isSlow ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {isGood ? (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        )}
                        {data.avg.toFixed(0)}ms
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="block">Min</span>
                        <span className="font-semibold">{data.min.toFixed(0)}ms</span>
                      </div>
                      <div>
                        <span className="block">Max</span>
                        <span className="font-semibold">{data.max.toFixed(0)}ms</span>
                      </div>
                      <div>
                        <span className="block">Appels</span>
                        <span className="font-semibold">{data.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={() => {
                performanceMonitor.reset();
                setStats({});
              }}
              size="sm"
              variant="outline"
              className="w-full"
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
