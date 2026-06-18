import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Book, Phone, MessageCircle, Video, Download } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";

const HelpCenter = () => {
  const helpCategories = [
    {
      title: "Transport VTC",
      description: "Tout savoir sur la réservation et les courses",
      icon: <Book className="w-6 h-6" />,
      articles: ["Comment réserver une course", "Types de véhicules", "Paiement courses"],
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Livraison",
      description: "Services de livraison flash et cargo",
      icon: <MessageCircle className="w-6 h-6" />,
      articles: ["Livraison flash", "Livraison cargo", "Suivre ma commande"],
      color: "bg-secondary/10 text-secondary"
    },
    {
      title: "Marketplace",
      description: "Acheter et vendre en toute sécurité",
      icon: <Video className="w-6 h-6" />,
      articles: ["Créer une annonce", "Acheter en sécurité", "Système de notation"],
      color: "bg-accent/10 text-accent"
    },
    {
      title: "TembeaPay",
      description: "Gestion de votre portefeuille",
      icon: <Download className="w-6 h-6" />,
      articles: ["Recharger mon solde", "Historique transactions", "Mobile Money"],
      color: "bg-primary-glow/10 text-primary-glow"
    }
  ];

  const popularArticles = [
    "Comment créer un compte TAGA ?",
    "Quels sont les moyens de paiement acceptés ?",
    "Comment contacter un chauffeur ?",
    "Que faire en cas de problème avec une course ?",
    "Comment devenir chauffeur partenaire ?",
    "Zones de service de TAGA Taxi"
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center space-y-6 mb-12">
          <Badge variant="secondary" className="mb-4">
            Centre d'aide
          </Badge>
          <h1 className="text-display-lg">Comment pouvons-nous vous aider ?</h1>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
            Trouvez rapidement les réponses à vos questions sur TAGA Taxi
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Rechercher dans l'aide..."
              className="pl-10 py-3 text-base"
            />
          </div>
        </div>

        {/* Help Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {helpCategories.map((category, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardHeader className="text-center">
                <div className={`w-16 h-16 rounded-xl ${category.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <CardTitle className="text-heading-sm">{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.articles.map((article, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                      • {article}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Popular Articles */}
        <div className="mb-12">
          <h2 className="text-heading-lg mb-6">Articles populaires</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {popularArticles.map((article, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <h3 className="text-body-lg font-medium hover:text-primary transition-colors">
                    {article}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Options */}
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <h2 className="text-heading-lg">Besoin d'aide personnalisée ?</h2>
              <p className="text-body-md text-muted-foreground">
                Notre équipe support est disponible 24h/24 pour vous accompagner
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Appeler le support
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chat en direct
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <ModernFooter />
    </div>
  );
};

export default HelpCenter;