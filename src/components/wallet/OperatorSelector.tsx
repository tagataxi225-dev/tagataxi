import React from 'react';
import { cn } from '@/lib/utils';
import orangeMoneyLogo from '@/assets/orange-money-logo.webp';

type Operator = 'orange' | 'wave';

interface OperatorSelectorProps {
  selected: Operator | '';
  onSelect: (operator: Operator) => void;
}

// Opérateurs Côte d'Ivoire. Orange Money actif ; Wave « Bientôt » (désactivé)
// en attendant l'intégration backend (whitelist edge + API Wave).
const operators: Array<{ id: Operator; name: string; logo?: string; color?: string; disabled: boolean; badge: string | null }> = [
  {
    id: 'orange',
    name: 'Orange Money',
    logo: orangeMoneyLogo,
    disabled: false,
    badge: null
  },
  {
    id: 'wave',
    name: 'Wave',
    color: '#1AA5E0', // pastille temporaire (logo Wave à fournir)
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
            {operator.logo ? (
              <img
                src={operator.logo}
                alt={operator.name}
                className="w-7 h-7 object-contain"
              />
            ) : (
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: operator.color }}
                aria-hidden="true"
              >
                <span className="text-[11px] font-extrabold text-white">W</span>
              </span>
            )}
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
