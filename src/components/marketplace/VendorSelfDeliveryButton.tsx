import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Truck, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  orderId: string;
  orderStatus: string;
  onAssignment: () => void;
}

export default function VendorSelfDeliveryButton({ orderId, orderStatus, onAssignment }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [timeoutInfo, setTimeoutInfo] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('30');
  const [isOpen, setIsOpen] = useState(false);

  // Check for driver timeout periodically
  useEffect(() => {
    if (orderStatus === 'ready') {
      const checkTimeout = async () => {
        try {
          const { data } = await supabase.functions.invoke('vendor-self-delivery', {
            body: { 
              orderId, 
              vendorId: user?.id, 
              action: 'check_timeout' 
            }
          });
          
          if (data?.timeout) {
            setTimeoutInfo(data);
          }
        } catch (error) {
          console.error('Error checking timeout:', error);
        }
      };

      checkTimeout();
      const interval = setInterval(checkTimeout, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [orderId, orderStatus, user?.id]);

  const handleSelfAssign = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vendor-self-delivery', {
        body: { 
          orderId,
          vendorId: user.id,
          action: 'self_assign',
          metadata: {
            notes,
            estimatedPickupTime: new Date(Date.now() + parseInt(estimatedTime) * 60 * 1000).toISOString()
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Auto-livraison confirmée",
        description: "Vous avez été assigné pour livrer cette commande.",
      });

      setIsOpen(false);
      onAssignment();
    } catch (error) {
      console.error('Error self-assigning delivery:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vous assigner la livraison. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't show if order is not ready or already assigned
  if (orderStatus !== 'ready' && orderStatus !== 'ready_for_pickup') {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Timeout alert */}
      {timeoutInfo?.timeout && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Aucun chauffeur disponible</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            En attente depuis {Math.round(timeoutInfo.waitTimeMinutes)} minutes
          </p>
          <Badge variant="destructive" className="text-xs animate-pulse">
            <Clock className="h-3 w-3 mr-1" />
            Livraison urgente recommandée
          </Badge>
        </motion.div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant={timeoutInfo?.timeout ? "destructive" : "outline"}
            size="sm"
            className={`w-full transition-all duration-300 ${
              timeoutInfo?.timeout 
                ? 'bg-destructive/20 hover:bg-destructive/30 text-destructive border-destructive/40 animate-pulse' 
                : 'hover:bg-primary/10 hover:border-primary/30'
            }`}
          >
            <Truck className="h-4 w-4 mr-2" />
            {timeoutInfo?.timeout ? 'Je livre maintenant !' : 'Je livre moi-même'}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Auto-livraison
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {timeoutInfo?.timeout && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Situation urgente</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Aucun chauffeur n'a accepté cette livraison depuis {Math.round(timeoutInfo.waitTimeMinutes)} minutes.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Temps estimé jusqu'à la récupération
              </label>
              <select
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 heure</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Notes sur la livraison (optionnel)
              </label>
              <Textarea
                placeholder="Informations supplémentaires pour le client..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Confirmation</span>
              </div>
              <p className="text-xs text-muted-foreground">
                En confirmant, vous vous engagez à récupérer et livrer cette commande personnellement. 
                Le client sera notifié que vous effectuerez la livraison.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSelfAssign}
                disabled={loading}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-all duration-300 text-white"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Assignation...
                  </div>
                ) : (
                  <>
                    <Truck className="h-4 w-4 mr-2" />
                    Confirmer l'assignation
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}