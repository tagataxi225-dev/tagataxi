/**
 * Composant Panic Button avec gestion d'urgence automatique
 * Déclenche des alertes et notifications d'urgence
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Phone, MapPin, Shield, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleLocation } from '@/hooks/useSimpleLocation';

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

interface PanicButtonProps {
  tripId?: string;
  showEmergencyContacts?: boolean;
  autoSendLocation?: boolean;
  onEmergencyTriggered?: (alertId: string) => void;
}

export default function PanicButton({
  tripId,
  showEmergencyContacts = true,
  autoSendLocation = true,
  onEmergencyTriggered
}: PanicButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [alertId, setAlertId] = useState<string | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const { getCurrentPosition, currentPosition } = useSimpleLocation();

  // Charger les contacts d'urgence
  useEffect(() => {
    loadEmergencyContacts();
  }, []);

  const loadEmergencyContacts = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Récupérer les contacts d'urgence depuis le profil client
      const { data: profile } = await supabase
        .from('clients')
        .select('emergency_contact_name, emergency_contact_phone')
        .eq('user_id', user.user.id)
        .maybeSingle();

      if (profile && profile.emergency_contact_name && profile.emergency_contact_phone) {
        setEmergencyContacts([{
          name: profile.emergency_contact_name,
          phone: profile.emergency_contact_phone,
          relationship: 'Contact principal'
        }]);
      }
    } catch (error) {
      console.error('Erreur chargement contacts d\'urgence:', error);
    }
  };

  const handlePanicPress = useCallback(async () => {
    if (isPressed) return;

    setIsPressed(true);
    setCountdown(3);
    
    // Décompte de 3 secondes
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          triggerEmergencyAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Permettre l'annulation pendant le décompte
    setTimeout(() => {
      if (isPressed) {
        clearInterval(countdownInterval);
      }
    }, 50);
  }, [isPressed]);

  const cancelPanic = useCallback(() => {
    setIsPressed(false);
    setCountdown(0);
    toast({
      title: "Alerte annulée",
      description: "L'alerte d'urgence a été annulée.",
      variant: "default"
    });
  }, [toast]);

  const triggerEmergencyAlert = async () => {
    setIsLoading(true);
    
    try {
      // Obtenir la position actuelle
      const location = autoSendLocation ? await getCurrentPosition() : currentPosition;
      
      if (!location) {
        throw new Error('Impossible d\'obtenir la position actuelle');
      }

      // Créer l'alerte d'urgence
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non authentifié');

      const { data: alert, error } = await supabase
        .from('emergency_alerts')
        .insert({
          user_id: user.user.id,
          alert_type: 'panic',
          status: 'active',
          location: {
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy || 10,
            timestamp: new Date().toISOString()
          },
          trip_id: tripId,
          emergency_contacts: emergencyContacts as any,
          priority_level: 1,
          auto_notifications_sent: {}
        })
        .select()
        .single();

      if (error) throw error;

      setAlertId(alert.id);
      
      // Déclencher les notifications automatiques
      await sendEmergencyNotifications(alert.id, location);
      
      // Notifier le parent
      onEmergencyTriggered?.(alert.id);

      toast({
        title: "🚨 ALERTE D'URGENCE ACTIVÉE",
        description: "Les services d'urgence et vos contacts ont été notifiés.",
        variant: "destructive"
      });

    } catch (error) {
      console.error('Erreur déclenchement alerte:', error);
      toast({
        title: "Erreur",
        description: "Impossible de déclencher l'alerte d'urgence. Contactez directement les secours.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsPressed(false);
      setCountdown(0);
    }
  };

  const sendEmergencyNotifications = async (alertId: string, location: any) => {
    try {
      // Envoyer via Edge Function pour notifications push et SMS
      await supabase.functions.invoke('emergency-dispatcher', {
        body: {
          alert_id: alertId,
          location: location,
          emergency_contacts: emergencyContacts,
          trip_id: tripId,
          message: 'URGENCE: Une alerte de sécurité a été déclenchée. Position jointe.'
        }
      });
    } catch (error) {
      console.error('Erreur envoi notifications d\'urgence:', error);
    }
  };

  const resolveAlert = async () => {
    if (!alertId) return;

    try {
      const { error } = await supabase
        .from('emergency_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: 'Résolue par l\'utilisateur'
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlertId(null);
      toast({
        title: "Alerte résolue",
        description: "L'alerte d'urgence a été marquée comme résolue.",
        variant: "default"
      });
    } catch (error) {
      console.error('Erreur résolution alerte:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bouton principal */}
      <Card className="p-6 border-2 border-destructive">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-destructive">
            <Shield className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Alerte d'Urgence</h3>
          </div>
          
          {!alertId ? (
            <>
              <Button
                size="lg"
                variant={isPressed ? "secondary" : "destructive"}
                className={`w-full h-16 text-lg font-bold ${
                  isPressed ? 'animate-pulse' : ''
                }`}
                onMouseDown={handlePanicPress}
                onMouseUp={isPressed ? cancelPanic : undefined}
                onTouchStart={handlePanicPress}
                onTouchEnd={isPressed ? cancelPanic : undefined}
                disabled={isLoading}
              >
                {countdown > 0 ? (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Relâchez pour annuler ({countdown}s)</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>APPUYER EN CAS D'URGENCE</span>
                  </div>
                )}
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Maintenez appuyé 3 secondes pour déclencher l'alerte
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 text-destructive">
                  <AlertTriangle className="h-5 w-5 animate-pulse" />
                  <span className="font-semibold">ALERTE ACTIVE</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Les secours ont été notifiés
                </p>
              </div>
              
              <Button
                variant="outline"
                onClick={resolveAlert}
                className="w-full"
              >
                Marquer comme résolue
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Contacts d'urgence */}
      {showEmergencyContacts && emergencyContacts.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>Contacts d'urgence</span>
          </h4>
          <div className="space-y-2">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-muted-foreground">{contact.relationship}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`tel:${contact.phone}`)}
                >
                  {contact.phone}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Informations de position */}
      {currentPosition && (
        <Card className="p-4">
          <h4 className="font-medium mb-2 flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Position actuelle</span>
          </h4>
          <div className="text-sm text-muted-foreground">
            <div>Lat: {currentPosition.lat.toFixed(6)}</div>
            <div>Lng: {currentPosition.lng.toFixed(6)}</div>
            {currentPosition.accuracy && (
              <div>Précision: ±{currentPosition.accuracy}m</div>
            )}
          </div>
        </Card>
      )}

      {/* Numéros d'urgence */}
      <Card className="p-4 bg-muted">
        <h4 className="font-medium mb-3">Numéros d'urgence RDC</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open('tel:112')}
          >
            🚔 Police: 112
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open('tel:118')}
          >
            🚒 Pompiers: 118
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open('tel:+243818150011')}
          >
            🛡️ Protection civile
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open('tel:+243858040400')}
          >
            📞 Support TAGA
          </Button>
        </div>
      </Card>
    </div>
  );
}