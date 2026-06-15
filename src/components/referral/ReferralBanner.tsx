import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Gift, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReferralBannerProps {
  userCode?: string;
  totalReferred?: number;
  onClick: () => void;
}

export const ReferralBanner: React.FC<ReferralBannerProps> = ({
  userCode,
  totalReferred = 0,
  onClick
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className="overflow-hidden bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-lg">
        <div className="p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Gift className="h-8 w-8" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-1">Parrainez vos amis</h3>
                <p className="text-white/90 text-sm">
                  Gagnez 2000 CDF par ami inscrit
                </p>
                {totalReferred > 0 && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span className="font-semibold">{totalReferred} amis parrainés</span>
                  </div>
                )}
              </div>
            </div>
            
            <Button
              variant="secondary"
              size="lg"
              className="gap-2"
              onClick={onClick}
            >
              Mon code
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
