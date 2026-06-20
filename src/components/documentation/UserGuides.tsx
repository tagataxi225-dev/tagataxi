import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Book, 
  User, 
  Car, 
  Users, 
  Shield, 
  Download, 
  ExternalLink,
  Phone,
  MessageCircle,
  CreditCard,
  MapPin,
  Star,
  Settings,
  HelpCircle,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  content: string;
  steps?: string[];
  tips?: string[];
  warnings?: string[];
}

interface UserGuide {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  estimatedTime: string;
  sections: GuideSection[];
}

export const UserGuides: React.FC = () => {
  const [selectedGuide, setSelectedGuide] = useState<string>('client');

  const guides: Record<string, UserGuide> = {
    client: {
      id: 'client',
      title: 'Guide Client - TAGA Taxi',
      description: 'Apprenez à utiliser TAGA Taxi pour vos déplacements à Kinshasa',
      icon: User,
      difficulty: 'Débutant',
      estimatedTime: '10 minutes',
      sections: [
        {
          id: 'getting-started',
          title: 'Premiers pas',
          content: 'Découvrez comment créer votre compte et configurer votre profil sur TAGA Taxi.',
          steps: [
            'Téléchargez l\'application TAGA Taxi depuis le Play Store ou App Store',
            'Créez votre compte avec votre numéro de téléphone',
            'Vérifiez votre numéro par SMS',
            'Complétez votre profil avec vos informations personnelles',
            'Ajoutez une photo de profil (optionnel)',
            'Configurez vos adresses favorites (domicile, travail)'
          ],
          tips: [
            'Utilisez une photo de profil claire pour que les chauffeurs vous reconnaissent',
            'Ajoutez plusieurs numéros de téléphone pour plus de sécurité'
          ]
        },
        {
          id: 'booking-ride',
          title: 'Réserver une course',
          content: 'Guide étape par étape pour réserver votre première course.',
          steps: [
            'Ouvrez l\'application et autorisez la géolocalisation',
            'Définissez votre point de départ (ou utilisez votre position actuelle)',
            'Saisissez votre destination',
            'Choisissez le type de véhicule (moto-taxi, voiture, bus)',
            'Vérifiez le prix estimé et confirmez votre réservation',
            'Attendez qu\'un chauffeur accepte votre demande',
            'Suivez l\'arrivée du chauffeur en temps réel'
          ],
          tips: [
            'Réservez 5-10 minutes avant votre heure de départ souhaitée',
            'Soyez précis dans votre adresse de départ pour faciliter la prise en charge',
            'Gardez votre téléphone chargé pendant le trajet'
          ],
          warnings: [
            'Vérifiez toujours l\'identité du chauffeur et la plaque d\'immatriculation',
            'Ne montez jamais dans un véhicule non identifié'
          ]
        },
        {
          id: 'payment',
          title: 'Paiement et Portefeuille',
          content: 'Gérez vos paiements avec TAGAPay.',
          steps: [
            'Accédez à votre portefeuille TAGAPay dans l\'application',
            'Rechargez via Airtel Money, Orange Money ou M-Pesa',
            'Confirmez le paiement via votre opérateur mobile',
            'Vérifiez que le solde a été ajouté à votre compte',
            'Les paiements de courses seront déduits automatiquement'
          ],
          tips: [
            'Maintenez toujours un solde suffisant pour éviter les interruptions',
            'Activez les notifications pour être alerté des paiements',
            'Consultez régulièrement votre historique de transactions'
          ]
        },
        {
          id: 'rating-feedback',
          title: 'Évaluation et Commentaires',
          content: 'Aidez à améliorer le service en évaluant vos courses.',
          steps: [
            'À la fin de chaque course, une interface d\'évaluation apparaît',
            'Donnez une note de 1 à 5 étoiles au chauffeur',
            'Ajoutez un commentaire constructif (optionnel)',
            'Signalez tout problème rencontré',
            'Confirmez votre évaluation'
          ],
          tips: [
            'Soyez juste et honnête dans vos évaluations',
            'Mentionnez les points positifs et les améliorations possibles',
            'Les bonnes évaluations motivent les chauffeurs'
          ]
        }
      ]
    },
    driver: {
      id: 'driver',
      title: 'Guide Chauffeur - TAGA Driver',
      description: 'Maximisez vos gains en tant que chauffeur partenaire TAGA',
      icon: Car,
      difficulty: 'Intermédiaire',
      estimatedTime: '20 minutes',
      sections: [
        {
          id: 'registration',
          title: 'Inscription et Validation',
          content: 'Processus complet pour devenir chauffeur TAGA.',
          steps: [
            'Téléchargez l\'application TAGA Driver',
            'Créez votre compte chauffeur',
            'Téléchargez vos documents (permis, carte grise, assurance)',
            'Prenez des photos de votre véhicule',
            'Attendez la validation par un partenaire (24-48h)',
            'Validation finale par l\'équipe admin',
            'Recevez votre code chauffeur unique'
          ],
          warnings: [
            'Assurez-vous que tous vos documents sont valides et lisibles',
            'Le véhicule doit être en bon état et propre',
            'L\'assurance doit couvrir le transport commercial'
          ]
        },
        {
          id: 'earning-system',
          title: 'Système de Gains et Crédits',
          content: 'Comprenez comment fonctionnent vos revenus sur TAGA.',
          steps: [
            'Rechargez votre compte crédits pour rester visible',
            'Chaque course consomme des crédits selon la zone',
            'Recevez 80% du prix de la course directement',
            'Les commissions partenaire et admin sont déduites automatiquement',
            'Consultez vos gains quotidiens et hebdomadaires',
            'Retirez vos gains via Mobile Money'
          ],
          tips: [
            'Maintenez toujours un solde de crédits suffisant',
            'Participez aux défis pour gagner des bonus',
            'Les heures de pointe génèrent plus de demandes'
          ]
        },
        {
          id: 'managing-rides',
          title: 'Gestion des Courses',
          content: 'Optimisez votre service pour satisfaction client et gains maximum.',
          steps: [
            'Activez votre statut "En ligne" pour recevoir des demandes',
            'Évaluez chaque demande (distance, destination, prix)',
            'Acceptez la course et contactez le client si nécessaire',
            'Utilisez la navigation intégrée pour vous rendre au point de départ',
            'Confirmez votre arrivée via l\'application',
            'Démarrez la course une fois le client à bord',
            'Terminez la course à destination',
            'Demandez une évaluation au client'
          ],
          tips: [
            'Répondez rapidement aux demandes de course',
            'Soyez ponctuel et professionnel',
            'Gardez votre véhicule propre et en bon état',
            'Connaissez bien les routes de Kinshasa'
          ]
        },
        {
          id: 'referral-program',
          title: 'Programme de Parrainage',
          content: 'Gagnez des bonus en parrainant de nouveaux chauffeurs.',
          steps: [
            'Accédez à votre code de parrainage unique',
            'Partagez votre code avec des chauffeurs potentiels',
            'Ils doivent saisir votre code lors de l\'inscription',
            'Une fois validés, vous recevez un bonus de parrainage',
            'Continuez à parrainer pour des gains supplémentaires'
          ],
          tips: [
            'Partagez votre code avec des chauffeurs qualifiés',
            'Aidez vos filleuls dans le processus de validation',
            'Plus vous parrainez, plus vos bonus augmentent'
          ]
        }
      ]
    },
    partner: {
      id: 'partner',
      title: 'Guide Partenaire - Gestion de Flotte',
      description: 'Gérez efficacement votre flotte de chauffeurs et maximisez vos commissions',
      icon: Users,
      difficulty: 'Avancé',
      estimatedTime: '30 minutes',
      sections: [
        {
          id: 'partner-setup',
          title: 'Configuration Partenaire',
          content: 'Devenez partenaire TAGA et configurez votre espace de gestion.',
          steps: [
            'Contactez l\'équipe TAGA pour une demande de partenariat',
            'Fournissez vos documents d\'entreprise',
            'Signez l\'accord de partenariat',
            'Recevez vos accès à l\'interface partenaire',
            'Configurez vos zones d\'activité',
            'Définissez vos taux de commission'
          ]
        },
        {
          id: 'driver-management',
          title: 'Gestion des Chauffeurs',
          content: 'Recrutez, validez et gérez vos chauffeurs affiliés.',
          steps: [
            'Recevez les demandes de validation de chauffeurs',
            'Vérifiez les documents et l\'état des véhicules',
            'Effectuez la validation première étape',
            'Suivez le processus de validation admin',
            'Gérez les performances de vos chauffeurs',
            'Fournissez support et formation si nécessaire'
          ]
        },
        {
          id: 'financial-management',
          title: 'Gestion Financière',
          content: 'Optimisez vos revenus et gérez les finances de votre flotte.',
          steps: [
            'Consultez vos commissions en temps réel',
            'Analysez les performances par chauffeur',
            'Gérez les retraits de vos chauffeurs',
            'Suivez les métriques de votre zone',
            'Exportez vos rapports financiers',
            'Optimisez vos stratégies de croissance'
          ]
        }
      ]
    },
    admin: {
      id: 'admin',
      title: 'Guide Administrateur - Plateforme TAGA',
      description: 'Administration complète de la plateforme TAGA Taxi',
      icon: Shield,
      difficulty: 'Avancé',
      estimatedTime: '45 minutes',
      sections: [
        {
          id: 'platform-overview',
          title: 'Vue d\'ensemble de la Plateforme',
          content: 'Comprenez l\'architecture et les fonctionnalités administratives.',
          steps: [
            'Accédez au dashboard administrateur',
            'Explorez les différents modules (Transport, Finance, Marketplace)',
            'Consultez les métriques temps réel',
            'Gérez les zones de service',
            'Surveillez l\'activité de la plateforme'
          ]
        },
        {
          id: 'financial-control',
          title: 'Contrôle Financier',
          content: 'Gérez les flux financiers et les commissions de la plateforme.',
          steps: [
            'Configurez les taux de commission',
            'Surveillez les transactions en temps réel',
            'Gérez les remboursements et disputes',
            'Analysez les revenus par zone et période',
            'Exportez les rapports financiers',
            'Gérez les comptes marchands'
          ]
        },
        {
          id: 'user-management',
          title: 'Gestion des Utilisateurs',
          content: 'Administrez tous les types d\'utilisateurs de la plateforme.',
          steps: [
            'Gérez les comptes clients, chauffeurs et partenaires',
            'Attribuez et modifiez les rôles d\'utilisateur',
            'Gérez les suspensions et bannissements',
            'Surveillez l\'activité suspecte',
            'Fournissez support client avancé'
          ]
        }
      ]
    }
  };

  const currentGuide = guides[selectedGuide];

  const downloadPDF = (guideId: string) => {
    // Simulate PDF download
    console.log(`Downloading PDF for guide: ${guideId}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Débutant':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Intermédiaire':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Avancé':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Guides d'Utilisation TAGA
          </CardTitle>
          <p className="text-muted-foreground">
            Documentation complète pour tous les utilisateurs de la plateforme TAGA
          </p>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar - Guide Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Choisir un guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              {Object.values(guides).map((guide) => (
                <Button
                  key={guide.id}
                  variant={selectedGuide === guide.id ? "default" : "ghost"}
                  className="w-full justify-start gap-2 h-auto p-3"
                  onClick={() => setSelectedGuide(guide.id)}
                >
                  <guide.icon className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium text-sm">{guide.title.split(' - ')[1] || guide.title}</div>
                    <div className="text-xs text-muted-foreground">{guide.estimatedTime}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <currentGuide.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{currentGuide.title}</CardTitle>
                    <p className="text-muted-foreground mt-1">{currentGuide.description}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadPDF(currentGuide.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <Badge className={getDifficultyColor(currentGuide.difficulty)}>
                  {currentGuide.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {currentGuide.estimatedTime}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Book className="h-4 w-4" />
                  {currentGuide.sections.length} sections
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {currentGuide.sections.map((section, index) => (
                  <AccordionItem key={section.id} value={section.id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                          {index + 1}
                        </div>
                        {section.title}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="space-y-4 pl-9">
                        <p className="text-muted-foreground">{section.content}</p>
                        
                        {section.steps && (
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Étapes à suivre
                            </h4>
                            <div className="space-y-2">
                              {section.steps.map((step, stepIndex) => (
                                <div key={stepIndex} className="flex items-start gap-3">
                                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
                                    {stepIndex + 1}
                                  </div>
                                  <p className="text-sm">{step}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {section.tips && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-800">
                              <HelpCircle className="h-4 w-4" />
                              Conseils utiles
                            </h4>
                            <ul className="space-y-1 text-sm text-blue-700">
                              {section.tips.map((tip, tipIndex) => (
                                <li key={tipIndex} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {section.warnings && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-800">
                              <AlertTriangle className="h-4 w-4" />
                              Attention
                            </h4>
                            <ul className="space-y-1 text-sm text-red-700">
                              {section.warnings.map((warning, warningIndex) => (
                                <li key={warningIndex} className="flex items-start gap-2">
                                  <span className="text-red-500 mt-1">⚠</span>
                                  {warning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              {/* Footer with support contacts */}
              <div className="mt-8 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-3">Besoin d'aide supplémentaire ?</h4>
                <div className="flex gap-4">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    +243 858 040 400
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat Support
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    FAQ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserGuides;