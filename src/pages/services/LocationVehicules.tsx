import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Users, Calendar, Shield, Clock, Star, ArrowRight } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";
import { PageTransition } from "@/components/layout/PageTransition";
import { Link } from 'react-router-dom';

const LocationVehicules = () => {
  const vehicleCategories = [
    {
      name: "Économique",
      description: "Véhicules citadins, parfaits pour la ville",
      vehicles: ["Toyota Corolla", "Nissan Sentra", "Hyundai Accent"],
      price: "25,000 FC/jour",
      features: ["Climatisation", "Économique", "Facile à conduire"]
    },
    {
      name: "Familial",
      description: "Véhicules spacieux pour vos déplacements en famille",
      vehicles: ["Toyota RAV4", "Nissan X-Trail", "Hyundai Tucson"],
      price: "45,000 FC/jour",
      features: ["7 places", "Coffre spacieux", "Confort premium"]
    },
    {
      name: "Luxe",
      description: "Véhicules haut de gamme pour vos événements",
      vehicles: ["Toyota Land Cruiser", "Mercedes ML", "BMW X5"],
      price: "80,000 FC/jour",
      features: ["Luxe", "Chauffeur disponible", "Prestige"]
    }
  ];

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Assurance complète",
      description: "Tous nos véhicules sont assurés tous risques"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Réservation flexible",
      description: "Louez à l'heure, à la journée ou au mois"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Avec ou sans chauffeur",
      description: "Choisissez selon vos préférences"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Disponible 24h/24",
      description: "Service de location en continu"
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <ModernHeader />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-accent/5 via-primary/5 to-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-6 bg-card border border-accent/20 shadow-lg px-4 py-2 rounded-full font-semibold text-accent">
              <Car className="w-4 h-4 mr-2" />
              Service Location de Véhicules Premium
            </Badge>
            <h1 className="text-display-lg leading-tight">
              Louez le véhicule parfait à <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent font-bold">Kinshasa</span>
            </h1>
            <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Large choix de véhicules modernes et entretenus pour tous vos besoins. Location flexible à l'heure, à la journée ou au mois avec chauffeurs professionnels.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
              <Button asChild variant="hero" size="lg" className="min-h-[52px] px-8 rounded-xl font-bold shadow-xl">
                <Link to="/auth">
                  <Calendar className="w-5 h-5 mr-2" />
                  Réserver maintenant
                </Link>
              </Button>
              <Button variant="glass" asChild size="lg" className="min-h-[52px] px-8 rounded-xl font-semibold">
                <Link to="/auth">
                  <Users className="w-5 h-5 mr-2" />
                  Devenir partenaire
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Notre flotte de véhicules</h2>
            <p className="text-body-md text-muted-foreground">
              Des véhicules récents et bien entretenus pour tous vos besoins
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {vehicleCategories.map((category, index) => (
              <Card key={index} className="bg-card border border-border shadow-lg group cursor-pointer hover:scale-[1.02] transition-all duration-500">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Car className="w-8 h-8 text-accent" />
                    </div>
                    <Badge variant="outline" className="bg-gradient-to-r from-accent/10 to-primary/10 text-accent border-accent/30 rounded-xl px-3 py-1 font-semibold shadow-sm">
                      {category.price}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                    {category.name}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground/80 text-sm leading-relaxed">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      Modèles disponibles
                    </h4>
                    <div className="bg-muted/30 rounded-lg p-3 backdrop-blur-sm">
                      <ul className="text-sm text-muted-foreground space-y-2">
                        {category.vehicles.map((vehicle, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-accent/60 rounded-full"></div>
                            {vehicle}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Services inclus
                    </h4>
                    <ul className="space-y-2">
                      {category.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm">
                          <div className="w-4 h-4 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                          </div>
                          <span className="text-foreground/90">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button variant="hero" className="w-full min-h-[48px] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                    <Link to="/auth">
                      Réserver maintenant
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Pourquoi louer avec Tembea ?</h2>
            <p className="text-body-md text-muted-foreground">
              Un service de location moderne et sécurisé
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center bg-card border border-border shadow-lg group hover:scale-105 transition-all duration-500">
                <CardContent className="p-8 space-y-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent/15 to-primary/15 rounded-2xl flex items-center justify-center mx-auto text-accent group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                    {feature.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-accent transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Rental Process */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Comment louer un véhicule ?</h2>
            <p className="text-body-md text-muted-foreground">
              Un processus simple et rapide
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Choisissez", desc: "Sélectionnez votre véhicule et période" },
              { step: "2", title: "Réservez", desc: "Confirmez votre réservation en ligne" },
              { step: "3", title: "Récupérez", desc: "Venez chercher votre véhicule" },
              { step: "4", title: "Profitez", desc: "Conduisez en toute sérénité" }
            ].map((item, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-accent to-primary-glow rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                  {item.step}
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Tarifs et durées</h2>
            <p className="text-body-md text-muted-foreground">
              Des tarifs compétitifs et transparents
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-4 gap-6 text-center">
                  <div>
                    <h3 className="font-semibold mb-2">Horaire</h3>
                    <p className="text-sm text-muted-foreground">Minimum 3h</p>
                    <p className="text-lg font-bold text-accent">3,000 FC/h</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Journée</h3>
                    <p className="text-sm text-muted-foreground">24 heures</p>
                    <p className="text-lg font-bold text-accent">25,000 FC</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Semaine</h3>
                    <p className="text-sm text-muted-foreground">7 jours</p>
                    <p className="text-lg font-bold text-accent">150,000 FC</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Mensuel</h3>
                    <p className="text-sm text-muted-foreground">30 jours</p>
                    <p className="text-lg font-bold text-accent">500,000 FC</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-accent to-primary-glow text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-heading-xl">Réservez votre véhicule maintenant</h2>
          <p className="text-body-lg opacity-90 max-w-2xl mx-auto">
            Profitez de notre large choix de véhicules et de nos tarifs compétitifs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="secondary" size="lg" className="min-h-[48px] rounded-xl">
              <Link to="/auth">Voir les véhicules</Link>
            </Button>
            <Button asChild variant="soft" size="lg" className="border-white/20 text-white hover:bg-white/10 hover:text-white min-h-[48px] rounded-xl backdrop-blur-sm">
              <Link to="/support/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </section>

        <ModernFooter />
      </div>
    </PageTransition>
  );
};

export default LocationVehicules;