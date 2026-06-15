import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, Calendar, Users, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";
import { PageTransition } from "@/components/layout/PageTransition";
import { Link } from 'react-router-dom';

const DevenirLivreur = () => {
  const earnings = [
    {
      type: "Moto Flash",
      amount: "150,000 - 250,000 FC/mois",
      description: "Livraisons express ultra-rapides",
      features: ["Bonus vitesse", "Pourboires clients", "Prime ponctualité"]
    },
    {
      type: "Véhicule Flex", 
      amount: "200,000 - 350,000 FC/mois",
      description: "Livraisons standard et gros colis",
      features: ["Colis volumineux", "Tarifs avantageux", "Moins d'usure moto"]
    },
    {
      type: "Maxicharge",
      amount: "300,000 - 500,000 FC/mois",
      description: "Camionnette pour gros volumes",
      features: ["Gros revenus", "Manutention payée", "Clientèle entreprise"]
    }
  ];

  const requirements = [
    { item: "Âge minimum 18 ans", checked: true },
    { item: "Permis de conduire moto/voiture", checked: true },
    { item: "Véhicule en bon état (moto/voiture/camionnette)", checked: true },
    { item: "Smartphone Android/iOS", checked: true },
    { item: "Casier judiciaire vierge", checked: true },
    { item: "Connaissance de Kinshasa", checked: true }
  ];

  const benefits = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Revenus élevés",
      description: "Gagnez plus avec les livraisons express et pourboires"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Flexibilité maximale",
      description: "Choisissez vos horaires et zones de livraison"
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "Variété de missions",
      description: "Documents, colis, nourriture, courses express"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Support technique",
      description: "Équipe dédiée et assistance en cas de problème"
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
              Devenir Livreur Tembea
            </Badge>
            <h1 className="text-display-lg">
              Livrez et gagnez dans tout <span className="text-secondary">Kinshasa</span>
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Rejoignez notre réseau de livreurs et générez des revenus flexibles. 
              Livraison express, colis standards, courses urgentes - choisissez votre spécialité.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gradient-to-r from-secondary to-accent">
                <Link to="/auth">S'inscrire maintenant</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="#earnings">Voir les revenus</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Earnings Section */}
      <section id="earnings" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Vos revenus potentiels</h2>
            <p className="text-body-md text-muted-foreground">
              Des revenus adaptés à votre véhicule et disponibilité
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {earnings.map((earning, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Package className="w-8 h-8 text-secondary" />
                    <Badge variant="outline">{earning.type}</Badge>
                  </div>
                  <CardTitle className="text-xl text-secondary">{earning.amount}</CardTitle>
                  <CardDescription>{earning.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {earning.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" asChild>
                    <Link to="/auth">Commencer <ArrowRight className="w-4 h-4 ml-2" /></Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Conditions requises</h2>
            <p className="text-body-md text-muted-foreground">
              Vérifiez que vous remplissez ces conditions simples
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>{req.item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    Pas de véhicule ? Nous pouvons vous aider à trouver une solution de financement
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Pourquoi livrer avec Tembea ?</h2>
            <p className="text-body-md text-muted-foreground">
              Les avantages de faire partie de l'équipe livraison
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto text-secondary">
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Comment devenir livreur ?</h2>
            <p className="text-body-md text-muted-foreground">
              Un processus simple en 4 étapes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Inscription", desc: "Créez votre compte livreur en 5 minutes" },
              { step: "2", title: "Documents", desc: "Téléchargez vos pièces justificatives" },
              { step: "3", title: "Formation", desc: "Formation express sur l'app (1 heure)" },
              { step: "4", title: "Livraison", desc: "Commencez à livrer et gagner" }
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

      {/* Tips for Success */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Conseils pour maximiser vos revenus</h2>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">⚡ Livraisons Flash</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Soyez réactif aux notifications</li>
                  <li>• Connaissez les raccourcis de Kinshasa</li>
                  <li>• Restez dans les zones à forte demande</li>
                  <li>• Gardez votre véhicule en bon état</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">💰 Maximiser les gains</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Travaillez aux heures de pointe</li>
                  <li>• Soignez votre service client</li>
                  <li>• Complétez vos missions bonus</li>
                  <li>• Maintenez un bon rating</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">📱 Optimiser l'app</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Mettez à jour régulièrement</li>
                  <li>• Activez la géolocalisation</li>
                  <li>• Prenez des photos de qualité</li>
                  <li>• Utilisez les notes vocales</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">🛡️ Sécurité</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Vérifiez toujours l'adresse</li>
                  <li>• Contactez le client si besoin</li>
                  <li>• Signalez les problèmes</li>
                  <li>• Respectez les consignes COVID</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-secondary to-accent text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-heading-xl">Prêt à devenir livreur Tembea ?</h2>
          <p className="text-body-lg opacity-90 max-w-2xl mx-auto">
            Rejoignez des centaines de livreurs qui gagnent leur vie avec Tembea
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="secondary" size="lg">
              <Link to="/auth">S'inscrire maintenant</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-secondary">
              <Link to="/support/contact">Poser une question</Link>
            </Button>
          </div>
        </div>
      </section>

        <ModernFooter />
      </div>
    </PageTransition>
  );
};

export default DevenirLivreur;