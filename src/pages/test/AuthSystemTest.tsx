import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  User, 
  Users, 
  UserCheck, 
  Eye, 
  Check, 
  X, 
  Clock,
  Navigation
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export default function AuthSystemTest() {
  const { user, session } = useAuth();
  const { userRole, loading: roleLoading } = useRoleBasedAuth();
  const { userRoles, permissions, isAdmin, isSuperAdmin, primaryRole } = useUserRoles();
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runAuthTests = async () => {
    setTesting(true);
    setTestResults([]);
    
    const tests: TestResult[] = [];
    
    // Test 1: Vérification de l'état d'authentification
    const authTest: TestResult = {
      name: "État d'authentification",
      status: 'pending',
      message: 'Vérification...'
    };
    tests.push(authTest);
    setTestResults([...tests]);
    
    const startTime = Date.now();
    
    try {
      if (user && session) {
        authTest.status = 'success';
        authTest.message = `Utilisateur connecté: ${user.email}`;
      } else {
        authTest.status = 'error';
        authTest.message = 'Aucun utilisateur connecté';
      }
    } catch (error) {
      authTest.status = 'error';
      authTest.message = `Erreur: ${error}`;
    }
    
    authTest.duration = Date.now() - startTime;
    setTestResults([...tests]);
    
    // Test 2: Vérification des rôles
    const roleTest: TestResult = {
      name: "Système de rôles",
      status: 'pending',
      message: 'Vérification...'
    };
    tests.push(roleTest);
    setTestResults([...tests]);
    
    try {
      if (userRole) {
        roleTest.status = 'success';
        roleTest.message = `Rôle principal: ${userRole.role}`;
      } else {
        roleTest.status = 'error';
        roleTest.message = 'Aucun rôle détecté';
      }
    } catch (error) {
      roleTest.status = 'error';
      roleTest.message = `Erreur: ${error}`;
    }
    
    setTestResults([...tests]);
    
    // Test 3: Vérification des permissions
    const permTest: TestResult = {
      name: "Permissions utilisateur",
      status: 'pending',
      message: 'Vérification...'
    };
    tests.push(permTest);
    setTestResults([...tests]);
    
    try {
      if (permissions && permissions.length > 0) {
        permTest.status = 'success';
        permTest.message = `${permissions.length} permission(s) trouvée(s)`;
      } else {
        permTest.status = 'success';
        permTest.message = 'Utilisateur standard (pas de permissions spéciales)';
      }
    } catch (error) {
      permTest.status = 'error';
      permTest.message = `Erreur: ${error}`;
    }
    
    setTestResults([...tests]);
    
    // Test 4: Test de connexion Supabase
    const supabaseTest: TestResult = {
      name: "Connexion Supabase",
      status: 'pending',
      message: 'Test de connexion...'
    };
    tests.push(supabaseTest);
    setTestResults([...tests]);
    
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
      
      supabaseTest.status = 'success';
      supabaseTest.message = 'Connexion à la base de données OK';
    } catch (error: any) {
      supabaseTest.status = 'error';
      supabaseTest.message = `Erreur DB: ${error.message}`;
    }
    
    setTestResults([...tests]);
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <Check className="h-4 w-4 text-green-500" />;
      case 'error': return <X className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
  };

  const testSecureRoutes = () => {
    const routes = [
      { path: '/operatorx/admin/auth', description: 'Connexion Admin' },
      { path: '/partner/auth', description: 'Connexion Partenaire' },
      { path: '/app/auth', description: 'Connexion Publique' }
    ];
    
    return routes.map(route => (
      <div key={route.path} className="flex items-center justify-between p-2 border rounded">
        <span className="text-sm">{route.description}</span>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => window.open(route.path, '_blank')}
        >
          <Navigation className="h-4 w-4 mr-1" />
          Tester
        </Button>
      </div>
    ));
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Test du Système d'Authentification
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">État Actuel</TabsTrigger>
          <TabsTrigger value="tests">Tests Auto</TabsTrigger>
          <TabsTrigger value="routes">Routes Sécurisées</TabsTrigger>
          <TabsTrigger value="roles">Gestion Rôles</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-4 w-4" />
                  Utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="space-y-2">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>ID:</strong> {user.id.substring(0, 8)}...</p>
                    <Badge variant="outline" className="text-green-600">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Connecté
                    </Badge>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <p>Aucun utilisateur connecté</p>
                    <Badge variant="outline" className="text-red-600">
                      <X className="h-3 w-3 mr-1" />
                      Déconnecté
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-4 w-4" />
                  Rôles & Permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {roleLoading ? (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    Chargement...
                  </div>
                ) : userRole ? (
                  <div className="space-y-2">
                    <p><strong>Rôle principal:</strong> {primaryRole || userRole.role}</p>
                    {isAdmin && <Badge className="bg-red-100 text-red-800">Admin</Badge>}
                    {isSuperAdmin && <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>}
                    <p><strong>Permissions:</strong> {permissions?.length || 0}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun rôle détecté</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tests Automatisés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runAuthTests} 
                disabled={testing}
                className="w-full"
              >
                {testing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Tests en cours...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Lancer les tests
                  </>
                )}
              </Button>

              {testResults.length > 0 && (
                <div className="space-y-2">
                  {testResults.map((test, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded">
                      {getStatusIcon(test.status)}
                      <div className="flex-1">
                        <p className="font-medium">{test.name}</p>
                        <p className="text-sm text-muted-foreground">{test.message}</p>
                      </div>
                      {test.duration && (
                        <span className="text-xs text-muted-foreground">
                          {test.duration}ms
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test des Routes Sécurisées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {testSecureRoutes()}
              
              <Alert>
                <AlertDescription>
                  Les routes /operatorx/admin/auth et /partner/auth sont maintenant sécurisées et masquées 
                  de l'interface publique. Seuls les utilisateurs autorisés peuvent y accéder.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Rôles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Rôles Disponibles:</h4>
                  <div className="space-y-1">
                    <Badge variant="outline">Client Simple</Badge>
                    <Badge variant="outline">Chauffeur</Badge>
                    <Badge variant="outline" className="opacity-50">Partenaire (Masqué)</Badge>
                    <Badge variant="outline" className="opacity-50">Admin (Masqué)</Badge>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Routes Spécialisées:</h4>
                  <div className="space-y-1 text-sm">
                    <p>• /app/auth - Connexion publique</p>
                    <p>• /operatorx/admin/auth - Admin uniquement</p>
                    <p>• /partner/auth - Partenaires uniquement</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}