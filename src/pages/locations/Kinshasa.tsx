import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, Truck, Store, Trophy, Phone } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";

const Kinshasa = () => {
  const communes = [
    { name: "Gombe", coverage: "100%", rides: "2,500+", status: "active" },
    { name: "Lemba", coverage: "95%", rides: "1,800+", status: "active" },
    { name: "Ngaliema", coverage: "90%", rides: "1,200+", status: "active" },
    { name: "Matete", coverage: "85%", rides: "900+", status: "expanding" },
    { name: "Masina", coverage: "80%", rides: "700+", status: "expanding" },
    { name: "Kimbanseke", coverage: "75%", rides: "500+", status: "new" },
    { name: "Kinshasa", coverage: "100%", rides: "3,000+", status: "active" },
    { name: "Bandalungwa", coverage: "70%", rides: "400+", status: "new" }
  ];

  const services = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Transport VTC",
      description: "Moto-taxi, Taxi-voiture, Taxi-bus disponibles 24h/24",
      stats: "8,500+ courses/jour",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Livraison Express",
      description: "Flash et Cargo dans toute la ville",
      stats: "2,100+ livraisons/jour",
      color: "bg-secondary/10 text-secondary"
    },
    {
      icon: <Store className="w-6 h-6" />,
      title: "Marketplace",
      description: "Achat/vente avec livraison intégrée",
      stats: "1,200+ produits actifs",
      color: "bg-accent/10 text-accent"
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Tembea Tombola",
      description: "Gagnez des prix après chaque course",
      stats: "500+ gagnants/mois",
      color: "bg-primary-glow/10 text-primary-glow"
    }
  ];

  const stats = [
    { label: "Chauffeurs actifs", value: "1,200+", icon: <Users className="w-5 h-5" /> },
    { label: "Zones couvertes", value: "24/24", icon: <MapPin className="w-5 h-5" /> },
    { label: "Temps d'attente moyen", value: "< 5 min", icon: <Clock className="w-5 h-5" /> },
    { label: "Note moyenne", value: "4.8/5", icon: <Trophy className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center space-y-6 mb-12">
          <Badge variant="secondary" className="mb-4">
            <MapPin className="w-4 h-4 mr-2" />
            Kinshasa 🇨🇩
          </Badge>
          <h1 className="text-display-lg">Tembea Taxi à Kinshasa</h1>
          <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
            La capitale congolaise au cœur de notre innovation. Découvrez comment Tembea Taxi 
            transforme la mobilité urbaine dans la plus grande ville d'Afrique francophone.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    {stat.icon}
                  </div>
                </div>
                <h3 className="text-heading-lg font-bold">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Services Grid */}
        <div className="mb-12">
          <h2 className="text-heading-lg mb-8 text-center">Nos services à Kinshasa</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 group">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-xl ${service.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    {service.icon}
                  </div>
                  <CardTitle className="text-heading-sm">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                  <Badge variant="outline" className="text-xs">
                    {service.stats}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Coverage Map */}
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-lg">Couverture par commune</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communes.map((commune, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        commune.status === 'active' ? 'bg-green-500' :
                        commune.status === 'expanding' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <h4 className="font-medium">{commune.name}</h4>
                        <p className="text-xs text-muted-foreground">{commune.rides} courses/mois</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{commune.coverage}</p>
                      <Badge variant="outline" className="text-xs">
                        {commune.status === 'active' ? 'Actif' :
                         commune.status === 'expanding' ? 'Extension' : 'Nouveau'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle className="text-heading-lg">Pourquoi Kinshasa ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-sm">
                    <strong>15 millions d'habitants :</strong> La plus grande ville d'Afrique francophone avec d'énormes besoins de mobilité.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full mt-2"></div>
                  <p className="text-sm">
                    <strong>Centre économique :</strong> Hub commercial et administratif de la RDC.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                  <p className="text-sm">
                    <strong>Innovation locale :</strong> Solution créée par et pour les Kinois.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary-glow rounded-full mt-2"></div>
                  <p className="text-sm">
                    <strong>Potentiel énorme :</strong> Marché en pleine expansion avec une population jeune et connectée.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-background/50">
                <h4 className="font-semibold mb-2">🚀 Objectifs 2024</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Couvrir 100% des 24 communes</li>
                  <li>• 2,000+ chauffeurs partenaires</li>
                  <li>• 50,000+ utilisateurs actifs</li>
                  <li>• Integration totale Mobile Money</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-8 text-center">
            <h2 className="text-heading-lg mb-4">Rejoignez la révolution Tembea à Kinshasa !</h2>
            <p className="text-body-md text-muted-foreground mb-6">
              Que vous soyez utilisateur ou chauffeur, découvrez une nouvelle façon de vous déplacer dans la capitale.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-to-r from-primary to-primary-glow">
                <Phone className="w-4 h-4 mr-2" />
                Télécharger l'app
              </Button>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Devenir chauffeur
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Développé avec ❤️ à Kinshasa par{" "}
                <a 
                  href="https://wa.me/2250100540707" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  ICON SARL
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <ModernFooter />
    </div>
  );
};

export default Kinshasa;