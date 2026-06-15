import React from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { DIGITAL_CATEGORIES, DigitalCategory } from '@/config/marketplaceCategories';
import { cn } from '@/lib/utils';

interface DigitalCategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
}

export const DigitalCategorySelector: React.FC<DigitalCategorySelectorProps> = ({
  value,
  onChange
}) => {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Type de produit digital *</Label>
      <div className="grid grid-cols-2 gap-3">
        {DIGITAL_CATEGORIES.map((cat, index) => {
          const Icon = cat.icon;
          const isSelected = value === cat.id;
          
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "relative p-4 rounded-xl border-2 cursor-pointer transition-all",
                "hover:shadow-md hover:scale-[1.02]",
                isSelected
                  ? "border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 shadow-lg"
                  : "border-border hover:border-purple-300 dark:hover:border-purple-700"
              )}
              onClick={() => onChange(cat.id)}
              whileTap={{ scale: 0.98 }}
            >
              {/* Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
              
              <div className="flex flex-col items-center text-center gap-2">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-purple-100 dark:bg-purple-900/50"
                    : "bg-muted"
                )}>
                  <Icon className={cn(
                    "h-6 w-6 transition-colors",
                    isSelected
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-muted-foreground"
                  )} />
                </div>
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  isSelected && "text-purple-700 dark:text-purple-300"
                )}>
                  {cat.name}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
