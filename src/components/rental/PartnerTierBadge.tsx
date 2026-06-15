import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Shield, Award, Crown, Gem } from 'lucide-react';

interface PartnerTierBadgeProps {
  tier: string;
  className?: string;
}

export const PartnerTierBadge = ({ tier, className }: PartnerTierBadgeProps) => {
  const config: Record<string, { icon: React.ElementType; label: string; colors: string }> = {
    basic: { 
      icon: Shield, 
      label: 'Starter',
      colors: 'bg-muted text-muted-foreground'
    },
    silver: { 
      icon: Award, 
      label: 'Pro',
      colors: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
    },
    gold: { 
      icon: Crown, 
      label: 'Business',
      colors: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
    },
    platinum: { 
      icon: Gem, 
      label: 'Enterprise',
      colors: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400'
    }
  };

  const c = config[tier] || config.basic;
  const Icon = c.icon;

  return (
    <Badge 
      className={cn(
        "text-[10px] font-semibold px-2 py-0.5 rounded-full border-0 gap-1",
        c.colors,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {c.label}
    </Badge>
  );
};
