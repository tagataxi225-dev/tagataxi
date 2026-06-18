import { Car, Package, UtensilsCrossed, ArrowRight, Gavel, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const InteractiveServicesGridLite = () => {
  const navigate = useNavigate();
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isXOF = tz === 'Africa/Abidjan' || tz === 'Africa/Dakar' || tz === 'Africa/Accra';

  const handleServiceClick = (serviceId: string) => {
    const routes: Record<string, string> = {
      transport: '/app/auth?service=transport',
      delivery: '/app/auth?service=delivery',
      food: '/restaurant/auth',
    };
    navigate(routes[serviceId] || '/app/auth');
  };

  const services = [
    {
      id: "transport",
      icon: <Car className="w-8 h-8" />,
      title: "Transport VTC",
      description: "Moto-taxi, Éco, Confort, Premium + Enchères",
      price: isXOF ? 'Dès 700 XOF' : 'Dès 1 500 CDF',
      popular: true,
      gradient: "from-primary to-primary-glow",
      features: [
        { icon: <Gavel className="w-4 h-4" />, text: "Chauffeur propose son tarif" },
        { icon: <Car className="w-4 h-4" />, text: "4 classes de véhicules" },
      ],
    },
    {
      id: "delivery",
      icon: <Package className="w-8 h-8" />,
      title: "Livraison Express",
      description: "Flash 30min, Flex et MaxiCharge",
      price: isXOF ? 'Dès 2 000 XOF' : 'Dès 5 000 CDF',
      gradient: "from-secondary to-accent",
      features: [
        { icon: <Package className="w-4 h-4" />, text: "Flash 30min garanti" },
        { icon: <Truck className="w-4 h-4" />, text: "Gros colis jusqu'à 500kg" },
      ],
    },
    {
      id: "food",
      icon: <UtensilsCrossed className="w-8 h-8" />,
      title: "TAGA Food",
      description: "Restaurants locaux, livraison rapide",
      price: "Commission 5%",
      new: true,
      gradient: "from-orange-500 to-amber-500",
      cta: "Commander",
      features: [
        { icon: <UtensilsCrossed className="w-4 h-4" />, text: "50+ restaurants" },
        { icon: <Car className="w-4 h-4" />, text: "Livraison 30-45min" },
      ],
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container-section">
        <div className="text-center mb-12 space-y-3 animate-fade-up">
          <Badge variant="outline" className="border-primary/30 text-primary px-5 py-2 text-sm bg-primary/5">
            🚀 Nos Services
          </Badge>
          <h2 className="text-display-md lg:text-display-lg bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
            Tout en un seul endroit
          </h2>
          <p className="text-body-md text-muted-foreground max-w-2xl mx-auto">
            Transport, livraison et food. Disponible à Kinshasa, Lubumbashi et Kolwezi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card
              key={service.id}
              className={`group relative hover:shadow-glow transition-all duration-500 cursor-pointer hover:-translate-y-2 glass border-2 border-transparent hover:border-primary/20 ${
                hoveredService === service.id ? 'scale-105 shadow-glow border-primary/30' : ''
              } stagger-${index + 1}`}
              onMouseEnter={() => setHoveredService(service.id)}
              onMouseLeave={() => setHoveredService(null)}
            >
              {service.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-primary to-primary-glow text-white shadow-elegant px-3 py-1">
                    ⭐ Populaire
                  </Badge>
                </div>
              )}
              {service.new && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-elegant px-3 py-1">
                    ✨ NOUVEAU
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className={`p-4 bg-gradient-to-br ${service.gradient} rounded-xl text-white group-hover:scale-110 transition-all duration-500 shadow-elegant w-fit`}>
                  {service.icon}
                </div>
                <CardTitle className="text-heading-md group-hover:text-primary transition-colors mt-4">
                  {service.title}
                </CardTitle>
                <CardDescription className="text-body-sm">
                  {service.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-heading-md font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {service.price}
                </div>

                <div className="space-y-2">
                  {service.features.map((feature, fi) => (
                    <div key={fi} className="flex items-center gap-2 text-sm">
                      <div className="text-primary group-hover:scale-110 transition-transform">
                        {feature.icon}
                      </div>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  className={`w-full group-hover:scale-105 transition-all duration-500 bg-gradient-to-r ${service.gradient} hover:shadow-glow rounded-xl`}
                  onClick={() => handleServiceClick(service.id)}
                >
                  {service.cta || 'Découvrir'}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InteractiveServicesGridLite;
