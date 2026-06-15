import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, Megaphone, Gift, Info, Wrench } from 'lucide-react';

const NOTIFICATION_TEMPLATES = [
  {
    id: 'general',
    icon: Megaphone,
    title: 'Annonce générale',
    description: 'Communication importante pour tous',
    color: 'bg-blue-500',
    example: {
      title: 'Information importante',
      message: 'Nous vous informons que...'
    },
    priority: 'normal',
    targetable: ['all']
  },
  {
    id: 'promo',
    icon: Gift,
    title: 'Promotion',
    description: 'Offres et réductions spéciales',
    color: 'bg-green-500',
    example: {
      title: '🎉 Promotion spéciale !',
      message: 'Profitez de -20% sur tous vos trajets ce week-end !'
    },
    priority: 'normal',
    targetable: ['all_clients', 'active_drivers']
  },
  {
    id: 'urgent',
    icon: AlertTriangle,
    title: 'Alerte urgente',
    description: 'Notification critique immédiate',
    color: 'bg-red-500',
    example: {
      title: '🚨 Alerte de sécurité',
      message: 'Une activité suspecte a été détectée sur votre compte'
    },
    priority: 'urgent',
    targetable: ['all']
  },
  {
    id: 'maintenance',
    icon: Wrench,
    title: 'Maintenance programmée',
    description: 'Avis de maintenance système',
    color: 'bg-orange-500',
    example: {
      title: '🔧 Maintenance programmée',
      message: 'Le système sera indisponible le [DATE] de [HEURE] à [HEURE]'
    },
    priority: 'high',
    targetable: ['all']
  },
  {
    id: 'info',
    icon: Info,
    title: 'Information',
    description: 'Mise à jour ou changement de service',
    color: 'bg-blue-500',
    example: {
      title: 'Nouvelle fonctionnalité',
      message: 'Découvrez notre nouvelle fonctionnalité de [FEATURE]'
    },
    priority: 'normal',
    targetable: ['all']
  },
  {
    id: 'welcome',
    icon: Bell,
    title: 'Message de bienvenue',
    description: 'Accueillir les nouveaux utilisateurs',
    color: 'bg-purple-500',
    example: {
      title: 'Bienvenue sur TembeaRide !',
      message: 'Nous sommes ravis de vous compter parmi nous. Commencez dès maintenant !'
    },
    priority: 'normal',
    targetable: ['all_clients']
  }
];

interface NotificationTemplatesProps {
  onSelectTemplate?: (template: typeof NOTIFICATION_TEMPLATES[0]) => void;
}

export const NotificationTemplates: React.FC<NotificationTemplatesProps> = ({ onSelectTemplate }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Templates prédéfinis</h3>
        <p className="text-muted-foreground">
          Sélectionnez un template pour gagner du temps ou personnalisez votre propre notification
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {NOTIFICATION_TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <Card key={template.id} className="hover:border-primary transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg ${template.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {template.priority}
                  </Badge>
                </div>
                <CardTitle className="text-base">{template.title}</CardTitle>
                <CardDescription className="text-sm">{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-3 rounded-lg mb-3 space-y-2">
                  <div className="font-semibold text-sm">{template.example.title}</div>
                  <div className="text-xs text-muted-foreground">{template.example.message}</div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <span>Cibles:</span>
                  {template.targetable.map((target) => (
                    <Badge key={target} variant="secondary" className="text-[10px]">
                      {target}
                    </Badge>
                  ))}
                </div>

                {onSelectTemplate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onSelectTemplate(template)}
                  >
                    Utiliser ce template
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
