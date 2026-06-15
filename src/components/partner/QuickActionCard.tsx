import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
  gradient?: boolean;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon: Icon,
  title,
  description,
  color,
  onClick,
  gradient = false
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className={`h-full hover:shadow-lg transition-all duration-300 ${
        gradient ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20' : ''
      }`}>
        <CardContent className="p-6 text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
            gradient ? 'bg-primary text-primary-foreground' : `bg-${color}-100 text-${color}-600`
          }`}>
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};