import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Clock, Shield, MapPin, Star, ArrowRight } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";
import { PageTransition } from "@/components/layout/PageTransition";
import { Link } from 'react-router-dom';

const LivraisonExpress = () => {
  const deliveryTypes = [
    {
      name: "Flash",
      description: "Livraison express en moto",
      time: "30-60 min",
      price: "7000 CDF + 500/km",
      icon: <Package className="w-8 h-8" />,
      features: ["Ultra rapide", "Suivi temps réel", "Notifications SMS"]
    },
    {
      name: "Flex",
      description: "Livraison standard",
      time: "2-4 heures",
      price: "55000 CDF + 2500/km",
      icon: <Truck className="w-8 h-8" />,
      features: ["Économique", "Livraison sûre", "Flexible"]
    },
    {
      name: "Maxicharge",
      description: "Gros colis en camion",
      time: "4-8 heures",
      price: "100000 CDF + 5000/km",
      icon: <Truck className="w-8 h-8" />,
      features: ["Gros volumes", "Équipement spécialisé", "Manutention incluse"]
    }
  ];

  const features = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Suivi en temps réel",
      description: "Suivez votre colis en direct sur la carte"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Livraison rapide",
      description: "Des délais de livraison respectés"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Colis sécurisé",
      description: "Assurance et protection de vos envois"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Service premium",
      description: "Livreurs professionnels et courtois"
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <ModernHeader />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-secondary/10 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              Service Livraison Express
            </Badge>
            <h1 className="text-display-lg">
              Livraison express dans tout <span className="text-secondary">Kinshasa</span>
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Envoyez et recevez vos colis rapidement avec notre réseau de livreurs professionnels. 
              De la livraison express à la manutention de gros volumes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gradient-to-r from-secondary to-accent">
                <Link to="/auth">Envoyer un colis</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/auth">Devenir livreur</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Types */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Nos services de livraison</h2>
            <p className="text-body-md text-muted-foreground">
              Choisissez le service adapté à l'urgence et la taille de votre envoi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {deliveryTypes.map((delivery, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="text-secondary">{delivery.icon}</div>
                    <Badge variant="outline">{delivery.time}</Badge>
                  </div>
                  <CardTitle>{delivery.name}</CardTitle>
                  <CardDescription>{delivery.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-lg font-semibold text-secondary">
                    {delivery.price}
                  </div>
                  <ul className="space-y-2">
                    {delivery.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" asChild>
                    <Link to="/auth">Commander <ArrowRight className="w-4 h-4 ml-2" /></Link>
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
            <h2 className="text-heading-xl">Pourquoi choisir Tembea Livraison ?</h2>
            <p className="text-body-md text-muted-foreground">
              Un service de livraison moderne et fiable
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto text-secondary">
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

      {/* Process Steps */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Comment ça marche ?</h2>
            <p className="text-body-md text-muted-foreground">
              Envoyer un colis n'a jamais été aussi simple
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Commandez", desc: "Renseignez les adresses et type de colis" },
              { step: "2", title: "Confirmez", desc: "Validez le prix et le délai de livraison" },
              { step: "3", title: "Suivez", desc: "Trackez votre colis en temps réel" },
              { step: "4", title: "Recevez", desc: "Votre destinataire reçoit le colis" }
            ].map((item, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                  {item.step}
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-secondary to-accent text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-heading-xl">Envoyez votre premier colis</h2>
          <p className="text-body-lg opacity-90 max-w-2xl mx-auto">
            Rejoignez des milliers d'utilisateurs qui font confiance à Tembea pour leurs livraisons
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="secondary" size="lg">
              <Link to="/auth">Commander maintenant</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-secondary">
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

export default LivraisonExpress;