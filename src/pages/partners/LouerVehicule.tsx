import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, DollarSign, Shield, Users, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";
import { PageTransition } from "@/components/layout/PageTransition";
import { Link } from 'react-router-dom';

const LouerVehicule = () => {
  const vehicleTypes = [
    {
      type: "Berline citadine",
      dailyRevenue: "25,000 - 35,000 FC/jour",
      monthlyRevenue: "500,000 - 700,000 FC/mois",
      examples: ["Toyota Corolla", "Nissan Sentra", "Hyundai Accent"],
      features: ["Très demandé", "Consommation réduite", "Entretien simple"]
    },
    {
      type: "SUV familial",
      dailyRevenue: "40,000 - 60,000 FC/jour", 
      monthlyRevenue: "800,000 - 1,200,000 FC/mois",
      examples: ["Toyota RAV4", "Nissan X-Trail", "Hyundai Tucson"],
      features: ["Premium pricing", "Clientèle aisée", "Longues distances"]
    },
    {
      type: "Véhicule de luxe",
      dailyRevenue: "60,000 - 100,000 FC/jour",
      monthlyRevenue: "1,200,000 - 2,000,000 FC/mois", 
      examples: ["Toyota Land Cruiser", "Mercedes ML", "BMW X5"],
      features: ["Tarifs premium", "Événements spéciaux", "VIP transport"]
    }
  ];

  const benefits = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Revenus passifs",
      description: "Votre véhicule génère des revenus même quand vous ne conduisez pas"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Assurance incluse",
      description: "Couverture complète pendant les courses Tembea"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Chauffeurs vérifiés",
      description: "Seuls des chauffeurs expérimentés et vérifiés utilisent votre véhicule"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "ROI attractif",
      description: "Retour sur investissement de 15-25% par an"
    }
  ];

  const requirements = [
    { item: "Véhicule récent (moins de 10 ans)", checked: true },
    { item: "Bon état mécanique certifié", checked: true },
    { item: "Assurance tous risques valide", checked: true },
    { item: "Carte grise à jour", checked: true },
    { item: "Contrôle technique valide", checked: true },
    { item: "Propriétaire résidant en RDC", checked: true }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <ModernHeader />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-accent/10 to-primary-glow/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              Programme de Location de Véhicules
            </Badge>
            <h1 className="text-display-lg">
              Louez votre véhicule et <span className="text-accent">générez des revenus</span>
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Mettez votre véhicule au service de Tembea et générez des revenus passifs. 
              Assurance incluse, chauffeurs vérifiés, paiements garantis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gradient-to-r from-accent to-primary-glow">
                <Link to="/auth">Proposer mon véhicule</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="#calculator">Calculer mes revenus</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Potential */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Potentiel de revenus par type de véhicule</h2>
            <p className="text-body-md text-muted-foreground">
              Revenus basés sur une utilisation moyenne de 8h/jour
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {vehicleTypes.map((vehicle, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Car className="w-8 h-8 text-accent" />
                    <Badge variant="outline">Populaire</Badge>
                  </div>
                  <CardTitle>{vehicle.type}</CardTitle>
                  <CardDescription>
                    <div className="space-y-1">
                      <div className="text-lg font-semibold text-accent">{vehicle.dailyRevenue}</div>
                      <div className="text-sm">{vehicle.monthlyRevenue}</div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Véhicules acceptés :</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {vehicle.examples.map((example, idx) => (
                        <li key={idx}>• {example}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Avantages :</h4>
                    <ul className="space-y-1">
                      {vehicle.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button className="w-full" asChild>
                    <Link to="/auth">Démarrer <ArrowRight className="w-4 h-4 ml-2" /></Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Pourquoi louer avec Tembea ?</h2>
            <p className="text-body-md text-muted-foreground">
              Des avantages uniques pour les propriétaires de véhicules
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto text-accent">
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

      {/* Revenue Calculator */}
      <section id="calculator" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Calculateur de revenus</h2>
            <p className="text-body-md text-muted-foreground">
              Estimez vos revenus potentiels selon votre véhicule
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <h3 className="font-semibold mb-4">Utilisation Légère</h3>
                    <p className="text-sm text-muted-foreground mb-2">4-6 heures/jour</p>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-accent">300,000 FC</p>
                      <p className="text-sm">par mois</p>
                    </div>
                    <ul className="text-xs text-muted-foreground mt-4 space-y-1">
                      <li>• Week-ends principalement</li>
                      <li>• Revenus complémentaires</li>
                      <li>• Usure minimale</li>
                    </ul>
                  </div>
                  
                  <div className="text-center border-x border-border/50">
                    <h3 className="font-semibold mb-4">Utilisation Standard</h3>
                    <p className="text-sm text-muted-foreground mb-2">6-8 heures/jour</p>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-accent">600,000 FC</p>
                      <p className="text-sm">par mois</p>
                    </div>
                    <ul className="text-xs text-muted-foreground mt-4 space-y-1">
                      <li>• Équilibre optimal</li>
                      <li>• Revenus substantiels</li>
                      <li>• Usure contrôlée</li>
                    </ul>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="font-semibold mb-4">Utilisation Intensive</h3>
                    <p className="text-sm text-muted-foreground mb-2">8-12 heures/jour</p>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-accent">1,000,000 FC</p>
                      <p className="text-sm">par mois</p>
                    </div>
                    <ul className="text-xs text-muted-foreground mt-4 space-y-1">
                      <li>• Revenus maximums</li>
                      <li>• Temps plein</li>
                      <li>• ROI rapide</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t text-center">
                  <p className="text-sm text-muted-foreground">
                    * Estimations basées sur les données moyennes. Les revenus réels peuvent varier selon la demande et la saison.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Conditions d'éligibilité</h2>
            <p className="text-body-md text-muted-foreground">
              Votre véhicule doit répondre à ces critères de qualité
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
                    Notre équipe procédera à une inspection gratuite de votre véhicule
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Comment ça marche ?</h2>
            <p className="text-body-md text-muted-foreground">
              Un processus simple en 5 étapes
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              { step: "1", title: "Inscription", desc: "Créez votre compte propriétaire" },
              { step: "2", title: "Évaluation", desc: "Inspection gratuite de votre véhicule" },
              { step: "3", title: "Contrat", desc: "Signature du contrat de partenariat" },
              { step: "4", title: "Formation", desc: "Formation du chauffeur assigné" },
              { step: "5", title: "Activation", desc: "Début des revenus" }
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

      {/* Testimonials */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Témoignages de propriétaires</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Jean-Baptiste M.",
                vehicle: "Toyota Corolla 2019",
                revenue: "450,000 FC/mois",
                comment: "Excellent complément de revenus. Mon véhicule génère plus que prévu !"
              },
              {
                name: "Marie-Claire L.",
                vehicle: "Nissan X-Trail 2020", 
                revenue: "680,000 FC/mois",
                comment: "Service sérieux, paiements toujours à temps. Je recommande vivement."
              },
              {
                name: "Patrick K.",
                vehicle: "Toyota Land Cruiser 2018",
                revenue: "1,200,000 FC/mois",
                comment: "Investissement très rentable. L'équipe Tembea est très professionnelle."
              }
            ].map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-500">⭐</span>
                      ))}
                    </div>
                    <p className="text-sm italic">"{testimonial.comment}"</p>
                    <div className="border-t pt-4">
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.vehicle}</p>
                      <p className="text-sm font-medium text-accent">{testimonial.revenue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-accent to-primary-glow text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-heading-xl">Prêt à rentabiliser votre véhicule ?</h2>
          <p className="text-body-lg opacity-90 max-w-2xl mx-auto">
            Rejoignez des centaines de propriétaires qui génèrent des revenus passifs avec Tembea
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="secondary" size="lg">
              <Link to="/auth">Proposer mon véhicule</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-accent">
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

export default LouerVehicule;