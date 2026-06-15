import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

interface PerformanceMetric {
  label: string;
  current: number;
  target: number;
  unit: string;
  trend?: {
    direction: 'up' | 'down';
    value: number;
    period: string;
  };
}

interface PartnerPerformanceWidgetProps {
  metrics: PerformanceMetric[];
  title?: string;
}

export const PartnerPerformanceWidget: React.FC<PartnerPerformanceWidgetProps> = ({
  metrics,
  title = "Objectifs de Performance"
}) => {
  const getPerformanceStatus = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return { status: 'excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (percentage >= 80) return { status: 'bon', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (percentage >= 60) return { status: 'moyen', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { status: 'faible', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric, index) => {
          const percentage = Math.min((metric.current / metric.target) * 100, 100);
          const status = getPerformanceStatus(metric.current, metric.target);
          
          return (
            <div key={index} className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-foreground">{metric.label}</p>
                    <Badge variant="outline" className={status.color}>
                      {status.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                    <span>{metric.current} {metric.unit}</span>
                    <span>Objectif: {metric.target} {metric.unit}</span>
                  </div>
                  
                  <Progress value={percentage} className="h-2" />
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}% de l'objectif
                    </span>
                    
                    {metric.trend && (
                      <div className={`flex items-center text-xs ${
                        metric.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.trend.direction === 'up' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {metric.trend.direction === 'up' ? '+' : '-'}{metric.trend.value}% {metric.trend.period}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};