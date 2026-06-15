import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Users, Clock, Shield, MapPin, ArrowRight, Star } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";
import { PageTransition } from "@/components/layout/PageTransition";
import { Link } from 'react-router-dom';

const TransportVTC = () => {
  const vehicleTypes = [
    {
      name: "Taxi-bus",
      description: "Transport collectif économique",
      capacity: "8-12 personnes",
      price: "À partir de 500 FC",
      features: ["Économique", "Trajets fixes", "Rapide"]
    },
    {
      name: "Moto-taxi",
      description: "Déplacement rapide en moto",
      capacity: "1-2 personnes",
      price: "À partir de 1000 FC",
      features: ["Ultra rapide", "Évite les embouteillages", "Économique"]
    },
    {
      name: "VTC Privé",
      description: "Voiture privée avec chauffeur",
      capacity: "1-4 personnes",
      price: "À partir de 3000 FC",
      features: ["Confort premium", "Climatisé", "Sécurisé"]
    }
  ];

  const features = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Géolocalisation précise",
      description: "Localisation en temps réel de votre chauffeur"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Estimation temps réel",
      description: "Temps d'arrivée et durée du trajet précis"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Sécurité garantie",
      description: "Chauffeurs vérifiés et véhicules assurés"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Système de notation",
      description: "Évaluez votre course et votre chauffeur"
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <ModernHeader />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              Service Taxi VTC
            </Badge>
            <h1 className="text-display-lg">
              Taxi intelligent à <span className="text-primary">Kinshasa</span>
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Déplacez-vous facilement dans Kinshasa avec notre réseau de chauffeurs professionnels. 
              Taxi-bus, moto-taxi ou VTC privé, choisissez le mode de taxi qui vous convient.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gradient-to-r from-primary to-primary-glow">
                <Link to="/auth">Commander maintenant</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/auth">Devenir chauffeur</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Types */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Types de véhicules disponibles</h2>
            <p className="text-body-md text-muted-foreground">
              Choisissez le mode de transport adapté à vos besoins et votre budget
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {vehicleTypes.map((vehicle, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Car className="w-8 h-8 text-primary" />
                    <Badge variant="outline">{vehicle.capacity}</Badge>
                  </div>
                  <CardTitle>{vehicle.name}</CardTitle>
                  <CardDescription>{vehicle.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-lg font-semibold text-primary">
                    {vehicle.price}
                  </div>
                  <ul className="space-y-2">
                    {vehicle.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" asChild>
                    <Link to="/auth">Réserver <ArrowRight className="w-4 h-4 ml-2" /></Link>
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
            <h2 className="text-heading-xl">Pourquoi choisir Tembea Taxi ?</h2>
            <p className="text-body-md text-muted-foreground">
              Une expérience de taxi moderne et sécurisée
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-glow text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-heading-xl">Prêt à vous déplacer ?</h2>
          <p className="text-body-lg opacity-90 max-w-2xl mx-auto">
            Rejoignez des milliers d'utilisateurs qui font confiance à Tembea pour leurs déplacements quotidiens
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="secondary" size="lg">
              <Link to="/auth">Télécharger l'app</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary">
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

export default TransportVTC;