import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Shimmer effect component
const ShimmerOverlay = () => (
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent"
    animate={{ x: ['-100%', '100%'] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
  />
);

export const EnhancedFoodSkeleton = () => {
  return (
    <div className="space-y-4 p-4">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={cn(
            "bg-card/80 backdrop-blur-sm",
            "border border-border/40",
            "rounded-2xl overflow-hidden",
            "shadow-lg"
          )}
        >
          {/* Image skeleton with shimmer */}
          <div className="relative overflow-hidden">
            <Skeleton className="h-48 w-full bg-muted" />
            <ShimmerOverlay />
          </div>
          
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4 bg-muted" />
            <Skeleton className="h-4 w-1/2 bg-muted/80" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-6 w-24 bg-muted" />
              <Skeleton className="h-10 w-28 bg-muted rounded-lg" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const EnhancedDishSkeleton = () => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-4">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="flex-shrink-0 w-[220px]"
        >
          <div className={cn(
            "bg-card/80 backdrop-blur-sm",
            "border border-border/40",
            "rounded-xl overflow-hidden",
            "shadow-lg"
          )}>
            <div className="relative">
              <Skeleton className="h-[140px] w-full bg-muted" />
              <ShimmerOverlay />
            </div>
            <div className="p-3.5 space-y-2">
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-3 w-2/3 bg-muted/80" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-5 w-20 bg-muted" />
                <Skeleton className="h-11 w-11 rounded-full bg-muted" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Banner skeleton
export const EnhancedBannerSkeleton = () => (
  <div className="mx-4 relative">
    <Skeleton className="h-40 w-full rounded-3xl bg-muted" />
    <ShimmerOverlay />
  </div>
);

// Categories skeleton
export const EnhancedCategoriesSkeleton = () => (
  <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
        className="flex-shrink-0"
      >
        <Skeleton className="w-[85px] h-[80px] rounded-2xl bg-muted" />
      </motion.div>
    ))}
  </div>
);

// Full page skeleton
export const RestaurantListSkeleton = () => (
  <div className="space-y-6">
    <EnhancedBannerSkeleton />
    <EnhancedCategoriesSkeleton />
    <div className="space-y-4 px-4">
      <Skeleton className="h-6 w-32 bg-muted" />
      <EnhancedDishSkeleton />
    </div>
    <EnhancedFoodSkeleton />
  </div>
);
