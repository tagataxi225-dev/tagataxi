import { Car, Package, UtensilsCrossed, Store, ArrowRight, Gavel, Truck, Star, Clock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const activeServices = [
  {
    id: "transport",
    route: "/app/auth?service=transport",
    icon: <Car className="w-8 h-8" />,
    title: "Transport VTC",
    description: "Moto-taxi, Éco, Confort, Premium + Enchères",
    price: "Dès 300 XOF",
    popular: true,
    gradient: "from-primary to-primary-glow",
    features: [
      { icon: <Gavel className="w-4 h-4" />, text: "Le chauffeur propose son tarif" },
      { icon: <Car className="w-4 h-4" />, text: "4 classes de véhicules" },
    ],
  },
  {
    id: "delivery",
    route: "/app/auth?service=delivery",
    icon: <Package className="w-8 h-8" />,
    title: "Livraison Express",
    description: "Flash, Flex et MaxiCharge partout à Abidjan",
    price: "Dès 600 XOF",
    popular: false,
    gradient: "from-secondary to-accent",
    features: [
      { icon: <Package className="w-4 h-4" />, text: "Flash 30min garanti" },
      { icon: <Truck className="w-4 h-4" />, text: "Gros colis jusqu'à 500kg" },
    ],
  },
];

const comingSoonServices = [
  {
    id: "food",
    icon: <UtensilsCrossed className="w-7 h-7" />,
    title: "TAGA Food",
    description: "Vos restaurants d'Abidjan livrés à domicile",
  },
  {
    id: "shop",
    icon: <Store className="w-7 h-7" />,
    title: "TAGA Shop",
    description: "Marketplace locale : commandez, on vous livre",
  },
];

const InteractiveServicesGridLite = () => {
  const navigate = useNavigate();
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container-section">
        <div className="text-center mb-12 space-y-3 animate-fade-up">
          <Badge variant="outline" className="border-primary/30 text-primary px-5 py-2 text-sm bg-primary/5 inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Nos Services
          </Badge>
          <h2 className="text-display-md lg:text-display-lg bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
            Bougez et faites livrer à Abidjan
          </h2>
          <p className="text-body-md text-muted-foreground max-w-2xl mx-auto">
            Transport et livraison express, disponibles dès maintenant. D'autres services arrivent.
          </p>
        </div>

        {/* Services actifs — mis en avant */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {activeServices.map((service, index) => (
            <Card
              key={service.id}
              className={`group relative cursor-pointer transition-all duration-500 glass border-2 border-transparent hover:shadow-glow hover:-translate-y-2 hover:border-primary/20 ${
                hoveredService === service.id ? 'scale-[1.02] shadow-glow border-primary/30' : ''
              } stagger-${index + 1}`}
              onMouseEnter={() => setHoveredService(service.id)}
              onMouseLeave={() => setHoveredService(null)}
              onClick={() => navigate(service.route)}
            >
              {service.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-primary to-primary-glow text-white shadow-elegant px-3 py-1 inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Populaire
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
                  onClick={(e) => { e.stopPropagation(); navigate(service.route); }}
                >
                  Découvrir
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Services à venir — atténués, sans prix ni CTA */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-body-sm font-medium text-muted-foreground">Bientôt sur TAGA</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="Services bientôt disponibles">
            {comingSoonServices.map((service) => (
              <div
                key={service.id}
                className="relative flex items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/40 p-5 opacity-80 select-none"
              >
                <div className="p-3 rounded-xl bg-muted text-muted-foreground grayscale shrink-0">
                  {service.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-heading-sm text-foreground/80 truncate">{service.title}</h3>
                    <Badge className="bg-muted text-muted-foreground border border-border px-2 py-0.5 text-xs inline-flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      Bientôt
                    </Badge>
                  </div>
                  <p className="text-body-sm text-muted-foreground mt-0.5">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveServicesGridLite;
