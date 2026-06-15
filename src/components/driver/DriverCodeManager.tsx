import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Share2, 
  QrCode, 
  UserCheck, 
  LogOut, 
  Building2,
  Phone,
  Calendar,
  History,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { useDriverCode } from '@/hooks/useDriverCode';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShareCodeModal } from './ShareCodeModal';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export const DriverCodeManager = () => {
  const { t } = useLanguage();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  const { 
    loading, 
    driverCode, 
    partnerAssignment,
    partnerHistory,
    leavingFleet,
    generateCode, 
    copyCode,
    leaveFleet
  } = useDriverCode();

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Driver Code Section */}
      <Card className="border-primary/20 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <QrCode className="h-5 w-5 text-primary" />
            Code Driver
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-4">
          {driverCode ? (
            <div className="space-y-4">
              {/* QR Code and Code Display */}
              <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                <div className="flex flex-col items-center">
                  {/* QR Code */}
                  <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                    <QRCodeSVG 
                      value={driverCode.code}
                      size={140}
                      level="H"
                      includeMargin={false}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                  
                  {/* Code Text */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Votre code unique</p>
                    <p className="text-3xl font-mono font-bold text-primary tracking-[0.3em]">
                      {driverCode.code}
                    </p>
                  </div>
                  
                  {/* Status Badge */}
                  <Badge 
                    variant="outline" 
                    className={`mt-3 ${
                      partnerAssignment 
                        ? 'text-amber-600 border-amber-300 bg-amber-50' 
                        : 'text-green-600 border-green-300 bg-green-50'
                    }`}
                  >
                    {partnerAssignment ? '🔗 Assigné à une flotte' : '✓ Disponible'}
                  </Badge>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyCode}
                  className="h-10"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShareModalOpen(true)}
                  className="h-10"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Aucun code actif
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Générez votre code pour rejoindre une flotte ou parrainer des chauffeurs
              </p>
              <Button 
                onClick={generateCode} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Génération...' : 'Générer mon code'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partner Status Card */}
      <AnimatePresence mode="wait">
        {partnerAssignment ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-800">Partenaire Actuel</h3>
                </div>
                
                <div className="bg-white rounded-xl p-4 border border-green-200 space-y-3">
                  {/* Partner Name */}
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Entreprise</p>
                      <p className="font-medium text-green-800">
                        {partnerAssignment.partner_name}
                      </p>
                    </div>
                  </div>
                  
                  {/* Partner Phone */}
                  {partnerAssignment.partner_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Contact</p>
                        <p className="font-medium text-green-800">
                          {partnerAssignment.partner_phone}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Join Date */}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Membre depuis</p>
                      <p className="font-medium text-green-800">
                        {new Date(partnerAssignment.added_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Leave Fleet Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={leavingFleet}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {leavingFleet ? 'Départ en cours...' : 'Quitter la flotte'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Quitter la flotte ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir quitter la flotte de{' '}
                        <strong>{partnerAssignment.partner_name}</strong> ?
                        <br /><br />
                        Vous ne recevrez plus de courses de ce partenaire. Vous pourrez rejoindre une autre flotte avec votre code.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={leaveFleet}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Confirmer le départ
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50 bg-muted/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground">Statut Partenaire</h3>
                </div>
                <div className="text-center py-4 bg-card rounded-xl border border-border/50">
                  <p className="text-muted-foreground mb-1">
                    Aucune flotte assignée
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Partagez votre Code Driver pour rejoindre une flotte
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partner History */}
      {partnerHistory.length > 0 && (
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <Card className="border-border/50">
            <CollapsibleTrigger asChild>
              <CardContent className="pt-4 cursor-pointer hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Historique des partenaires</span>
                    <Badge variant="secondary" className="text-xs">
                      {partnerHistory.length}
                    </Badge>
                  </div>
                  {historyOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4">
                <div className="space-y-2">
                  {partnerHistory.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.partner_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.joined_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Badge 
                        variant="outline"
                        className={
                          item.status === 'active' 
                            ? 'text-green-600 border-green-300' 
                            : 'text-gray-500 border-gray-300'
                        }
                      >
                        {item.status === 'active' ? 'Actif' : 'Terminé'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Quick Guide */}
      <Card className="border-border/50">
        <CardContent className="pt-4">
          <h3 className="font-semibold text-foreground mb-3">Guide rapide</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                1
              </div>
              <p className="text-sm text-muted-foreground">
                Générez votre code unique ou utilisez celui existant
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                2
              </div>
              <p className="text-sm text-muted-foreground">
                Partagez le code ou le QR Code avec un partenaire
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                3
              </div>
              <p className="text-sm text-muted-foreground">
                Une fois ajouté, recevez des courses via ce partenaire
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Modal */}
      {driverCode && (
        <ShareCodeModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          code={driverCode.code}
        />
      )}
    </div>
  );
};
