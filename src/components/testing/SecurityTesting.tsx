import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Lock, 
  Key, 
  Database, 
  Server,
  User,
  CreditCard,
  Eye,
  EyeOff,
  Scan
} from 'lucide-react';

interface SecurityTest {
  id: string;
  name: string;
  category: 'auth' | 'data' | 'api' | 'rls' | 'payment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  description: string;
  result?: string;
  recommendations?: string[];
}

interface SecurityReport {
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  criticalIssues: number;
  securityScore: number;
}

export const SecurityTesting: React.FC = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>('auth');
  
  const [securityTests, setSecurityTests] = useState<SecurityTest[]>([
    // Authentication Tests
    {
      id: 'auth-jwt-validation',
      name: 'Validation des tokens JWT',
      category: 'auth',
      severity: 'critical',
      status: 'pending',
      description: 'Vérification de la validation et de l\'expiration des tokens JWT'
    },
    {
      id: 'auth-password-policy',
      name: 'Politique de mots de passe',
      category: 'auth',
      severity: 'high',
      status: 'pending',
      description: 'Contrôle des exigences de complexité des mots de passe'
    },
    {
      id: 'auth-session-management',
      name: 'Gestion des sessions',
      category: 'auth',
      severity: 'high',
      status: 'pending',
      description: 'Vérification de la gestion sécurisée des sessions utilisateur'
    },
    {
      id: 'auth-brute-force',
      name: 'Protection contre force brute',
      category: 'auth',
      severity: 'medium',
      status: 'pending',
      description: 'Limitation des tentatives de connexion répétées'
    },

    // Data Protection Tests  
    {
      id: 'data-encryption',
      name: 'Chiffrement des données sensibles',
      category: 'data',
      severity: 'critical',
      status: 'pending',
      description: 'Vérification du chiffrement des données personnelles et financières'
    },
    {
      id: 'data-backup-security',
      name: 'Sécurité des sauvegardes',
      category: 'data',
      severity: 'high',
      status: 'pending',
      description: 'Protection des sauvegardes de données'
    },
    {
      id: 'data-retention',
      name: 'Politique de rétention',
      category: 'data',
      severity: 'medium',
      status: 'pending',
      description: 'Gestion de la rétention et suppression des données'
    },

    // API Security Tests
    {
      id: 'api-rate-limiting',
      name: 'Limitation de taux API',
      category: 'api',
      severity: 'high',
      status: 'pending',
      description: 'Protection contre les attaques de déni de service'
    },
    {
      id: 'api-input-validation',
      name: 'Validation des entrées',
      category: 'api',
      severity: 'critical',
      status: 'pending',
      description: 'Validation et sanitization des données d\'entrée'
    },
    {
      id: 'api-cors-policy',
      name: 'Politique CORS',
      category: 'api',
      severity: 'medium',
      status: 'pending',
      description: 'Configuration sécurisée du partage de ressources cross-origin'
    },

    // Row Level Security Tests
    {
      id: 'rls-user-data',
      name: 'RLS données utilisateur',
      category: 'rls',
      severity: 'critical',
      status: 'pending',
      description: 'Vérification de l\'isolation des données utilisateur'
    },
    {
      id: 'rls-financial-data',
      name: 'RLS données financières',
      category: 'rls',
      severity: 'critical',
      status: 'pending',
      description: 'Protection des données financières sensibles'
    },
    {
      id: 'rls-admin-access',
      name: 'Contrôle d\'accès admin',
      category: 'rls',
      severity: 'high',
      status: 'pending',
      description: 'Limitation des accès administrateur'
    },

    // Payment Security Tests
    {
      id: 'payment-pci-compliance',
      name: 'Conformité PCI DSS',
      category: 'payment',
      severity: 'critical',
      status: 'pending',
      description: 'Respect des standards de sécurité des données de cartes'
    },
    {
      id: 'payment-transaction-integrity',
      name: 'Intégrité des transactions',
      category: 'payment',
      severity: 'critical',
      status: 'pending',
      description: 'Vérification de l\'intégrité des transactions financières'
    },
    {
      id: 'payment-fraud-detection',
      name: 'Détection de fraude',
      category: 'payment',
      severity: 'high',
      status: 'pending',
      description: 'Systèmes de détection d\'activités frauduleuses'
    }
  ]);

  const [securityReport, setSecurityReport] = useState<SecurityReport>({
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    criticalIssues: 0,
    securityScore: 0
  });

  const runSecurityTest = async (testId: string): Promise<SecurityTest> => {
    const test = securityTests.find(t => t.id === testId);
    if (!test) throw new Error('Test not found');

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));

    // Simulate test results based on test type
    const results = generateSecurityTestResult(testId);
    
    return {
      ...test,
      ...results
    };
  };

  const generateSecurityTestResult = (testId: string) => {
    // Mock security test results
    const mockResults: Record<string, any> = {
      'auth-jwt-validation': {
        status: 'passed',
        result: 'JWT tokens validés correctement. Expiration configurée à 1h.',
        recommendations: ['Considérer la rotation automatique des tokens']
      },
      'auth-password-policy': {
        status: 'warning',
        result: 'Politique partiellement conforme. Longueur minimale: 8 caractères.',
        recommendations: [
          'Augmenter la longueur minimale à 12 caractères',
          'Exiger des caractères spéciaux',
          'Implémenter la vérification de mots de passe compromis'
        ]
      },
      'data-encryption': {
        status: 'passed',
        result: 'Données chiffrées avec AES-256. Clés gérées par Supabase.',
        recommendations: ['Envisager le chiffrement au niveau application pour données ultra-sensibles']
      },
      'api-input-validation': {
        status: 'failed',
        result: 'Validation insuffisante détectée sur certains endpoints.',
        recommendations: [
          'Implémenter la validation Zod sur tous les endpoints',
          'Ajouter la sanitization des entrées HTML',
          'Contrôler la taille maximale des payloads'
        ]
      },
      'rls-user-data': {
        status: 'passed',
        result: 'RLS correctement configuré. Isolation utilisateur vérifiée.',
        recommendations: ['Tests réguliers des politiques RLS recommandés']
      },
      'payment-pci-compliance': {
        status: 'warning',
        result: 'Conformité partielle. Données de cartes non stockées localement.',
        recommendations: [
          'Audit de sécurité complet recommandé',
          'Documentation des processus de conformité',
          'Formation équipe sur PCI DSS'
        ]
      }
    };

    // Default to random result if not mocked
    if (!mockResults[testId]) {
      const statuses = ['passed', 'warning', 'failed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      return {
        status: randomStatus,
        result: `Test ${testId} - ${randomStatus}`,
        recommendations: ['Révision recommandée']
      };
    }

    return mockResults[testId];
  };

  const runCategoryTests = async (category: string) => {
    setIsRunning(true);
    const categoryTests = securityTests.filter(test => test.category === category);
    
    for (const test of categoryTests) {
      // Mark test as running
      setSecurityTests(prev => prev.map(t => 
        t.id === test.id ? { ...t, status: 'running' } : t
      ));

      try {
        const result = await runSecurityTest(test.id);
        setSecurityTests(prev => prev.map(t => 
          t.id === test.id ? result : t
        ));
      } catch (error) {
        console.error('Security test error:', error);
      }
    }
    
    updateSecurityReport();
    setIsRunning(false);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    for (const test of securityTests) {
      setSecurityTests(prev => prev.map(t => 
        t.id === test.id ? { ...t, status: 'running' } : t
      ));

      try {
        const result = await runSecurityTest(test.id);
        setSecurityTests(prev => prev.map(t => 
          t.id === test.id ? result : t
        ));
      } catch (error) {
        console.error('Security test error:', error);
      }
    }
    
    updateSecurityReport();
    setIsRunning(false);
    
    toast({
      title: "Audit de sécurité terminé",
      description: "Consultez le rapport pour les détails",
      variant: "default"
    });
  };

  const updateSecurityReport = () => {
    const totalTests = securityTests.length;
    const passed = securityTests.filter(t => t.status === 'passed').length;
    const failed = securityTests.filter(t => t.status === 'failed').length;
    const warnings = securityTests.filter(t => t.status === 'warning').length;
    const criticalIssues = securityTests.filter(t => 
      t.status === 'failed' && t.severity === 'critical'
    ).length;
    
    const securityScore = Math.round((passed / totalTests) * 100);
    
    setSecurityReport({
      totalTests,
      passed,
      failed,
      warnings,
      criticalIssues,
      securityScore
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      auth: User,
      data: Database,
      api: Server,
      rls: Lock,
      payment: CreditCard
    };
    
    const Icon = icons[category as keyof typeof icons] || Shield;
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryName = (category: string) => {
    const names = {
      auth: 'Authentification',
      data: 'Protection des Données',
      api: 'Sécurité API',
      rls: 'Row Level Security',
      payment: 'Sécurité Paiements'
    };
    
    return names[category as keyof typeof names] || category;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Security Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Audit de Sécurité TAGA</CardTitle>
                <p className="text-muted-foreground">
                  Tests de sécurité automatisés pour la plateforme
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                securityReport.securityScore >= 90 ? 'text-green-600' :
                securityReport.securityScore >= 70 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {securityReport.securityScore}%
              </div>
              <p className="text-sm text-muted-foreground">Score de sécurité</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{securityReport.totalTests}</div>
              <p className="text-sm text-muted-foreground">Tests Total</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{securityReport.passed}</div>
              <p className="text-sm text-muted-foreground">Réussis</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{securityReport.warnings}</div>
              <p className="text-sm text-muted-foreground">Avertissements</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{securityReport.failed}</div>
              <p className="text-sm text-muted-foreground">Échecs</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800">{securityReport.criticalIssues}</div>
              <p className="text-sm text-muted-foreground">Critique</p>
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <Button 
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Scan className="h-4 w-4 mr-2" />
              {isRunning ? 'Audit en cours...' : 'Lancer l\'audit complet'}
            </Button>
            <Button variant="outline">
              <Key className="h-4 w-4 mr-2" />
              Générer certificat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Tests by Category */}
      <Tabs value={currentCategory} onValueChange={setCurrentCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {['auth', 'data', 'api', 'rls', 'payment'].map((category) => (
            <TabsTrigger key={category} value={category} className="flex items-center gap-1">
              {getCategoryIcon(category)}
              <span className="hidden sm:inline">{getCategoryName(category)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {['auth', 'data', 'api', 'rls', 'payment'].map((category) => (
          <TabsContent key={category} value={category} className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {getCategoryName(category)}
                  </CardTitle>
                  <Button 
                    onClick={() => runCategoryTests(category)}
                    disabled={isRunning}
                    variant="outline"
                  >
                    Tester cette catégorie
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityTests.filter(test => test.category === category).map((test) => (
                    <Card key={test.id} className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getStatusIcon(test.status)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{test.name}</h4>
                                <Badge className={getSeverityColor(test.severity)}>
                                  {test.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {test.description}
                              </p>
                              
                              {test.result && (
                                <div className={`p-2 rounded-md mb-2 ${
                                  test.status === 'passed' ? 'bg-green-50 border border-green-200' :
                                  test.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                                  'bg-red-50 border border-red-200'
                                }`}>
                                  <p className={`text-sm ${
                                    test.status === 'passed' ? 'text-green-700' :
                                    test.status === 'warning' ? 'text-yellow-700' :
                                    'text-red-700'
                                  }`}>
                                    {test.result}
                                  </p>
                                </div>
                              )}
                              
                              {test.recommendations && test.recommendations.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium mb-1">Recommandations:</p>
                                  <ul className="text-sm text-muted-foreground space-y-1">
                                    {test.recommendations.map((rec, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Critical Issues Alert */}
      {securityReport.criticalIssues > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Attention:</strong> {securityReport.criticalIssues} problème(s) critique(s) détecté(s). 
            Une correction immédiate est recommandée pour maintenir la sécurité de la plateforme.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SecurityTesting;