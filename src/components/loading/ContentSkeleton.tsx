import { motion } from "framer-motion";

interface ContentSkeletonProps {
  context?: 'client' | 'driver' | 'vendor' | 'admin' | 'default';
}

/**
 * 🎨 SKELETON MODERNE DU CONTENU
 * Prévisualisation fluide pendant le chargement final
 * Remplace la page blanche par un aperçu de la page
 */
export const ContentSkeleton = ({ context = 'default' }: ContentSkeletonProps) => {
  return (
    <div className="fixed inset-0 bg-background z-50">
      {/* Header skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="h-16 border-b border-border bg-card/50 backdrop-blur-sm"
      >
        <div className="container mx-auto h-full flex items-center justify-between px-4">
          <div className="h-8 w-32 bg-muted/50 rounded-md animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-9 bg-muted/50 rounded-md animate-pulse" />
            <div className="h-9 w-9 bg-muted/50 rounded-md animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Content area skeleton */}
      <div className="container mx-auto p-4 space-y-4">
        {context === 'client' && (
          <>
            {/* Service cards skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="h-24 bg-muted/30 rounded-xl animate-pulse"
                />
              ))}
            </div>

            {/* Banner skeleton */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.2 }}
              className="h-40 bg-muted/30 rounded-xl animate-pulse"
            />

            {/* Cards skeleton */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.3 + i * 0.05 }}
                  className="h-20 bg-muted/30 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </>
        )}

        {context === 'driver' && (
          <>
            {/* Stats cards skeleton */}
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="h-28 bg-muted/30 rounded-xl animate-pulse"
                />
              ))}
            </div>

            {/* Map skeleton */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              className="h-64 bg-muted/30 rounded-xl animate-pulse"
            />

            {/* Rides list skeleton */}
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.25 + i * 0.05 }}
                  className="h-24 bg-muted/30 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </>
        )}

        {context === 'default' && (
          <>
            {/* Generic skeleton */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="h-48 bg-muted/30 rounded-xl animate-pulse"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.1 }}
                  className="h-32 bg-muted/30 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom nav skeleton (for mobile) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-card/80 backdrop-blur-sm md:hidden">
        <div className="h-full flex items-center justify-around px-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-10 bg-muted/50 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
};
