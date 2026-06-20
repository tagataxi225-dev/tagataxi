import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, Clock, CreditCard, Shield, Smartphone, 
  Wifi, Users, Zap, Globe, Heart, Star, TrendingUp,
  CheckCircle, ArrowRight, UtensilsCrossed
} from "lucide-react";
import { useState } from "react";

const AdvancedFeatures = () => {
  const [activeFeature, setActiveFeature] = useState<string>("geolocation");

  const mainFeatures = [
    {
      id: "geolocation",
      icon: <MapPin className="w-8 h-8" />,
      title: "Géolocalisation Précise",
      description: "Navigation optimisée pour Kinshasa, Lubumbashi et Kolwezi",
      benefits: [
        "Points de repère locaux intégrés",
        "Mode hors-ligne disponible"
      ],
      gradient: "from-primary to-primary-glow",
      stats: { accuracy: "99%", coverage: "3 Villes", landmarks: "1500+" }
    },
    {
      id: "payment",
      icon: <CreditCard className="w-8 h-8" />,
      title: "TAGAPay & Mobile Money",
      description: "Paiement intégré avec Mobile Money congolais",
      benefits: [
        "Airtel, Orange, M-Pesa",
        "Portefeuille TAGAPay"
      ],
      gradient: "from-secondary to-accent",
      stats: { methods: "5+", security: "256-bit", instant: "Immédiat" }
    },
    {
      id: "availability",
      icon: <Clock className="w-8 h-8" />,
      title: "Service 24h/24",
      description: "Chauffeurs vérifiés disponibles jour et nuit",
      benefits: [
        "Disponible 24/7",
        "Support client temps réel"
      ],
      gradient: "from-accent to-primary",
      stats: { uptime: "99.9%", response: "<3min", support: "24/7" }
    },
    {
      id: "security",
      icon: <Shield className="w-8 h-8" />,
      title: "Sécurité Maximale",
      description: "Chauffeurs vérifiés avec suivi temps réel",
      benefits: [
        "Background check systématique",
        "Assurance complète incluse"
      ],
      gradient: "from-primary via-secondary to-accent",
      stats: { verified: "100%", insurance: "Complète", incidents: "<0.1%" }
    },
    {
      id: "food",
      icon: <UtensilsCrossed className="w-8 h-8" />,
      title: "TAGA Food - Restaurants locaux",
      description: "Découvrez et commandez auprès de restaurants vérifiés. Livraison rapide en 30-45 minutes.",
      benefits: [
        "Restaurants locaux vérifiés",
        "Livraison express 30-45min"
      ],
      gradient: "from-orange-500 to-amber-500",
      stats: { restaurants: "50+", plats: "500+", livraison: "30-45min" }
    }
  ];

  const uniqueFeatures = [
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Interface Intuitive",
      description: "Simple pour tous",
      color: "text-primary"
    },
    {
      icon: <Wifi className="w-6 h-6" />,
      title: "Mode Hors-ligne",
      description: "Marche sans connexion",
      color: "text-secondary"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Rapide & Léger",
      description: "App optimisée",
      color: "text-primary"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Multilingue",
      description: "FR, Lingala, Kikongo",
      color: "text-secondary"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Made in Congo",
      description: "100% congolais",
      color: "text-accent"
    }
  ];

  const activeFeatureData = mainFeatures.find(f => f.id === activeFeature) || mainFeatures[0];

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-muted/20 via-background to-muted/10">
      <div className="container-section">
        {/* Enhanced Header */}
        <div className="text-center mb-20 space-y-fluid animate-fade-up">
          <Badge variant="outline" className="border-secondary/30 text-secondary px-6 py-3 text-base bg-secondary/5 animate-glow-pulse">
            💡 Innovation Congolaise
          </Badge>
          <h2 className="text-display-lg bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent animate-gradient">
            Pourquoi choisir TAGA Taxi ?
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Une application pensée spécifiquement pour les défis et opportunités du Congo RDC,
            avec des fonctionnalités uniques adaptées à Kinshasa, Lubumbashi et Kolwezi.
          </p>
        </div>

        {/* Enhanced Main Features Interactive Section */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mb-20 lg:mb-32">
          {/* Feature Tabs */}
          <div className="space-y-4 lg:space-y-6 animate-fade-up">
            {mainFeatures.map((feature, index) => (
              <Card
                key={feature.id}
                className={`cursor-pointer transition-all duration-500 touch-scale glass border-2 ${
                  activeFeature === feature.id
                    ? 'border-primary/50 shadow-glow scale-105 bg-primary/5'
                    : 'border-border/20 hover:border-primary/30 hover:shadow-lg'
                } ${`stagger-${index + 1}`}`}
                onClick={() => setActiveFeature(feature.id)}
              >
                <CardContent className="p-6 lg:p-8">
                  <div className="flex items-start gap-4 lg:gap-6">
                    <div className={`p-3 lg:p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-glow`}>
                      <div className="w-6 h-6 lg:w-8 lg:h-8">
                        {feature.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-heading-sm lg:text-heading-md mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                      <p className="text-body-sm lg:text-body-md text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                    {activeFeature === feature.id && (
                      <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 text-primary flex-shrink-0 animate-float" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Feature Detail */}
          <Card className="glass border-2 border-primary/30 shadow-glow animate-scale-fade">
            <CardContent className="p-8 lg:p-10">
              <div className={`inline-flex p-4 lg:p-5 rounded-2xl bg-gradient-to-br ${activeFeatureData.gradient} text-white mb-6 lg:mb-8 shadow-glow animate-float`}>
                <div className="w-8 h-8 lg:w-10 lg:h-10">
                  {activeFeatureData.icon}
                </div>
              </div>
              
              <h3 className="text-heading-lg lg:text-display-sm mb-6 lg:mb-8 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">{activeFeatureData.title}</h3>

              {/* Enhanced Benefits */}
              <div className="space-y-4 lg:space-y-5 mb-6 lg:mb-8">
                {activeFeatureData.benefits.map((benefit, index) => (
                  <div key={index} className={`flex items-start gap-3 lg:gap-4 animate-fade-up stagger-${index + 1}`}>
                    <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-primary flex-shrink-0 mt-1" />
                    <span className="text-body-sm lg:text-body-md leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Enhanced Stats */}
              <div className="grid grid-cols-3 gap-4 lg:gap-6 p-6 lg:p-8 glass rounded-2xl border border-primary/20">
                {Object.entries(activeFeatureData.stats).map(([key, value], index) => (
                  <div key={key} className={`text-center group stagger-${index + 1}`}>
                    <div className="text-heading-md lg:text-heading-lg font-bold text-primary group-hover:scale-110 transition-transform">{value}</div>
                    <div className="text-caption text-muted-foreground capitalize">{key}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Unique Features Grid */}
        <div className="mb-20 lg:mb-32 animate-fade-up">
          <h3 className="text-heading-lg lg:text-display-sm text-center mb-12 lg:mb-16 bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
            Ce qui nous rend uniques
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {uniqueFeatures.map((feature, index) => (
              <Card key={index} className={`group hover:shadow-glow transition-all duration-500 hover:-translate-y-2 touch-scale glass border-2 border-transparent hover:border-primary/20 stagger-${(index % 6) + 1}`}>
                <CardContent className="p-6 lg:p-8 text-center">
                  <div className={`inline-flex p-3 lg:p-4 rounded-2xl bg-muted/30 ${feature.color} mb-4 lg:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                    <div className="w-6 h-6 lg:w-8 lg:h-8">
                      {feature.icon}
                    </div>
                  </div>
                  <h4 className="text-heading-sm lg:text-heading-md mb-2 lg:mb-3 group-hover:text-primary transition-colors">{feature.title}</h4>
                  <p className="text-body-sm lg:text-body-md text-muted-foreground leading-relaxed line-clamp-2">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default AdvancedFeatures;