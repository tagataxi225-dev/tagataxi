import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Car, Package, Store, Truck, Dice1, 
  CheckCircle, ArrowRight, Zap, Clock,
  Shield, Users, MapPin, CreditCard,
  Bike, Bus, UtensilsCrossed
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const InteractiveServicesGrid = () => {
  const navigate = useNavigate();
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  const handleServiceClick = (serviceId: string) => {
    const routes: Record<string, string> = {
      transport: '/app/auth?service=transport',
      delivery: '/app/auth?service=delivery',
      rental: '/app/auth?service=rental',
      marketplace: '/marketplace',
      lottery: '/app/auth?service=lottery',
      food: '/app/auth?service=food'
    };
    navigate(routes[serviceId] || '/app/auth');
  };

  const services = [
    {
      id: "transport",
      icon: <Car className="w-10 h-10" />,
      title: "Transport VTC",
      description: "Moto-taxi, Éco, Confort, Premium - Déplacements rapides partout",
      price: "À partir de 1500 CDF",
      popular: true,
      gradient: "from-primary to-primary-glow",
      features: [
        { icon: <Bike className="w-4 h-4" />, text: "Moto-taxi 1500 CDF + 500/km" },
        { icon: <Car className="w-4 h-4" />, text: "Éco 2500 CDF + 1500/km" },
        { icon: <Car className="w-4 h-4" />, text: "Confort 3200 CDF + 1800/km" },
        { icon: <Car className="w-4 h-4" />, text: "Premium 4300 CDF + 2300/km" }
      ],
      stats: { rides: "10K+", rating: "4.9", drivers: "500+" }
    },
    {
      id: "delivery",
      icon: <Package className="w-10 h-10" />,
      title: "Livraison Express",
      description: "Livraison Flash 30min, Flex et MaxiCharge pour gros colis",
      price: "À partir de 7000 CDF",
      gradient: "from-secondary to-accent",
      features: [
        { icon: <Zap className="w-4 h-4" />, text: "Flash 7000 CDF + 500/km" },
        { icon: <Truck className="w-4 h-4" />, text: "Flex 55000 CDF + 2500/km" },
        { icon: <Truck className="w-4 h-4" />, text: "MaxiCharge 100000 CDF + 5000/km" }
      ],
      stats: { deliveries: "5K+", time: "30min", coverage: "100%" }
    },
    {
      id: "rental",
      icon: <Truck className="w-10 h-10" />,
      title: "Location Véhicules",
      description: "Voitures et utilitaires pour courte ou longue durée",
      price: "À partir de 25K CDF/jour",
      gradient: "from-accent to-secondary",
      features: [
        { icon: <Car className="w-4 h-4" />, text: "Voitures & utilitaires" },
        { icon: <Shield className="w-4 h-4" />, text: "Vérifiés & assurés" }
      ],
      stats: { vehicles: "200+", brands: "15+", locations: "24/7" }
    },
    {
      id: "marketplace",
      icon: <Store className="w-10 h-10" />,
      title: "Marketplace Tembea",
      description: "E-commerce local avec livraison intégrée et paiement sécurisé",
      price: "Commission 3%",
      gradient: "from-primary via-accent to-secondary",
      features: [
        { icon: <Store className="w-4 h-4" />, text: "Électronique, mode, maison" },
        { icon: <CreditCard className="w-4 h-4" />, text: "Paiement TembeaPay" }
      ],
      stats: { products: "1K+", sellers: "200+", categories: "10+" }
    },
    {
      id: "lottery",
      icon: <Dice1 className="w-10 h-10" />,
      title: "Tembea Tombola",
      description: "Tickets gratuits à chaque course - Gains réels hebdomadaires",
      price: "Gratuit avec chaque course",
      hot: true,
      gradient: "from-accent via-primary to-secondary",
      features: [
        { icon: <Dice1 className="w-4 h-4" />, text: "Tickets auto à chaque course" },
        { icon: <CreditCard className="w-4 h-4" />, text: "Gains réels en CDF" }
      ],
      stats: { winners: "100+", prizes: "50M CDF", draws: "Weekly" }
    },
    {
      id: "food",
      icon: <UtensilsCrossed className="w-10 h-10" />,
      title: "Tembea Food",
      description: "Commandez vos plats préférés auprès de restaurants locaux",
      price: "Livraison gratuite dès 10K CDF",
      new: true,
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      features: [
        { icon: <UtensilsCrossed className="w-4 h-4" />, text: "Restaurants locaux vérifiés" },
        { icon: <Clock className="w-4 h-4" />, text: "Livraison rapide 30-45min" }
      ],
      stats: { restaurants: "50+", dishes: "500+", delivery: "30-45min" }
    }
  ];

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container-section">
        <div className="text-center mb-20 space-y-fluid animate-fade-up">
          <Badge variant="outline" className="border-primary/30 text-primary mb-6 px-6 py-3 text-base bg-primary/5 animate-glow-pulse">
            🚀 Six Services Révolutionnaires
          </Badge>
          <h2 className="text-display-lg bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent animate-gradient">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Tembea Taxi combine transport, livraison, location, marketplace, food et divertissement 
            dans une seule application intelligente. Disponible à Kinshasa, Lubumbashi et Kolwezi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {services.map((service, index) => (
            <Card 
              key={service.id}
              className={`relative group hover:shadow-glow transition-all duration-700 cursor-pointer transform hover:-translate-y-3 touch-scale glass border-2 border-transparent hover:border-primary/20 ${
                index >= 3 ? 'sm:col-span-2 lg:col-span-1 sm:max-w-lg sm:mx-auto lg:max-w-none lg:mx-0' : ''
              } ${
                hoveredService === service.id ? 'scale-105 shadow-glow border-primary/30 bg-primary/5' : ''
              } ${`stagger-${(index % 5) + 1}`}`}
              onMouseEnter={() => setHoveredService(service.id)}
              onMouseLeave={() => setHoveredService(null)}
              onClick={() => setHoveredService(hoveredService === service.id ? null : service.id)}
            >
              {/* Enhanced Service Badge */}
              {service.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-primary to-primary-glow text-white shadow-glow px-4 py-2 animate-glow-pulse">
                    ⭐ Plus Populaire
                  </Badge>
                </div>
              )}
              
              {service.hot && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-accent to-secondary text-white shadow-glow px-4 py-2 animate-float">
                    🔥 Nouveau !
                  </Badge>
                </div>
              )}

              {service.new && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-glow px-4 py-2 animate-glow-pulse">
                    ✨ NOUVEAU
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4 lg:pb-6">
                <div className="flex items-start justify-between mb-4 lg:mb-6">
                  <div className={`p-4 lg:p-5 bg-gradient-to-br ${service.gradient} rounded-2xl text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-glow`}>
                    <div className="w-8 h-8 lg:w-12 lg:h-12">
                      {service.icon}
                    </div>
                  </div>
                  {hoveredService === service.id && (
                    <ArrowRight className="w-6 h-6 lg:w-7 lg:h-7 text-primary animate-float" />
                  )}
                </div>
                
                <CardTitle className="text-heading-md lg:text-heading-lg group-hover:text-primary transition-colors duration-300 mb-3">
                  {service.title}
                </CardTitle>
                <CardDescription className="text-body-sm lg:text-body-md leading-relaxed text-muted-foreground/80">
                  {service.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-fluid p-6 lg:p-8">
                <div className="text-heading-md lg:text-heading-lg font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent animate-gradient">
                  {service.price}
                </div>

                {/* Features List */}
                <div className="space-y-2 lg:space-y-3">
                  {service.features.slice(0, hoveredService === service.id ? 4 : 2).map((feature, featureIndex) => (
                    <div 
                      key={featureIndex} 
                      className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm group-hover:text-foreground transition-colors"
                    >
                      <div className="text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                        {feature.icon}
                      </div>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                  {service.features.length > 2 && hoveredService !== service.id && (
                    <div className="text-xs text-muted-foreground/70 lg:hidden">
                      Appuyez pour voir plus...
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-1 lg:gap-2 pt-3 lg:pt-4 border-t border-border/50">
                  {Object.entries(service.stats).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-xs lg:text-sm font-bold text-primary">{value}</div>
                      <div className="text-xs text-muted-foreground capitalize truncate">{key}</div>
                    </div>
                  ))}
                </div>

                <Button 
                  className={`w-full group-hover:scale-105 transition-all duration-500 bg-gradient-to-r ${service.gradient} hover:shadow-glow min-h-[52px] text-body-md rounded-xl touch-scale`}
                  size="lg"
                  onClick={() => handleServiceClick(service.id)}
                >
                  {service.id === 'lottery' ? 'Découvrir' : 'Réserver'}
                  <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced Quick Access CTA */}
        <div className="mt-20 lg:mt-32 text-center animate-fade-up">
          <div className="glass border-2 border-primary/20 rounded-3xl p-8 lg:p-12 relative overflow-hidden">
            {/* Background gradient animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 animate-gradient opacity-50"></div>
            
            <div className="relative z-10 space-y-fluid">
              <h3 className="text-heading-lg lg:text-display-sm bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                Prêt à découvrir l'expérience Tembea ?
              </h3>
              <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Téléchargez l'app et profitez de tous nos services en quelques clics ! 
                Rejoignez des milliers d'utilisateurs qui font déjà confiance à Tembea Taxi.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-4">
                <Button size="lg" className="bg-gradient-to-r from-primary via-primary-glow to-primary hover:shadow-glow min-h-[56px] text-body-lg rounded-xl interactive-scale px-8">
                  <Car className="w-5 h-5 mr-3" />
                  Commander maintenant
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg" className="border-2 border-primary/30 hover:bg-primary/5 hover:border-primary/50 min-h-[56px] text-body-lg rounded-xl glass interactive-scale px-8">
                  <Users className="w-5 h-5 mr-3" />
                  Devenir partenaire
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveServicesGrid;