import { useStoreUpdate } from '@/hooks/useStoreUpdate';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Sparkles } from 'lucide-react';

export const StoreUpdateDialog = () => {
  const { showDialog, updateInfo, dismiss, openStore } = useStoreUpdate();

  if (!showDialog || !updateInfo) return null;

  return (
    <Dialog open={showDialog} onOpenChange={(open) => { if (!open && !updateInfo.isMandatory) dismiss(); }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="items-center text-center gap-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">Nouvelle version disponible</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Version {updateInfo.latestVersion} est disponible (vous avez la {updateInfo.currentVersion})
          </DialogDescription>
        </DialogHeader>

        {updateInfo.releaseNotes && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground/80 max-h-40 overflow-y-auto">
            {updateInfo.releaseNotes}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={openStore} className="w-full gap-2">
            <Download className="h-4 w-4" />
            Mettre à jour
          </Button>
          {!updateInfo.isMandatory && (
            <Button variant="ghost" onClick={dismiss} className="w-full text-muted-foreground">
              Plus tard
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
