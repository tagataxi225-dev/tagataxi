import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Smartphone, MapPin, Clock, LogOut, Key } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ACTIVE_SESSIONS = [
  { id: '1', device: 'iPhone 13', location: 'Kinshasa, RDC', ip: '192.168.1.1', lastActive: new Date(), current: true },
  { id: '2', device: 'Chrome Windows', location: 'Kinshasa, RDC', ip: '192.168.1.2', lastActive: new Date(Date.now() - 86400000), current: false },
];

export const SecurityPanel: React.FC = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleLogoutAll = () => {
    toast.success('Déconnexion de tous les appareils effectuée');
  };

  const handleEnable2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast.success(twoFactorEnabled ? 'Authentification à deux facteurs désactivée' : 'Authentification à deux facteurs activée');
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">Sécurité</span>
          </div>
          <p className="text-sm opacity-90">
            Protégez votre compte
          </p>
        </CardContent>
      </Card>

      {/* Authentification à deux facteurs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Authentification à deux facteurs
            </span>
            <Badge variant={twoFactorEnabled ? 'default' : 'secondary'}>
              {twoFactorEnabled ? 'Activée' : 'Désactivée'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ajoutez une couche de sécurité supplémentaire avec un code envoyé par SMS
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Activer 2FA par SMS</span>
            <Switch 
              checked={twoFactorEnabled}
              onCheckedChange={handleEnable2FA}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Sessions actives */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          Sessions actives ({ACTIVE_SESSIONS.length})
        </h3>
        <div className="space-y-3">
          {ACTIVE_SESSIONS.map((session) => (
            <Card key={session.id} className={session.current ? 'border-green-200 bg-green-50/30' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{session.device}</h4>
                        {session.current && (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                            Actuel
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          IP: {session.ip}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(session.lastActive, 'PPp', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!session.current && (
                    <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                      <LogOut className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Actions de sécurité */}
      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start">
          <Key className="h-4 w-4 mr-2" />
          Changer le mot de passe
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
          onClick={handleLogoutAll}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter de tous les appareils
        </Button>
      </div>

      {/* Info sécurité */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <p className="text-sm text-amber-900">
            🔐 <strong>Conseil de sécurité :</strong> Ne partagez jamais votre mot de passe et activez l'authentification à deux facteurs pour une protection maximale.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
