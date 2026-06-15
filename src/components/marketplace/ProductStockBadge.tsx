import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ProductStockBadgeProps {
  stockCount: number;
  variant?: 'default' | 'compact' | 'detailed';
}

export const getStockStatus = (stock: number): {
  status: 'high' | 'medium' | 'low' | 'out';
  label: string;
  icon: React.ReactNode;
  className: string;
} => {
  if (stock === 0) {
    return {
      status: 'out',
      label: 'Rupture de stock',
      icon: <XCircle className="h-3 w-3" />,
      className: 'bg-gray-100 text-gray-800 border-gray-300',
    };
  }
  
  if (stock <= 4) {
    return {
      status: 'low',
      label: `Stock faible (${stock})`,
      icon: <AlertTriangle className="h-3 w-3" />,
      className: 'bg-red-100 text-red-800 border-red-300',
    };
  }
  
  if (stock <= 20) {
    return {
      status: 'medium',
      label: `Stock moyen (${stock})`,
      icon: <Package className="h-3 w-3" />,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    };
  }
  
  return {
    status: 'high',
    label: `En stock (${stock})`,
    icon: <CheckCircle className="h-3 w-3" />,
    className: 'bg-green-100 text-green-800 border-green-300',
  };
};

export const ProductStockBadge: React.FC<ProductStockBadgeProps> = ({ 
  stockCount, 
  variant = 'default' 
}) => {
  const stockInfo = getStockStatus(stockCount);

  if (variant === 'compact') {
    return (
      <Badge variant="outline" className={stockInfo.className}>
        {stockInfo.icon}
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${stockInfo.className}`}>
        {stockInfo.icon}
        <div className="flex flex-col">
          <span className="text-xs font-medium">{stockInfo.label}</span>
          {stockCount > 0 && stockCount <= 4 && (
            <span className="text-[10px] opacity-75">Commandez vite !</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Badge variant="outline" className={`${stockInfo.className} flex items-center gap-1`}>
      {stockInfo.icon}
      <span>{stockInfo.label}</span>
    </Badge>
  );
};
