import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, DollarSign, Calendar, Users, CheckCircle, Star, ArrowRight } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";
import { PageTransition } from "@/components/layout/PageTransition";
import { Link } from 'react-router-dom';

const DevenirChauffeur = () => {
  const earnings = [
    {
      type: "Temps plein",
      amount: "200,000 - 400,000 FC/mois",
      description: "40h/semaine, tous services",
      features: ["Bonus performance", "Prime fidélité", "Assurance santé"]
    },
    {
      type: "Temps partiel", 
      amount: "80,000 - 150,000 FC/mois",
      description: "15-20h/semaine, flexible",
      features: ["Horaires libres", "Week-ends disponibles", "Complément revenus"]
    },
    {
      type: "Peak hours",
      amount: "15,000 - 25,000 FC/jour",
      description: "Heures de pointe uniquement",
      features: ["Tarifs majorés", "Demande élevée", "3-4h/jour"]
    }
  ];

  const requirements = [
    { item: "Âge minimum 21 ans", checked: true },
    { item: "Permis de conduire valide (minimum 2 ans)", checked: true },
    { item: "Véhicule en bon état ou moto", checked: true },
    { item: "Smartphone Android/iOS", checked: true },
    { item: "Casier judiciaire vierge", checked: true },
    { item: "Résidence en RDC", checked: true }
  ];

  const benefits = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Revenus attractifs",
      description: "Gagnez plus avec nos tarifs compétitifs et bonus"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Horaires flexibles",
      description: "Travaillez quand vous voulez, où vous voulez"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Support 24h/24",
      description: "Équipe dédiée pour vous accompagner"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Programme fidélité",
      description: "Bonus et avantages selon votre ancienneté"
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
              Devenir Chauffeur Tembea
            </Badge>
            <h1 className="text-display-lg">
              Gagnez votre vie en conduisant à <span className="text-primary">Kinshasa</span>
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Rejoignez des centaines de chauffeurs qui génèrent des revenus flexibles avec Tembea. 
              Transport, livraison, horaires libres et support 24h/24.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gradient-to-r from-primary to-primary-glow">
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
              Des revenus adaptés à votre temps disponible
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {earnings.map((earning, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Car className="w-8 h-8 text-primary" />
                    <Badge variant="outline">{earning.type}</Badge>
                  </div>
                  <CardTitle className="text-xl text-primary">{earning.amount}</CardTitle>
                  <CardDescription>{earning.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {earning.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
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
                    Toutes les conditions sont obligatoires pour garantir la sécurité de tous
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
            <h2 className="text-heading-xl">Pourquoi choisir Tembea ?</h2>
            <p className="text-body-md text-muted-foreground">
              Les avantages de faire partie de la famille Tembea
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto text-primary">
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
            <h2 className="text-heading-xl">Comment s'inscrire ?</h2>
            <p className="text-body-md text-muted-foreground">
              Un processus simple en 4 étapes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Inscription", desc: "Créez votre compte chauffeur en ligne" },
              { step: "2", title: "Documents", desc: "Envoyez vos documents via l'app" },
              { step: "3", title: "Vérification", desc: "Validation sous 24-48h" },
              { step: "4", title: "Activation", desc: "Commencez à gagner immédiatement" }
            ].map((item, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                  {item.step}
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Questions fréquentes</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: "Combien coûte l'inscription ?",
                a: "L'inscription est entièrement gratuite. Aucun frais caché."
              },
              {
                q: "Puis-je utiliser ma propre voiture ?",
                a: "Oui, tant qu'elle est en bon état et assurée. Nous acceptons aussi les motos."
              },
              {
                q: "Comment suis-je payé ?",
                a: "Paiement hebdomadaire direct sur votre portefeuille TembeaPay ou mobile money."
              },
              {
                q: "Y a-t-il des horaires imposés ?",
                a: "Non, vous travaillez quand vous voulez. Plus vous êtes actif, plus vous gagnez."
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-glow text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-heading-xl">Prêt à devenir chauffeur Tembea ?</h2>
          <p className="text-body-lg opacity-90 max-w-2xl mx-auto">
            Rejoignez notre communauté de chauffeurs et commencez à générer des revenus dès aujourd'hui
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="secondary" size="lg">
              <Link to="/auth">S'inscrire maintenant</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary">
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

export default DevenirChauffeur;