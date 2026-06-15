import React from 'react';
import { cn } from '@/lib/utils';
import orangeMoneyLogo from '@/assets/orange-money-logo.webp';
import airtelMoneyLogo from '@/assets/airtel-money-logo.png';
import mpesaLogo from '@/assets/mpesa-logo.png';

type Operator = 'airtel' | 'orange' | 'mpesa';

interface OperatorSelectorProps {
  selected: Operator | '';
  onSelect: (operator: Operator) => void;
}

const operators = [
  { 
    id: 'airtel' as Operator, 
    name: 'Airtel Money',
    logo: airtelMoneyLogo,
    disabled: true,
    badge: 'Bientôt'
  },
  { 
    id: 'orange' as Operator, 
    name: 'Orange Money',
    logo: orangeMoneyLogo,
    disabled: false,
    badge: null
  },
  { 
    id: 'mpesa' as Operator, 
    name: 'M-Pesa',
    logo: mpesaLogo,
    disabled: true,
    badge: 'Bientôt'
  },
];

export const OperatorSelector: React.FC<OperatorSelectorProps> = ({
  selected,
  onSelect
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Opérateur
      </label>
      <div className="flex gap-2">
        {operators.map((operator) => (
          <button
            key={operator.id}
            type="button"
            onClick={() => {
              if (!operator.disabled) {
                onSelect(operator.id);
              }
            }}
            disabled={operator.disabled}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl",
              "transition-all duration-150",
              operator.disabled && "opacity-50 cursor-not-allowed",
              selected === operator.id && !operator.disabled
                ? "bg-primary/10 border border-primary text-primary"
                : "bg-muted/50 border border-border/60 hover:bg-muted hover:border-border"
            )}
          >
            <img 
              src={operator.logo} 
              alt={operator.name}
              className="w-7 h-7 object-contain"
            />
            <div className="flex flex-col items-start">
              <span className="text-xs font-semibold leading-tight">
                {operator.name}
              </span>
              {operator.badge && (
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {operator.badge}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
