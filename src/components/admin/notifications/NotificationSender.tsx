/**
 * Interface d'envoi rapide de notifications
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Send,
  Mail,
  MessageSquare,
  Smartphone,
  Bell,
  Users,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuickSendForm {
  type: 'email' | 'sms' | 'push' | 'in_app';
  title: string;
  message: string;
  target: 'all' | 'clients' | 'drivers' | 'partners' | 'custom';
  audience_size: number;
  schedule_type: 'now' | 'scheduled';
  scheduled_at?: string;
}

export const NotificationSender: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState<QuickSendForm>({
    type: 'push',
    title: '',
    message: '',
    target: 'all',
    audience_size: 0,
    schedule_type: 'now'
  });

  // Mock données audience
  const audienceSizes = {
    all: 3456,
    clients: 2347,
    drivers: 892,
    partners: 217,
    custom: 0
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Smartphone className="h-4 w-4" />;
      case 'in_app': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'email': return 'Email';
      case 'sms': return 'SMS';
      case 'push': return 'Push';
      case 'in_app': return 'In-App';
      default: return 'Notification';
    }
  };

  const getTargetLabel = (target: string) => {
    switch (target) {
      case 'all': return 'Tous les utilisateurs';
      case 'clients': return 'Clients uniquement';
      case 'drivers': return 'Chauffeurs uniquement';
      case 'partners': return 'Partenaires uniquement';
      case 'custom': return 'Segment personnalisé';
      default: return 'Audience';
    }
  };

  const handleSend = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir le titre et le message',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('notification-dispatcher', {
        body: {
          type: formData.type,
          title: formData.title,
          message: formData.message,
          target_audience: formData.target,
          send_immediately: formData.schedule_type === 'now',
          scheduled_at: formData.scheduled_at
        }
      });

      if (error) throw error;

      toast({
        title: 'Notification envoyée',
        description: `${getTypeLabel(formData.type)} envoyée à ${audienceSizes[formData.target as keyof typeof audienceSizes]} utilisateurs`
      });

      // Reset form
      setFormData({
        type: 'push',
        title: '',
        message: '',
        target: 'all',
        audience_size: 0,
        schedule_type: 'now'
      });

    } catch (error: any) {
      toast({
        title: 'Erreur d\'envoi',
        description: error.message || 'Impossible d\'envoyer la notification',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const estimateDeliveryTime = () => {
    const size = audienceSizes[formData.target as keyof typeof audienceSizes];
    if (size < 100) return '< 1 minute';
    if (size < 1000) return '2-3 minutes';
    if (size < 5000) return '5-10 minutes';
    return '10-15 minutes';
  };

  if (previewMode) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Aperçu de la Notification
            </CardTitle>
            <Button variant="outline" onClick={() => setPreviewMode(false)}>
              Retour à l'éditeur
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview selon le type */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              {getTypeIcon(formData.type)}
              <Badge variant="outline">{getTypeLabel(formData.type)}</Badge>
            </div>
            
            {formData.type === 'email' && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Objet:</div>
                <div className="font-medium">{formData.title}</div>
                <div className="text-sm text-gray-600 mt-3">Message:</div>
                <div className="whitespace-pre-wrap">{formData.message}</div>
              </div>
            )}
            
            {(formData.type === 'push' || formData.type === 'in_app') && (
              <div className="space-y-2">
                <div className="font-medium">{formData.title}</div>
                <div className="text-sm text-gray-600">{formData.message}</div>
              </div>
            )}
            
            {formData.type === 'sms' && (
              <div className="space-y-2">
                <div className="font-medium">SMS ({formData.message.length}/160 caractères)</div>
                <div className="text-sm">{formData.message}</div>
              </div>
            )}
          </div>

          {/* Détails de diffusion */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Audience cible:</p>
              <p className="font-medium">{getTargetLabel(formData.target)}</p>
            </div>
            <div>
              <p className="text-gray-600">Destinataires:</p>
              <p className="font-medium">{audienceSizes[formData.target as keyof typeof audienceSizes].toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Temps de livraison estimé:</p>
              <p className="font-medium">{estimateDeliveryTime()}</p>
            </div>
            <div>
              <p className="text-gray-600">Programmation:</p>
              <p className="font-medium">
                {formData.schedule_type === 'now' ? 'Envoi immédiat' : 'Programmé'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button onClick={handleSend} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </div>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Confirmer et Envoyer
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setPreviewMode(false)}>
              Modifier
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Envoi Rapide de Notification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type de notification */}
        <div className="space-y-2">
          <Label>Type de notification</Label>
          <div className="grid grid-cols-4 gap-2">
            {(['push', 'email', 'sms', 'in_app'] as const).map((type) => (
              <Button
                key={type}
                variant={formData.type === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData({ ...formData, type })}
                className="flex items-center gap-1"
              >
                {getTypeIcon(type)}
                {getTypeLabel(type)}
              </Button>
            ))}
          </div>
        </div>

        {/* Titre */}
        <div className="space-y-2">
          <Label htmlFor="title">
            {formData.type === 'email' ? 'Objet' : 'Titre'}
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={formData.type === 'email' ? 'Objet de l\'email...' : 'Titre de la notification...'}
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Tapez votre message ici..."
            rows={4}
          />
          {formData.type === 'sms' && (
            <p className="text-xs text-gray-500">
              {formData.message.length}/160 caractères
              {formData.message.length > 160 && (
                <span className="text-red-500 ml-1">
                  (sera divisé en {Math.ceil(formData.message.length / 160)} SMS)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Audience cible */}
        <div className="space-y-2">
          <Label>Audience cible</Label>
          <Select 
            value={formData.target} 
            onValueChange={(value) => setFormData({ ...formData, target: value as any })}
          >
            <SelectTrigger>
              <Users className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Tous les utilisateurs ({audienceSizes.all.toLocaleString()})
              </SelectItem>
              <SelectItem value="clients">
                Clients ({audienceSizes.clients.toLocaleString()})
              </SelectItem>
              <SelectItem value="drivers">
                Chauffeurs ({audienceSizes.drivers.toLocaleString()})
              </SelectItem>
              <SelectItem value="partners">
                Partenaires ({audienceSizes.partners.toLocaleString()})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Programmation */}
        <div className="space-y-3">
          <Label>Programmation</Label>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="now" 
                checked={formData.schedule_type === 'now'}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, schedule_type: checked ? 'now' : 'scheduled' })
                }
              />
              <Label htmlFor="now">Envoyer maintenant</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="scheduled" 
                checked={formData.schedule_type === 'scheduled'}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, schedule_type: checked ? 'scheduled' : 'now' })
                }
              />
              <Label htmlFor="scheduled">Programmer</Label>
            </div>
          </div>
          
          {formData.schedule_type === 'scheduled' && (
            <Input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              min={new Date().toISOString().slice(0, 16)}
            />
          )}
        </div>

        <Separator />

        {/* Estimation */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 mb-1">
            <Target className="h-4 w-4" />
            <span className="font-medium">Résumé de l'envoi</span>
          </div>
          <p className="text-sm text-blue-600">
            {audienceSizes[formData.target as keyof typeof audienceSizes].toLocaleString()} destinataires • 
            Temps estimé: {estimateDeliveryTime()} • 
            Type: {getTypeLabel(formData.type)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={() => setPreviewMode(true)}
            variant="outline"
            disabled={!formData.title.trim() || !formData.message.trim()}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Aperçu
          </Button>
          <Button 
            onClick={handleSend}
            disabled={isLoading || !formData.title.trim() || !formData.message.trim()}
            className="flex-1"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Envoi...
              </div>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                Envoyer
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};