import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TestPartner {
  id?: string;
  company_name: string;
  business_type: string;
  email: string;
  phone_number: string;
  verification_status?: string;
  is_active?: boolean;
  created_at?: string;
}

export const PartnerRegistrationTest: React.FC = () => {
  const [testData, setTestData] = useState<TestPartner>({
    company_name: 'Test Transport SA',
    business_type: 'transport',
    email: 'test@transport-sa.cd',
    phone_number: '+243999000001'
  });
  const [testResult, setTestResult] = useState<TestPartner | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [testSteps, setTestSteps] = useState<Array<{ step: string; status: 'pending' | 'running' | 'completed' | 'failed'; message?: string }>>([]);
  const { toast } = useToast();

  const updateStep = (stepIndex: number, status: 'running' | 'completed' | 'failed', message?: string) => {
    setTestSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status, message } : step
    ));
  };

  const runFullTest = async () => {
    setTestStatus('running');
    setTestResult(null);
    
    const steps = [
      { step: '1. Création demande partenaire', status: 'pending' as const },
      { step: '2. Vérification notifications', status: 'pending' as const },
      { step: '3. Simulation validation admin', status: 'pending' as const },
      { step: '4. Vérification audit trail', status: 'pending' as const },
      { step: '5. Test activation/désactivation', status: 'pending' as const }
    ];
    setTestSteps(steps);

    try {
      // Étape 1: Créer une demande de partenaire
      updateStep(0, 'running');
      const { data: partner, error: createError } = await supabase
        .from('partenaires')
        .insert({
          company_name: testData.company_name,
          business_type: testData.business_type,
          email: testData.email,
          phone_number: testData.phone_number,
          verification_status: 'pending',
          is_active: false,
          address: 'Test Address',
          display_name: testData.company_name,
          user_id: '00000000-0000-0000-0000-000000000000', // Temporary user ID for test
          commission_rate: 15
        })
        .select()
        .single();

      if (createError) throw createError;
      updateStep(0, 'completed', `Partenaire créé avec ID: ${partner.id.slice(0, 8)}...`);
      setTestResult(partner);

      // Attendre un peu pour que les triggers se déclenchent
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Étape 2: Vérifier les notifications
      updateStep(1, 'running');
      const { data: notifications, error: notifError } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('type', 'partner_request')
        .order('created_at', { ascending: false })
        .limit(1);

      if (notifError) throw notifError;
      if (notifications && notifications.length > 0) {
        updateStep(1, 'completed', 'Notification admin créée avec succès');
      } else {
        updateStep(1, 'failed', 'Aucune notification trouvée');
      }

      // Étape 3: Simuler validation admin
      updateStep(2, 'running');
      const { error: approveError } = await supabase
        .from('partenaires')
        .update({ 
          verification_status: 'approved',
          is_active: true 
        })
        .eq('id', partner.id);

      if (approveError) throw approveError;
      updateStep(2, 'completed', 'Partenaire approuvé et activé');

      // Étape 4: Vérifier l'audit trail
      updateStep(3, 'running');
      await new Promise(resolve => setTimeout(resolve, 500));
      const { data: auditLogs, error: auditError } = await supabase
        .from('partner_audit_logs')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false });

      if (auditError) throw auditError;
      if (auditLogs && auditLogs.length > 0) {
        updateStep(3, 'completed', `${auditLogs.length} logs d'audit créés`);
      } else {
        updateStep(3, 'failed', 'Aucun log d\'audit trouvé');
      }

      // Étape 5: Test activation/désactivation
      updateStep(4, 'running');
      const { error: deactivateError } = await supabase
        .from('partenaires')
        .update({ is_active: false })
        .eq('id', partner.id);

      if (deactivateError) throw deactivateError;
      
      const { error: reactivateError } = await supabase
        .from('partenaires')
        .update({ is_active: true })
        .eq('id', partner.id);

      if (reactivateError) throw reactivateError;
      updateStep(4, 'completed', 'Test activation/désactivation réussi');

      // Récupérer le partenaire final
      const { data: finalPartner } = await supabase
        .from('partenaires')
        .select('*')
        .eq('id', partner.id)
        .single();

      setTestResult(finalPartner);
      setTestStatus('success');

      toast({
        title: "Test réussi",
        description: "Tous les tests bout-en-bout ont été complétés avec succès"
      });

    } catch (error: any) {
      setTestStatus('error');
      const currentStepIndex = testSteps.findIndex(step => step.status === 'running');
      if (currentStepIndex !== -1) {
        updateStep(currentStepIndex, 'failed', error.message);
      }
      
      toast({
        title: "Erreur de test",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const cleanupTestData = async () => {
    if (!testResult?.id) return;

    try {
      // Supprimer les logs d'audit
      await supabase
        .from('partner_audit_logs')
        .delete()
        .eq('partner_id', testResult.id);

      // Supprimer le partenaire de test
      await supabase
        .from('partenaires')
        .delete()
        .eq('id', testResult.id);

      setTestResult(null);
      setTestSteps([]);
      setTestStatus('idle');

      toast({
        title: "Nettoyage réussi",
        description: "Les données de test ont été supprimées"
      });
    } catch (error: any) {
      toast({
        title: "Erreur de nettoyage",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Test Bout-en-Bout Inscription Partenaire
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration du test */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Nom de l'entreprise</Label>
            <Input
              id="company_name"
              value={testData.company_name}
              onChange={(e) => setTestData(prev => ({ ...prev, company_name: e.target.value }))}
              disabled={testStatus === 'running'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business_type">Type d'entreprise</Label>
            <Select
              value={testData.business_type}
              onValueChange={(value) => setTestData(prev => ({ ...prev, business_type: value }))}
              disabled={testStatus === 'running'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="logistics">Logistique</SelectItem>
                <SelectItem value="delivery">Livraison</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={testData.email}
              onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
              disabled={testStatus === 'running'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_number">Téléphone</Label>
            <Input
              id="phone_number"
              value={testData.phone_number}
              onChange={(e) => setTestData(prev => ({ ...prev, phone_number: e.target.value }))}
              disabled={testStatus === 'running'}
            />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <Button 
            onClick={runFullTest} 
            disabled={testStatus === 'running'}
            className="flex items-center gap-2"
          >
            {testStatus === 'running' ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Lancer le test complet
          </Button>
          
          {testResult && (
            <Button variant="outline" onClick={cleanupTestData}>
              Nettoyer les données de test
            </Button>
          )}
        </div>

        {/* Résultats du test */}
        {testSteps.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Progression du test :</h3>
            <div className="space-y-2">
              {testSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <div className="font-medium">{step.step}</div>
                    {step.message && (
                      <div className="text-sm text-muted-foreground">{step.message}</div>
                    )}
                  </div>
                  <Badge variant={
                    step.status === 'completed' ? 'default' :
                    step.status === 'failed' ? 'destructive' :
                    step.status === 'running' ? 'secondary' : 'outline'
                  }>
                    {step.status === 'completed' ? 'Réussi' :
                     step.status === 'failed' ? 'Échec' :
                     step.status === 'running' ? 'En cours' : 'En attente'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Résultat final */}
        {testResult && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Partenaire de test créé :</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>ID:</strong> {testResult.id}</div>
              <div><strong>Entreprise:</strong> {testResult.company_name}</div>
              <div><strong>Statut:</strong> 
                <Badge className="ml-2" variant={testResult.verification_status === 'approved' ? 'default' : 'secondary'}>
                  {testResult.verification_status}
                </Badge>
              </div>
              <div><strong>Actif:</strong> 
                <Badge className="ml-2" variant={testResult.is_active ? 'default' : 'destructive'}>
                  {testResult.is_active ? 'Oui' : 'Non'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};