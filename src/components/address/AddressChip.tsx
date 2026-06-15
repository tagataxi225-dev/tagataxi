import React from 'react';
import { Home, Building, MoreVertical, Edit, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface AddressData {
  id: string;
  label: string;
  address_line: string;
  city: string;
  commune?: string;
  quartier?: string;
  coordinates?: any;
  is_default: boolean;
  address_type: string;
  usage_count?: number;
  created_at: string;
}

interface AddressChipProps {
  address: AddressData;
  isSelected?: boolean;
  onClick?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  compact?: boolean;
}

export const AddressChip = ({
  address,
  isSelected = false,
  onClick,
  showActions = false,
  onEdit,
  onDelete,
  onSetDefault,
  compact = false,
}: AddressChipProps) => {
  const isBusiness = address.address_type === 'business';
  const Icon = isBusiness ? Building : Home;

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-2xl transition-all duration-200",
        compact ? "py-2.5 px-3" : "py-3 px-4",
        "bg-card border border-border/5",
        onClick && "cursor-pointer hover:bg-muted/20 active:scale-[0.98]",
        isSelected && "ring-2 ring-primary/20"
      )}
      onClick={onClick}
    >
      {/* Icon contextuel */}
      <div className={cn(
        "flex items-center justify-center rounded-xl",
        compact ? "h-9 w-9" : "h-10 w-10",
        isBusiness ? "bg-violet-500/10" : "bg-blue-500/10"
      )}>
        <Icon className={cn(
          compact ? "h-4 w-4" : "h-[18px] w-[18px]",
          isBusiness ? "text-violet-500" : "text-blue-500"
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-foreground truncate",
          compact ? "text-sm" : "text-[15px]"
        )}>
          {address.label}
        </p>
        {!compact && (
          <p className="text-xs text-muted-foreground/70 truncate">
            {address.address_line}
          </p>
        )}
      </div>

      {/* Default indicator - emerald dot */}
      {address.is_default && (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      )}

      {/* Actions menu */}
      {showActions && (onEdit || onDelete || onSetDefault) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {onSetDefault && !address.is_default && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onSetDefault();
              }}>
                <Star className="h-4 w-4 mr-2" />
                Favori
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
