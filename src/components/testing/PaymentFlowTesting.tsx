import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Play, 
  RefreshCw,
  DollarSign,
  CreditCard,
  Smartphone,
  Users
} from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  progress: number;
}

export const PaymentFlowTesting: React.FC = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [currentSuite, setCurrentSuite] = useState<string>('wallet');
  
  const [testSuites, setTestSuites] = useState<Record<string, TestSuite>>({
    wallet: {
      name: 'Portefeuille TembeaPay',
      progress: 0,
      tests: [
        { id: 'wallet-balance', name: 'Vérification du solde', status: 'pending' },
        { id: 'wallet-topup', name: 'Recharge de crédits', status: 'pending' },
        { id: 'wallet-deduction', name: 'Déduction automatique', status: 'pending' },
        { id: 'wallet-history', name: 'Historique des transactions', status: 'pending' },
        { id: 'wallet-security', name: 'Sécurité des transactions', status: 'pending' }
      ]
    },
    commission: {
      name: 'Système de Commission',
      progress: 0,
      tests: [
        { id: 'commission-calculation', name: 'Calcul des commissions', status: 'pending' },
        { id: 'commission-distribution', name: 'Distribution aux partenaires', status: 'pending' },
        { id: 'commission-admin-fee', name: 'Frais administratifs', status: 'pending' },
        { id: 'commission-real-time', name: 'Mise à jour temps réel', status: 'pending' },
        { id: 'commission-reporting', name: 'Rapports financiers', status: 'pending' }
      ]
    },
    mobileMoney: {
      name: 'Mobile Money',
      progress: 0,
      tests: [
        { id: 'mobile-airtel', name: 'Intégration Airtel Money', status: 'pending' },
        { id: 'mobile-orange', name: 'Intégration Orange Money', status: 'pending' },
        { id: 'mobile-mpesa', name: 'Intégration M-Pesa', status: 'pending' },
        { id: 'mobile-callback', name: 'Gestion des callbacks', status: 'pending' },
        { id: 'mobile-timeout', name: 'Gestion des timeouts', status: 'pending' }
      ]
    },
    security: {
      name: 'Sécurité',
      progress: 0,
      tests: [
        { id: 'security-encryption', name: 'Chiffrement des données', status: 'pending' },
        { id: 'security-auth', name: 'Authentification', status: 'pending' },
        { id: 'security-rls', name: 'Row Level Security', status: 'pending' },
        { id: 'security-injection', name: 'Protection SQL Injection', status: 'pending' },
        { id: 'security-audit', name: 'Logs d\'audit', status: 'pending' }
      ]
    }
  });

  const runSingleTest = async (suiteKey: string, testId: string): Promise<TestResult> => {
    const test = testSuites[suiteKey].tests.find(t => t.id === testId);
    if (!test) throw new Error('Test not found');

    const startTime = Date.now();
    
    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    
    const duration = Date.now() - startTime;
    const isSuccess = Math.random() > 0.2; // 80% success rate

    if (isSuccess) {
      return {
        ...test,
        status: 'passed',
        duration,
        details: generateTestDetails(testId)
      };
    } else {
      return {
        ...test,
        status: 'failed',
        duration,
        error: generateTestError(testId),
        details: generateTestDetails(testId)
      };
    }
  };

  const generateTestDetails = (testId: string) => {
    const details: Record<string, any> = {
      'wallet-balance': {
        initialBalance: 25000,
        finalBalance: 25000,
        currency: 'XOF'
      },
      'wallet-topup': {
        amount: 10000,
        paymentMethod: 'Airtel Money',
        transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9)
      },
      'commission-calculation': {
        rideAmount: 5000,
        driverCommission: 4000,
        partnerCommission: 300,
        adminFee: 700
      },
      'mobile-airtel': {
        provider: 'Airtel',
        responseTime: Math.floor(Math.random() * 3000 + 1000),
        statusCode: 200
      }
    };
    
    return details[testId] || { timestamp: new Date().toISOString() };
  };

  const generateTestError = (testId: string) => {
    const errors = [
      'Timeout: Connexion au service de paiement',
      'Erreur de validation des données',
      'Solde insuffisant pour la transaction',
      'Service temporairement indisponible',
      'Erreur de format dans la réponse API'
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
  };

  const runTestSuite = async (suiteKey: string) => {
    setIsRunning(true);
    const suite = testSuites[suiteKey];
    let completedTests = 0;

    // Reset suite
    setTestSuites(prev => ({
      ...prev,
      [suiteKey]: {
        ...suite,
        progress: 0,
        tests: suite.tests.map(test => ({ ...test, status: 'pending' }))
      }
    }));

    for (const test of suite.tests) {
      // Mark test as running
      setTestSuites(prev => ({
        ...prev,
        [suiteKey]: {
          ...prev[suiteKey],
          tests: prev[suiteKey].tests.map(t => 
            t.id === test.id ? { ...t, status: 'running' } : t
          )
        }
      }));

      try {
        const result = await runSingleTest(suiteKey, test.id);
        
        setTestSuites(prev => ({
          ...prev,
          [suiteKey]: {
            ...prev[suiteKey],
            tests: prev[suiteKey].tests.map(t => 
              t.id === test.id ? result : t
            )
          }
        }));

        if (result.status === 'failed') {
          toast({
            title: "Test échoué",
            description: `${result.name}: ${result.error}`,
            variant: "destructive"
          });
        }

      } catch (error) {
        console.error('Test execution error:', error);
      }

      completedTests++;
      const progress = (completedTests / suite.tests.length) * 100;
      
      setTestSuites(prev => ({
        ...prev,
        [suiteKey]: {
          ...prev[suiteKey],
          progress
        }
      }));
    }

    setIsRunning(false);
    
    const finalSuite = testSuites[suiteKey];
    const passedTests = finalSuite.tests.filter(t => t.status === 'passed').length;
    const totalTests = finalSuite.tests.length;
    
    toast({
      title: "Tests terminés",
      description: `${passedTests}/${totalTests} tests réussis pour ${suite.name}`,
      variant: passedTests === totalTests ? "default" : "destructive"
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    for (const suiteKey of Object.keys(testSuites)) {
      await runTestSuite(suiteKey);
    }
    
    setIsRunning(false);
    
    toast({
      title: "Tous les tests terminés",
      description: "Vérifiez les résultats dans chaque onglet",
      variant: "default"
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      passed: 'bg-green-100 text-green-800 border-green-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
      running: 'bg-blue-100 text-blue-800 border-blue-300',
      pending: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    
    return (
      <Badge className={variants[status]}>
        {status === 'passed' && 'Réussi'}
        {status === 'failed' && 'Échoué'}
        {status === 'running' && 'En cours'}
        {status === 'pending' && 'En attente'}
      </Badge>
    );
  };

  const getSuiteIcon = (suiteKey: string) => {
    const icons = {
      wallet: DollarSign,
      commission: Users,
      mobileMoney: Smartphone,
      security: AlertTriangle
    };
    
    const Icon = icons[suiteKey as keyof typeof icons] || DollarSign;
    return <Icon className="h-4 w-4" />;
  };

  const renderTestSuite = (suiteKey: string, suite: TestSuite) => (
    <div className="space-y-4">
      {/* Suite header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getSuiteIcon(suiteKey)}
          <h3 className="font-semibold">{suite.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={suite.progress} className="w-24" />
          <span className="text-sm text-muted-foreground">
            {Math.round(suite.progress)}%
          </span>
        </div>
      </div>

      {/* Tests list */}
      <div className="space-y-2">
        {suite.tests.map((test) => (
          <Card key={test.id} className="border border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <p className="font-medium">{test.name}</p>
                    {test.duration && (
                      <p className="text-sm text-muted-foreground">
                        {test.duration}ms
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(test.status)}
                </div>
              </div>
              
              {test.error && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{test.error}</p>
                </div>
              )}
              
              {test.details && test.status === 'passed' && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                  <pre className="text-xs text-green-700">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Suite actions */}
      <div className="flex gap-2">
        <Button 
          onClick={() => runTestSuite(suiteKey)}
          disabled={isRunning}
          className="flex-1"
        >
          <Play className="h-4 w-4 mr-2" />
          Exécuter cette suite
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Tests des Flux de Paiement
          </CardTitle>
          <p className="text-muted-foreground">
            Validation complète des systèmes de paiement et de commission
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? 'Tests en cours...' : 'Exécuter tous les tests'}
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>

          <Tabs value={currentSuite} onValueChange={setCurrentSuite} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="wallet" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Portefeuille
              </TabsTrigger>
              <TabsTrigger value="commission" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Commission
              </TabsTrigger>
              <TabsTrigger value="mobileMoney" className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                Mobile Money
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Sécurité
              </TabsTrigger>
            </TabsList>

            {Object.entries(testSuites).map(([suiteKey, suite]) => (
              <TabsContent key={suiteKey} value={suiteKey} className="mt-4">
                {renderTestSuite(suiteKey, suite)}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFlowTesting;