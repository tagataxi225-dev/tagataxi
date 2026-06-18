import { useUniversalUpdate } from '@/hooks/useUniversalUpdate';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Rocket, Download, Clock, Package, Sparkles, Bug, Zap, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getChangeIcon = (text: string) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('nouveauté') || lowerText.includes('nouvelle')) return <Sparkles className="w-4 h-4 text-blue-500" />;
  if (lowerText.includes('correction') || lowerText.includes('fix')) return <Bug className="w-4 h-4 text-orange-500" />;
  if (lowerText.includes('performance') || lowerText.includes('amélioration')) return <Zap className="w-4 h-4 text-yellow-500" />;
  if (lowerText.includes('sécurité')) return <Shield className="w-4 h-4 text-red-500" />;
  return <Sparkles className="w-4 h-4 text-primary" />;
};

const severityLabels = {
  info: { label: 'Info', color: 'bg-blue-500/10 text-blue-500' },
  minor: { label: 'Mineure', color: 'bg-green-500/10 text-green-500' },
  major: { label: 'Majeure', color: 'bg-orange-500/10 text-orange-500' },
  critical: { label: 'Critique', color: 'bg-red-500/10 text-red-500' }
};

export const UpdateNotification = () => {
  const { shouldShowPrompt, updateInfo, installUpdate, dismissUpdate, isUpdating, platform } = useUniversalUpdate();
  
  const isNative = platform === 'ios' || platform === 'android';

  if (!shouldShowPrompt || !updateInfo) return null;

  const isCritical = updateInfo.severity === 'critical';
  const severity = severityLabels[updateInfo.severity || 'major'];

  return (
    <AnimatePresence>
      <Dialog open={shouldShowPrompt} onOpenChange={(open) => !open && !isCritical && dismissUpdate()}>
        <DialogContent className="sm:max-w-lg border-2 backdrop-blur-md bg-background/95">
          {!isCritical && (
            <button
              onClick={() => dismissUpdate()}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              ✕
            </button>
          )}
          
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0"
                >
                  <Rocket className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <div>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    {isCritical ? '⚠️ Mise à jour critique' : '🎉 Nouvelle version'}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={severity.color}>
                      {severity.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      v{updateInfo.version}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <DialogDescription className="text-base">
              {isCritical 
                ? "Une mise à jour de sécurité importante doit être installée maintenant."
                : "Découvrez les dernières améliorations de TAGA."
              }
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-2" />

          <div className="space-y-4 py-2">
            {/* Informations sur la mise à jour */}
            <div className="grid grid-cols-2 gap-3">
              {updateInfo.cacheSize && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border"
                >
                  <Package className="w-5 h-5 text-primary" />
                  <div className="text-sm">
                    <div className="text-muted-foreground text-xs">Taille</div>
                    <div className="font-semibold">{updateInfo.cacheSize}</div>
                  </div>
                </motion.div>
              )}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border"
              >
                <Clock className="w-5 h-5 text-primary" />
                <div className="text-sm">
                  <div className="text-muted-foreground text-xs">Temps</div>
                  <div className="font-semibold">&lt; 10 sec</div>
                </div>
              </motion.div>
            </div>

            {/* Changelog détaillé */}
            {updateInfo.changelog && updateInfo.changelog.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-lg bg-gradient-to-br from-secondary/30 to-secondary/10 border border-border p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">Nouveautés</span>
                </div>
                <div className="space-y-2">
                   {updateInfo.changelog.map((item, index) => {
                    const changeText = typeof item === 'string' ? item : item.text;
                    const changeIcon = typeof item === 'string' ? getChangeIcon(item) : (item.icon || getChangeIcon(changeText));
                    return (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex items-start gap-2 text-sm"
                      >
                        {typeof changeIcon === 'string' ? <span>{changeIcon}</span> : changeIcon}
                        <span className="flex-1 text-muted-foreground">{changeText}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {isCritical && (
              <Alert variant="destructive" className="border-2">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Attention :</strong> Cette mise à jour corrige des problèmes de sécurité critiques. 
                  Installation obligatoire.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator className="my-2" />

          <DialogFooter className="flex-row gap-2">
            {!isCritical && (
              <Button
                variant="outline"
                onClick={() => dismissUpdate(24)}
                className="flex-1"
              >
                <Clock className="w-4 h-4 mr-2" />
                Plus tard
              </Button>
            )}
            <Button
              onClick={installUpdate}
              disabled={isUpdating}
              className="flex-1 bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary/85 hover:to-primary/70 shadow-lg shadow-primary/20"
            >
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isUpdating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Download className="w-4 h-4" />
                    </motion.div>
                    {platform === 'ios' ? 'Ouverture...' : 'Installation...'}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {platform === 'ios' 
                      ? "Ouvrir l'App Store" 
                      : platform === 'android'
                      ? 'Installer la mise à jour'
                      : 'Installer maintenant'}
                  </>
                )}
              </motion.div>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
};
