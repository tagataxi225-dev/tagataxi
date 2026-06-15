import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { CheckCircle, XCircle, Pause, X } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onAction: (action: string) => Promise<void>;
  onClear: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onAction,
  onClear,
}) => {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      await onAction(action);
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    {
      id: 'activate',
      label: 'Activer',
      icon: CheckCircle,
      color: 'text-green-600',
      description: 'Activer les utilisateurs sélectionnés',
      confirmText: 'Êtes-vous sûr de vouloir activer ces utilisateurs ?',
    },
    {
      id: 'deactivate',
      label: 'Désactiver',
      icon: Pause,
      color: 'text-orange-600',
      description: 'Désactiver les utilisateurs sélectionnés',
      confirmText: 'Êtes-vous sûr de vouloir désactiver ces utilisateurs ?',
    },
    {
      id: 'suspend',
      label: 'Suspendre',
      icon: XCircle,
      color: 'text-red-600',
      description: 'Suspendre les utilisateurs sélectionnés',
      confirmText: 'Êtes-vous sûr de vouloir suspendre ces utilisateurs ? Cette action peut être annulée.',
    },
  ];

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="font-medium text-foreground">
                {selectedCount} utilisateur{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="h-4 w-px bg-border" />
            
            <div className="flex items-center gap-2">
              {actions.map((action) => (
                <AlertDialog key={action.id}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      className="border-transparent hover:border-current"
                    >
                      <action.icon className={`h-4 w-4 mr-2 ${action.color}`} />
                      {action.label}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {action.label} {selectedCount} utilisateur{selectedCount > 1 ? 's' : ''}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {action.confirmText}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleAction(action.id)}
                        className={action.color}
                      >
                        Confirmer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ))}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler la sélection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};