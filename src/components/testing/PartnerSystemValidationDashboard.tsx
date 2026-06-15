import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PartnerCommissionTest } from '@/components/admin/PartnerCommissionTest';
import { RentalVehiclesVisibilityTest } from '@/components/client/RentalVehiclesVisibilityTest';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  Users, 
  Car,
  DollarSign,
  Bell,
  Database,
  TrendingUp
} from 'lucide-react';

export const PartnerSystemValidationDashboard = () => {
  const [testResults, setTestResults] = useState({
    phase1: 'pending',
    phase2: 'pending',
    phase3: 'pending',
    phase4: 'pending'
  });

  const phases = [
    {
      id: 'phase1',
      name: 'Phase 1 : Commission 5%',
      description: 'Test de l\'Edge Function partner-subscription-commission',
      icon: <DollarSign className="h-5 w-5" />,
      status: testResults.phase1,
      criteria: [
        'Edge Function invoquée avec succès',
        'partner_subscription_earnings créé',
        'Wallet partenaire crédité (+1,250 CDF)',
        'Notification système envoyée',
        'Activity log enregistré'
      ]
    },
    {
      id: 'phase2',
      name: 'Phase 2 : Visibilité Véhicules',
      description: 'Vérification RLS et affichage côté client',
      icon: <Car className="h-5 w-5" />,
      status: testResults.phase2,
      criteria: [
        '10 véhicules visibles pour clients',
        'Tous avec status "approved"',
        'is_active = true',
        'Images et prix affichés',
        'Filtres catégories fonctionnels'
      ]
    },
    {
      id: 'phase3',
      name: 'Phase 3 : Intégration Auto',
      description: 'Commission automatique lors des abonnements',
      icon: <Zap className="h-5 w-5" />,
      status: testResults.phase3,
      criteria: [
        'Edge Function invoquée automatiquement',
        'Détection partenaire via driver_codes',
        'Commission calculée à chaque abonnement',
        'Logs d\'erreur gérés',
        'Fallback si pas de partenaire'
      ]
    },
    {
      id: 'phase4',
      name: 'Phase 4 : Test End-to-End',
      description: 'Validation flux complet partenaire',
      icon: <TrendingUp className="h-5 w-5" />,
      status: testResults.phase4,
      criteria: [
        'Nouveau chauffeur ajouté par partenaire',
        'Chauffeur s\'abonne (25,000 CDF)',
        'Commission créditée automatiquement',
        'Véhicule publié et modéré',
        'Client peut voir et réserver'
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">✅ Réussi</Badge>;
      case 'failed':
        return <Badge variant="destructive">❌ Échoué</Badge>;
      case 'running':
        return <Badge variant="secondary">⏳ En cours...</Badge>;
      default:
        return <Badge variant="outline">⏱️ En attente</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🎯 Validation Système Partenaire</h1>
        <p className="text-muted-foreground">
          Tests complets de la chaîne Partenaire → Chauffeur → Commission → Location
        </p>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {phases.map((phase) => (
          <Card key={phase.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                {phase.icon}
                {getStatusIcon(phase.status)}
              </div>
              <CardTitle className="text-sm">{phase.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs mb-3">
                {phase.description}
              </CardDescription>
              {getStatusBadge(phase.status)}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onglets de tests */}
      <Tabs defaultValue="phase1" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="phase1">Phase 1</TabsTrigger>
          <TabsTrigger value="phase2">Phase 2</TabsTrigger>
          <TabsTrigger value="phase3">Phase 3</TabsTrigger>
          <TabsTrigger value="phase4">Phase 4</TabsTrigger>
        </TabsList>

        <TabsContent value="phase1" className="mt-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Phase 1 : Test Commission Partenaire 5%
                </CardTitle>
                <CardDescription>
                  Valider l'Edge Function partner-subscription-commission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-muted rounded-lg space-y-2 text-sm">
                  <p><strong>📋 Critères de validation :</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {phases[0].criteria.map((criterion, idx) => (
                      <li key={idx}>{criterion}</li>
                    ))}
                  </ul>
                </div>
                <PartnerCommissionTest />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="phase2" className="mt-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Phase 2 : Visibilité Véhicules Côté Client
                </CardTitle>
                <CardDescription>
                  Vérifier les RLS policies et l'affichage public
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-muted rounded-lg space-y-2 text-sm">
                  <p><strong>📋 Critères de validation :</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {phases[1].criteria.map((criterion, idx) => (
                      <li key={idx}>{criterion}</li>
                    ))}
                  </ul>
                </div>
                <RentalVehiclesVisibilityTest />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="phase3" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Phase 3 : Intégration Automatique
              </CardTitle>
              <CardDescription>
                Commission automatique lors des abonnements chauffeurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-semibold text-green-900">✅ Implémentation Terminée</p>
                    <p className="text-sm text-green-800">
                      L'Edge Function <code className="px-1.5 py-0.5 bg-green-100 rounded">subscription-manager</code> 
                      a été mise à jour pour invoquer automatiquement 
                      <code className="px-1.5 py-0.5 bg-green-100 rounded ml-1">partner-subscription-commission</code>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-3">
                <p className="font-semibold">📋 Critères de validation :</p>
                <ul className="space-y-2">
                  {phases[2].criteria.map((criterion, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <p className="font-semibold text-blue-900">🔍 Vérifications Automatiques</p>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <Database className="h-4 w-4 mt-0.5" />
                    <span>Détection automatique du partenaire via <code>driver_codes.partner_id</code></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 mt-0.5" />
                    <span>Calcul commission 5% sur montant abonnement</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Bell className="h-4 w-4 mt-0.5" />
                    <span>Notification envoyée automatiquement au partenaire</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p><strong>📝 Note :</strong> Pour tester cette phase, créez un nouvel abonnement chauffeur 
                via l'interface driver. Si le chauffeur est lié à un partenaire, la commission sera 
                automatiquement créditée.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phase4" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Phase 4 : Test End-to-End Complet
              </CardTitle>
              <CardDescription>
                Validation du flux complet partenaire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <p className="font-semibold">📋 Scénario de test complet :</p>
                <ol className="space-y-3">
                  {phases[3].criteria.map((criterion, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5">{criterion}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Étape Partenaire
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Créer un nouveau chauffeur</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Publier un véhicule de location</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Recevoir commission abonnement</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Étape Client
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Voir véhicules approuvés</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Filtrer par catégorie</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Réserver un véhicule</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900">
                  <strong>⚠️ Test Manuel Requis :</strong> Cette phase nécessite de tester manuellement 
                  le flux complet en vous connectant avec différents comptes (partenaire, chauffeur, client, admin) 
                  pour valider chaque étape.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Résumé de validation */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Résumé de Validation</CardTitle>
          <CardDescription>
            État global du système partenaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-900 mb-2">✅ Fonctionnel</p>
              <ul className="space-y-1 text-xs text-green-800">
                <li>• Edge Function commission 5%</li>
                <li>• Trigger auto-assign partenaire</li>
                <li>• RLS policies véhicules</li>
                <li>• Hooks React optimisés</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">🔄 Automatique</p>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• Commission à chaque abonnement</li>
                <li>• Notifications partenaires</li>
                <li>• Logs d'activité</li>
                <li>• Mise à jour wallet</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm font-semibold text-purple-900 mb-2">🎯 À Tester</p>
              <ul className="space-y-1 text-xs text-purple-800">
                <li>• Phase 1 : Commission manuelle</li>
                <li>• Phase 2 : Visibilité client</li>
                <li>• Phase 4 : Flux end-to-end</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
