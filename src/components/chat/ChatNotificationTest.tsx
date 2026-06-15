import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { toast } from 'sonner';
import { MessageCircle, TestTube, CheckCircle } from 'lucide-react';

export const ChatNotificationTest = () => {
  const { user } = useAuth();
  const { createOrFindConversation, sendMessage } = useUniversalChat();
  const [testUserId, setTestUserId] = useState('');
  const [testing, setTesting] = useState(false);

  const testNotification = async () => {
    if (!testUserId.trim()) {
      toast.error('Veuillez entrer un ID utilisateur de test');
      return;
    }

    if (testUserId === user?.id) {
      toast.error('Impossible de tester avec votre propre ID (auto-conversation bloquée)');
      return;
    }

    setTesting(true);
    try {
      // Créer une conversation de test
      const conv = await createOrFindConversation(
        'support',
        testUserId,
        undefined,
        'Test notifications chat'
      );
      
      if (conv) {
        // Envoyer un message de test
        await sendMessage(conv.id, '🧪 Message de test pour vérifier les notifications en temps réel');
        
        toast.success('✅ Message test envoyé', {
          description: 'Vérifiez que la notification s\'affiche pour l\'utilisateur destinataire'
        });
      }
    } catch (error: any) {
      console.error('Erreur test notification:', error);
      
      if (error.message?.includes('vous-même')) {
        toast.error('❌ Auto-conversation bloquée', {
          description: 'Le système empêche bien les conversations avec soi-même'
        });
      } else {
        toast.error('❌ Échec du test', {
          description: error.message || 'Une erreur s\'est produite'
        });
      }
    } finally {
      setTesting(false);
    }
  };

  const testAutoConversationBlock = async () => {
    setTesting(true);
    try {
      // Tenter de créer une conversation avec soi-même (doit échouer)
      await createOrFindConversation(
        'support',
        user!.id,
        undefined,
        'Test auto-conversation (doit échouer)'
      );
      
      toast.error('❌ Le blocage auto-conversation ne fonctionne pas !', {
        description: 'La conversation avec soi-même devrait être bloquée'
      });
    } catch (error: any) {
      if (error.message?.includes('vous-même')) {
        toast.success('✅ Blocage auto-conversation fonctionne', {
          description: 'Impossible de créer une conversation avec soi-même'
        });
      } else {
        toast.error('Erreur inattendue: ' + error.message);
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          🧪 Test système de notifications chat
        </CardTitle>
        <CardDescription>
          Testez le système de notifications en temps réel et la protection anti-auto-conversation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test 1: Blocage auto-conversation */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Test 1 : Protection anti-auto-conversation</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Vérifie qu'il est impossible de créer une conversation avec soi-même
          </p>
          <Button 
            onClick={testAutoConversationBlock}
            disabled={testing || !user}
            variant="outline"
            className="w-full"
          >
            {testing ? 'Test en cours...' : 'Tester le blocage'}
          </Button>
        </div>

        {/* Test 2: Notifications entre utilisateurs */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Test 2 : Notifications temps réel</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Envoie un message à un autre utilisateur pour tester les notifications
          </p>
          <div className="space-y-2">
            <Label htmlFor="testUserId">ID de l'utilisateur destinataire (UUID)</Label>
            <Input
              id="testUserId"
              type="text"
              placeholder="ex: 123e4567-e89b-12d3-a456-426614174000"
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              disabled={testing}
            />
            <p className="text-xs text-muted-foreground">
              Utilisateur actuel: <code className="bg-muted px-1 rounded">{user?.id || 'Non connecté'}</code>
            </p>
          </div>
          <Button 
            onClick={testNotification}
            disabled={testing || !user || !testUserId.trim()}
            className="w-full"
          >
            {testing ? 'Envoi en cours...' : 'Envoyer message test'}
          </Button>
        </div>

        {/* Informations */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            ℹ️ Comment tester ?
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>1. Récupérez l'UUID d'un autre utilisateur dans votre base de données</li>
            <li>2. Collez cet UUID dans le champ ci-dessus</li>
            <li>3. Cliquez sur "Envoyer message test"</li>
            <li>4. Connectez-vous avec l'autre utilisateur pour voir la notification</li>
            <li>5. Vérifiez qu'une notification navigateur s'affiche instantanément</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
