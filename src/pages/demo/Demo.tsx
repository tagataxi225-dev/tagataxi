import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Car, Package, Store, Play, Pause, RotateCcw, 
  MapPin, Clock, Star, ArrowRight, Smartphone,
  Monitor, Tablet, CheckCircle, Eye, Volume2, VolumeX
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/layout/PageTransition";
import ModernFooter from "@/components/landing/ModernFooter";

const Demo = () => {
  const [activeDemo, setActiveDemo] = useState("transport");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [device, setDevice] = useState("mobile");
  const [hasSound, setHasSound] = useState(false);

  const demoScenarios = {
    transport: {
      title: "Réserver un Transport VTC",
      icon: <Car className="w-6 h-6" />,
      color: "from-primary to-primary-glow",
      steps: [
        {
          title: "Ouvrir l'application",
          description: "L'utilisateur lance TAGA Taxi sur son smartphone",
          image: "/placeholder.svg",
          duration: 2
        },
        {
          title: "Saisir la destination",
          description: "Indiquer l'adresse de départ et d'arrivée à Kinshasa",
          image: "/placeholder.svg", 
          duration: 3
        },
        {
          title: "Choisir le véhicule",
          description: "Sélectionner le type de transport (Taxi, VTC, Moto)",
          image: "/placeholder.svg",
          duration: 2
        },
        {
          title: "Confirmer la course",
          description: "Voir le prix estimé et confirmer la réservation",
          image: "/placeholder.svg",
          duration: 2
        },
        {
          title: "Matching avec chauffeur",
          description: "Le système trouve automatiquement un chauffeur disponible",
          image: "/placeholder.svg",
          duration: 3
        },
        {
          title: "Suivi en temps réel",
          description: "Voir l'arrivée du chauffeur et suivre le trajet",
          image: "/placeholder.svg",
          duration: 4
        },
        {
          title: "Paiement sécurisé",
          description: "Payer avec TAGAPay ou Mobile Money",
          image: "/placeholder.svg",
          duration: 2
        }
      ]
    },
    livraison: {
      title: "Commander une Livraison Express",
      icon: <Package className="w-6 h-6" />,
      color: "from-secondary to-accent",
      steps: [
        {
          title: "Accéder à la livraison",
          description: "Sélectionner le service de livraison express",
          image: "/placeholder.svg",
          duration: 2
        },
        {
          title: "Détails du colis",
          description: "Renseigner le type, taille et poids du colis",
          image: "/placeholder.svg",
          duration: 3
        },
        {
          title: "Adresses de collecte",
          description: "Indiquer l'adresse de récupération et de livraison",
          image: "/placeholder.svg",
          duration: 3
        },
        {
          title: "Choisir la vitesse",
          description: "Flash (5000 CDF), Flex (3000 CDF) ou Maxicharge",
          image: "/placeholder.svg",
          duration: 2
        },
        {
          title: "Confirmation",
          description: "Valider la commande et voir le prix final",
          image: "/placeholder.svg",
          duration: 2
        },
        {
          title: "Assignation livreur",
          description: "Un livreur moto est automatiquement assigné",
          image: "/placeholder.svg",
          duration: 3
        },
        {
          title: "Tracking temps réel",
          description: "Suivre le livreur jusqu'à la destination finale",
          image: "/placeholder.svg",
          duration: 5
        }
      ]
    },
    marketplace: {
      title: "Acheter sur la Marketplace",
      icon: <Store className="w-6 h-6" />,
      color: "from-accent to-primary",
      steps: [
        {
          title: "Explorer les produits",
          description: "Parcourir les catégories et produits populaires",
          image: "/placeholder.svg",
          duration: 3
        },
        {
          title: "Rechercher un article",
          description: "Utiliser la barre de recherche intelligente",
          image: "/placeholder.svg",
          duration: 2
        },
        {
          title: "Consulter les détails",
          description: "Voir les photos, prix, avis et vendeur",
          image: "/placeholder.svg",
          duration: 3
        },
        {
          title: "Ajouter au panier",
          description: "Sélectionner la quantité et ajouter au panier",
          image: "/placeholder.svg",
          duration: 2
        },
        {
          title: "Choisir la livraison",
          description: "Sélectionner le mode de livraison intégré TAGA",
          image: "/placeholder.svg",
          duration: 2
        },
        {
          title: "Paiement sécurisé",
          description: "Payer avec TAGAPay, Mobile Money ou carte",
          image: "/placeholder.svg",
          duration: 3
        },
        {
          title: "Suivi de commande",
          description: "Recevoir les notifications et suivre la livraison",
          image: "/placeholder.svg",
          duration: 4
        }
      ]
    }
  };

  const currentScenario = demoScenarios[activeDemo as keyof typeof demoScenarios];

  const startDemo = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    playDemo();
  };

  const playDemo = async () => {
    for (let i = 0; i < currentScenario.steps.length; i++) {
      if (!isPlaying) break;
      setCurrentStep(i);
      await new Promise(resolve => 
        setTimeout(resolve, currentScenario.steps[i].duration * 1000)
      );
    }
    setIsPlaying(false);
  };

  const stopDemo = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const resetDemo = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const features = [
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Interface Intuitive",
      description: "Design simple et adapté à tous les niveaux"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Géolocalisation Précise",
      description: "Navigation optimisée pour les villes congolaises"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Service 24/7",
      description: "Disponible jour et nuit dans les 3 villes"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Qualité Garantie",
      description: "Chauffeurs vérifiés et services de qualité"
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-r from-primary via-secondary to-accent text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
          <div className="container mx-auto max-w-7xl text-center relative z-10">
            <Badge variant="outline" className="border-white/30 text-white mb-6">
              🎬 Démo Interactive TAGA
            </Badge>
            <h1 className="text-display-lg mb-6">
              Découvrez TAGA Taxi
              <br />
              <span className="bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                en Action
              </span>
            </h1>
            <p className="text-xl mb-8 text-white/90 max-w-3xl mx-auto">
              Explorez toutes les fonctionnalités de notre application à travers des démonstrations 
              interactives de nos services principaux.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <Play className="w-5 h-5 mr-2" />
                Lancer la Démo
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Eye className="w-5 h-5 mr-2" />
                Voir en Live
              </Button>
            </div>
          </div>
        </section>

        {/* Demo Player */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            {/* Demo Selector */}
            <div className="text-center mb-12">
              <h2 className="text-display-md mb-8 bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
                Choisissez une Démonstration
              </h2>
              
              <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full max-w-2xl mx-auto">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                  {Object.entries(demoScenarios).map(([key, scenario]) => (
                    <TabsTrigger 
                      key={key} 
                      value={key} 
                      className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-primary data-[state=active]:text-white"
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${scenario.color} text-white`}>
                        {scenario.icon}
                      </div>
                      <span className="text-sm font-medium">{scenario.title}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Demo Player */}
              <div className="space-y-6">
                {/* Device Selector */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Vue :</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={device === "mobile" ? "default" : "outline"}
                        onClick={() => setDevice("mobile")}
                      >
                        <Smartphone className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={device === "tablet" ? "default" : "outline"}
                        onClick={() => setDevice("tablet")}
                      >
                        <Tablet className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={device === "desktop" ? "default" : "outline"}
                        onClick={() => setDevice("desktop")}
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setHasSound(!hasSound)}
                  >
                    {hasSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Demo Screen */}
                <Card className="relative overflow-hidden">
                  <div className={`aspect-[9/16] bg-gradient-to-br ${currentScenario.color} flex items-center justify-center text-white ${
                    device === "mobile" ? "max-w-sm mx-auto" : 
                    device === "tablet" ? "max-w-md mx-auto aspect-[4/3]" : 
                    "aspect-[16/9]"
                  }`}>
                    <div className="text-center p-8">
                      <div className={`p-4 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 inline-flex`}>
                        {currentScenario.icon}
                      </div>
                      <h3 className="text-lg font-bold mb-2">{currentScenario.title}</h3>
                      {currentScenario.steps[currentStep] && (
                        <div className="space-y-2">
                          <p className="text-sm opacity-90">{currentScenario.steps[currentStep].title}</p>
                          <p className="text-xs opacity-75">{currentScenario.steps[currentStep].description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                    <div 
                      className="h-full bg-white transition-all duration-1000"
                      style={{ 
                        width: `${((currentStep + 1) / currentScenario.steps.length) * 100}%` 
                      }}
                    />
                  </div>
                </Card>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={isPlaying ? stopDemo : startDemo}
                    className={`bg-gradient-to-r ${currentScenario.color} hover:shadow-glow`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Arrêter
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Démarrer
                      </>
                    )}
                  </Button>
                  
                  <Button size="lg" variant="outline" onClick={resetDemo}>
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Recommencer
                  </Button>
                </div>
              </div>

              {/* Steps Timeline */}
              <div className="space-y-6">
                <h3 className="text-heading-lg mb-6">Étapes de la Démonstration</h3>
                
                <div className="space-y-4">
                  {currentScenario.steps.map((step, index) => (
                    <Card 
                      key={index}
                      className={`transition-all duration-300 ${
                        index === currentStep ? 'border-primary shadow-lg scale-105' :
                        index < currentStep ? 'border-green-200 bg-green-50' : 
                        'border-border'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === currentStep ? 'bg-primary text-white' :
                            index < currentStep ? 'bg-green-500 text-white' : 
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index < currentStep ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-heading-sm mb-1 ${
                              index === currentStep ? 'text-primary' : ''
                            }`}>
                              {step.title}
                            </h4>
                            <p className="text-body-sm text-muted-foreground">
                              {step.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {step.duration}s
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-display-md mb-4">Pourquoi TAGA Taxi ?</h2>
              <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
                Une application pensée pour répondre aux besoins spécifiques du Congo RDC
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-heading-sm mb-3 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-body-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary via-secondary to-accent text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-display-md mb-6">Prêt à Essayer TAGA Taxi ?</h2>
            <p className="text-xl mb-8 text-white/90">
              Téléchargez l'application dès maintenant et découvrez la révolution du transport au Congo !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  <Smartphone className="w-5 h-5 mr-2" />
                  Commencer Maintenant
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Eye className="w-5 h-5 mr-2" />
                  En Savoir Plus
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <ModernFooter />
      </div>
    </PageTransition>
  );
};

export default Demo;