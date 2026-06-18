import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share, Plus, MoreVertical, Download, Smartphone } from "lucide-react";

interface InstallPromptProps {
  open: boolean;
  onClose: () => void;
  platform?: 'ios' | 'android' | 'desktop';
}

export const InstallPrompt = ({ open, onClose, platform = 'ios' }: InstallPromptProps) => {
  const [activeTab, setActiveTab] = useState(platform);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            📱 Installer TAGA Taxi
          </DialogTitle>
          <DialogDescription>
            Suivez ces étapes simples pour ajouter TAGA à votre écran d'accueil
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ios">iOS</TabsTrigger>
            <TabsTrigger value="android">Android</TabsTrigger>
            <TabsTrigger value="desktop">Desktop</TabsTrigger>
          </TabsList>

          {/* iOS Instructions */}
          <TabsContent value="ios" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Ouvrir Safari</p>
                    <p className="text-sm text-muted-foreground">
                      Assurez-vous d'utiliser Safari (l'installation ne fonctionne pas avec Chrome ou Firefox sur iOS)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Appuyer sur le bouton Partager</p>
                    <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                      <Share className="w-5 h-5 text-blue-500" />
                      <span className="text-sm">Icône en bas de l'écran</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Sélectionner "Sur l'écran d'accueil"</p>
                    <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                      <Plus className="w-5 h-5 text-primary" />
                      <span className="text-sm">Faire défiler et appuyer sur cette option</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Appuyer sur "Ajouter"</p>
                    <p className="text-sm text-muted-foreground">
                      L'icône TAGA apparaîtra sur votre écran d'accueil !
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Android Instructions */}
          <TabsContent value="android" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Ouvrir Chrome ou Edge</p>
                    <p className="text-sm text-muted-foreground">
                      L'installation fonctionne avec Chrome, Edge, ou Samsung Internet
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Appuyer sur le menu (⋮)</p>
                    <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                      <MoreVertical className="w-5 h-5 text-primary" />
                      <span className="text-sm">Les trois points en haut à droite</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Sélectionner "Installer l'application"</p>
                    <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                      <Download className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Ou "Ajouter à l'écran d'accueil"</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Confirmer l'installation</p>
                    <p className="text-sm text-muted-foreground">
                      Une notification apparaîtra pour confirmer l'installation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Desktop Instructions */}
          <TabsContent value="desktop" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Chercher l'icône d'installation</p>
                    <p className="text-sm text-muted-foreground">
                      Dans la barre d'adresse, cherchez une icône <Download className="inline w-4 h-4" /> ou <Plus className="inline w-4 h-4" />
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Cliquer sur "Installer"</p>
                    <p className="text-sm text-muted-foreground">
                      Une fenêtre popup apparaîtra pour confirmer l'installation
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Lancer l'application</p>
                    <p className="text-sm text-muted-foreground">
                      TAGA s'ouvrira dans sa propre fenêtre, comme une application native
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Astuce :</strong> Une fois installée, l'application fonctionne même hors ligne et se met à jour automatiquement.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={onClose}>
            <Smartphone className="w-4 h-4 mr-2" />
            J'ai compris
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
