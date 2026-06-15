import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, DollarSign, TrendingUp, Users, CheckCircle, Star, ArrowRight } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";
import { PageTransition } from "@/components/layout/PageTransition";
import { Link } from 'react-router-dom';

const VendreEnLigne = () => {
  const categories = [
    {
      name: "Mode & Beauté",
      commission: "8%",
      examples: ["Vêtements", "Chaussures", "Cosmétiques", "Bijoux"],
      volume: "Très demandé"
    },
    {
      name: "Électronique",
      commission: "5%",
      examples: ["Smartphones", "Ordinateurs", "Accessoires", "Audio"],
      volume: "Volume élevé"
    },
    {
      name: "Maison & Jardin",
      commission: "10%",
      examples: ["Mobilier", "Déco", "Ustensiles", "Jardinage"],
      volume: "Croissance forte"
    },
    {
      name: "Alimentation",
      commission: "12%",
      examples: ["Produits locaux", "Épicerie", "Boissons", "Snacks"],
      volume: "Très populaire"
    }
  ];

  const benefits = [
    {
      icon: <Store className="w-6 h-6" />,
      title: "Boutique en ligne gratuite",
      description: "Créez votre vitrine digitale sans frais d'installation"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Commissions attractives",
      description: "Gardez 88-95% de vos ventes selon la catégorie"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Outils marketing",
      description: "Promotions, statistiques et outils de vente inclus"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Base clients Tembea",
      description: "Accédez à notre communauté d'utilisateurs actifs"
    }
  ];

  const requirements = [
    { item: "Être entrepreneur individuel ou entreprise", checked: true },
    { item: "Avoir des produits légaux à vendre", checked: true },
    { item: "Fournir photos de qualité des produits", checked: true },
    { item: "Respecter délais de livraison", checked: true },
    { item: "Service client réactif", checked: true },
    { item: "Compte TembeaPay actif", checked: true }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <ModernHeader />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary-glow/10 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              Marketplace Tembea
            </Badge>
            <h1 className="text-display-lg">
              Vendez en ligne et développez votre <span className="text-primary-glow">business</span>
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Rejoignez la marketplace #1 de Kinshasa. Créez votre boutique en ligne, 
              gérez vos commandes et développez votre clientèle avec nos outils intégrés.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gradient-to-r from-primary-glow to-accent">
                <Link to="/auth">Ouvrir ma boutique</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="#calculator">Calculer mes revenus</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Catégories populaires</h2>
            <p className="text-body-md text-muted-foreground">
              Choisissez votre domaine et commencez à vendre
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Store className="w-6 h-6 text-primary-glow" />
                    <Badge variant="outline">{category.commission} commission</Badge>
                  </div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription>{category.volume}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Exemples :</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {category.examples.map((example, idx) => (
                        <li key={idx}>• {example}</li>
                      ))}
                    </ul>
                  </div>
                  <Button size="sm" className="w-full" asChild>
                    <Link to="/auth">Commencer</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Calculator */}
      <section id="calculator" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Calculateur de revenus</h2>
            <p className="text-body-md text-muted-foreground">
              Estimez vos gains mensuels sur la marketplace
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <h3 className="font-semibold mb-4">Débutant</h3>
                    <p className="text-sm text-muted-foreground mb-2">10-20 ventes/mois</p>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-primary-glow">50,000 FC</p>
                      <p className="text-sm">revenus nets/mois</p>
                    </div>
                    <ul className="text-xs text-muted-foreground mt-4 space-y-1">
                      <li>• Prix moyen: 5,000 FC</li>
                      <li>• Commission: 8%</li>
                      <li>• Livraison incluse</li>
                    </ul>
                  </div>
                  
                  <div className="text-center border-x border-border/50">
                    <h3 className="font-semibold mb-4">Intermédiaire</h3>
                    <p className="text-sm text-muted-foreground mb-2">50-100 ventes/mois</p>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-primary-glow">200,000 FC</p>
                      <p className="text-sm">revenus nets/mois</p>
                    </div>
                    <ul className="text-xs text-muted-foreground mt-4 space-y-1">
                      <li>• Prix moyen: 4,500 FC</li>
                      <li>• Commission: 6%</li>
                      <li>• Outils marketing</li>
                    </ul>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="font-semibold mb-4">Expert</h3>
                    <p className="text-sm text-muted-foreground mb-2">200+ ventes/mois</p>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-primary-glow">800,000 FC</p>
                      <p className="text-sm">revenus nets/mois</p>
                    </div>
                    <ul className="text-xs text-muted-foreground mt-4 space-y-1">
                      <li>• Prix moyen: 4,000 FC</li>
                      <li>• Commission: 5%</li>
                      <li>• Compte premium</li>
                    </ul>
                  </div>
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
            <h2 className="text-heading-xl">Pourquoi vendre sur Tembea ?</h2>
            <p className="text-body-md text-muted-foreground">
              Tous les outils pour faire croître votre business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-primary-glow/10 rounded-lg flex items-center justify-center mx-auto text-primary-glow">
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

      {/* Requirements */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Conditions pour vendre</h2>
            <p className="text-body-md text-muted-foreground">
              Critères à respecter pour rejoindre la marketplace
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
                    Notre équipe vous accompagne dans le processus de validation
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
            <h2 className="text-heading-xl">Comment commencer à vendre ?</h2>
            <p className="text-body-md text-muted-foreground">
              Ouvrez votre boutique en 5 étapes simples
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              { step: "1", title: "Inscription", desc: "Créez votre compte vendeur" },
              { step: "2", title: "Validation", desc: "Vérification de vos documents" },
              { step: "3", title: "Boutique", desc: "Configurez votre vitrine" },
              { step: "4", title: "Produits", desc: "Ajoutez vos articles" },
              { step: "5", title: "Ventes", desc: "Commencez à vendre !" }
            ].map((item, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-glow to-accent rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                  {item.step}
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Témoignages vendeurs</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Mama Esperance",
                business: "Mode & Accessoires",
                sales: "150 ventes/mois",
                comment: "Tembea m'a permis d'agrandir ma clientèle au-delà de mon quartier !"
              },
              {
                name: "Christian M.",
                business: "Électronique", 
                sales: "80 ventes/mois",
                comment: "Interface simple, paiements rapides. Je recommande à tous les commerçants."
              },
              {
                name: "Grace L.",
                business: "Cosmétiques",
                sales: "200 ventes/mois",
                comment: "Les outils marketing m'aident beaucoup. Mes ventes ont doublé en 3 mois."
              }
            ].map((story, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm italic">"{story.comment}"</p>
                    <div className="border-t pt-4">
                      <p className="font-semibold">{story.name}</p>
                      <p className="text-sm text-muted-foreground">{story.business}</p>
                      <p className="text-sm font-medium text-primary-glow">{story.sales}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-glow to-accent text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-heading-xl">Prêt à ouvrir votre boutique ?</h2>
          <p className="text-body-lg opacity-90 max-w-2xl mx-auto">
            Rejoignez des centaines de vendeurs qui développent leur business sur Tembea
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="secondary" size="lg">
              <Link to="/auth">Ouvrir ma boutique</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-glow">
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

export default VendreEnLigne;