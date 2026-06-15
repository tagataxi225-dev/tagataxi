import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ultraLocationService } from '@/services/UltraLocationService';
import { 
  Navigation, 
  MapPin, 
  Wifi, 
  Database, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock,
  Gauge,
  Globe,
  Smartphone,
  Monitor,
  Loader2
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'loading';
  duration?: number;
  data?: any;
  error?: string;
}

const GeolocationSystemTest = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [overallProgress, setOverallProgress] = useState(0);

  const ultraService = ultraLocationService;

  const tests = [
    {
      name: 'GPS High Accuracy',
      description: 'Test de géolocalisation GPS haute précision',
      icon: Navigation,
      test: () => ultraService.getCurrentPosition({ 
        enableHighAccuracy: true, 
        timeout: 8000,
        fallbackToIP: false,
        fallbackToDatabase: false,
        fallbackToDefault: false
      })
    },
    {
      name: 'IP Geolocation',
      description: 'Test de géolocalisation par IP',
      icon: Globe,
      test: () => ultraService.getCurrentPosition({ 
        enableHighAccuracy: false,
        fallbackToIP: true,
        fallbackToDatabase: false,
        fallbackToDefault: false
      })
    },
    {
      name: 'Database Fallback',
      description: 'Test de fallback base de données',
      icon: Database,
      test: () => ultraService.getCurrentPosition({ 
        fallbackToIP: false,
        fallbackToDatabase: true,
        fallbackToDefault: false
      })
    },
    {
      name: 'Smart Default',
      description: 'Test de position par défaut intelligente',
      icon: Settings,
      test: () => ultraService.getCurrentPosition({ 
        fallbackToIP: false,
        fallbackToDatabase: false,
        fallbackToDefault: true
      })
    },
    {
      name: 'Full Stack Test',
      description: 'Test complet avec tous les fallbacks',
      icon: CheckCircle,
      test: () => ultraService.getCurrentPosition()
    }
  ];

  const runSingleTest = async (testItem: any, index: number) => {
    const startTime = Date.now();
    
    setTestResults(prev => [
      ...prev.slice(0, index),
      { name: testItem.name, status: 'loading' },
      ...prev.slice(index + 1)
    ]);

    try {
      const result = await testItem.test();
      const duration = Date.now() - startTime;

      setTestResults(prev => [
        ...prev.slice(0, index),
        { 
          name: testItem.name, 
          status: 'success', 
          duration,
          data: result 
        },
        ...prev.slice(index + 1)
      ]);

      if (testItem.name === 'Full Stack Test') {
        setCurrentLocation(result);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      setTestResults(prev => [
        ...prev.slice(0, index),
        { 
          name: testItem.name, 
          status: 'error', 
          duration,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        },
        ...prev.slice(index + 1)
      ]);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults(tests.map(t => ({ name: t.name, status: 'loading' as const })));
    setOverallProgress(0);

    for (let i = 0; i < tests.length; i++) {
      await runSingleTest(tests[i], i);
      setOverallProgress(((i + 1) / tests.length) * 100);
      
      // Délai entre les tests pour éviter la surcharge
      if (i < tests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsRunning(false);
  };

  const runSearchTest = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await ultraService.searchLocation(searchQuery, currentLocation);
      setSearchResults(results);
    } catch (error) {
      console.error('Search test failed:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading': return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-emerald-100 border-emerald-300';
      case 'error': return 'bg-red-100 border-red-300';
      case 'loading': return 'bg-primary/10 border-primary/30';
      default: return 'bg-muted border-border';
    }
  };

  // Browser compatibility detection
  const getBrowserSupport = () => {
    return {
      geolocation: 'geolocation' in navigator,
      secureContext: isSecureContext,
      userAgent: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
    };
  };

  const browserSupport = getBrowserSupport();

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Test Système de Géolocalisation Ultra
        </h1>
        <p className="text-muted-foreground">
          Validation complète du nouveau système de géolocalisation avec tous les fallbacks
        </p>
      </motion.div>

      {/* Browser Support Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Compatibilité Navigateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={browserSupport.geolocation ? "default" : "destructive"}>
                {browserSupport.geolocation ? "✓" : "✗"} Géolocalisation
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={browserSupport.secureContext ? "default" : "destructive"}>
                {browserSupport.secureContext ? "✓" : "✗"} Contexte Sécurisé
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {browserSupport.userAgent === 'Mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                {browserSupport.userAgent}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tests">Tests Automatisés</TabsTrigger>
          <TabsTrigger value="search">Test de Recherche</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Suite de Tests Géolocalisation</CardTitle>
                <Button 
                  onClick={runAllTests} 
                  disabled={isRunning}
                  className="min-w-[120px]"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Tests en cours...
                    </>
                  ) : (
                    'Lancer tous les tests'
                  )}
                </Button>
              </div>
              {isRunning && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progression globale</span>
                    <span>{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="w-full" />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {tests.map((test, index) => {
                  const result = testResults[index];
                  const Icon = test.icon;
                  
                  return (
                    <motion.div
                      key={test.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`transition-all duration-300 ${result ? getStatusColor(result.status) : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-primary" />
                              <div>
                                <h4 className="font-semibold">{test.name}</h4>
                                <p className="text-sm text-muted-foreground">{test.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {result && result.duration && (
                                <Badge variant="outline" className="text-xs">
                                  {result.duration}ms
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => runSingleTest(test, index)}
                                disabled={isRunning}
                              >
                                Test individuel
                              </Button>
                              {result && getStatusIcon(result.status)}
                            </div>
                          </div>
                          
                          {result && result.status === 'success' && result.data && (
                            <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                              <p className="text-sm font-medium text-emerald-800">
                                📍 {result.data.address}
                              </p>
                              <p className="text-xs text-emerald-600">
                                Lat: {result.data.lat?.toFixed(6)}, Lng: {result.data.lng?.toFixed(6)}
                              </p>
                              <p className="text-xs text-emerald-600">
                                Type: {result.data.type}, Précision: {result.data.accuracy}m
                              </p>
                            </div>
                          )}
                          
                          {result && result.status === 'error' && (
                            <Alert className="mt-3">
                              <XCircle className="h-4 w-4" />
                              <AlertDescription>
                                {result.error}
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test de Recherche de Lieux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Rechercher un lieu (ex: Gombe, Kinshasa)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && runSearchTest()}
                />
                <Button onClick={runSearchTest}>
                  Rechercher
                </Button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Résultats ({searchResults.length})</h4>
                  {searchResults.map((result, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{result.title || result.name}</p>
                          <p className="text-sm text-muted-foreground">{result.address}</p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          {result.badge && <Badge variant="outline" className="text-xs">{result.badge}</Badge>}
                          {result.distance_meters && (
                            <p className="text-xs text-muted-foreground">
                              {(result.distance_meters / 1000).toFixed(1)}km
                            </p>
                          )}
                          {result.relevance_score && (
                            <p className="text-xs text-muted-foreground">
                              Score: {result.relevance_score}%
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                Métriques de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Temps de Réponse Moyens</h4>
                  {testResults.filter(r => r.duration).map((result, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{result.name}</span>
                      <Badge variant="outline">
                        {result.duration}ms
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Taux de Succès</h4>
                  <div className="space-y-2">
                    {['success', 'error'].map(status => {
                      const count = testResults.filter(r => r.status === status).length;
                      const percentage = testResults.length > 0 ? (count / testResults.length) * 100 : 0;
                      
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm capitalize">
                            {status === 'success' ? 'Succès' : 'Échecs'}
                          </span>
                          <Badge variant={status === 'success' ? 'default' : 'destructive'}>
                            {percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeolocationSystemTest;