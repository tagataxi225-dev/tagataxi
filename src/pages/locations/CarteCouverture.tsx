import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, Navigation, Clock, Users, Car, Truck, 
  Zap, CheckCircle, AlertCircle, Info, ArrowRight 
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/layout/PageTransition";
import ModernFooter from "@/components/landing/ModernFooter";

const CarteCouverture = () => {
  const [selectedCity, setSelectedCity] = useState("abidjan");

  const cities = {
    abidjan: {
      name: "Abidjan",
      zones: [
        { name: "Cocody", coverage: 95, vehicles: 60, avgTime: "5 min", status: "excellent" },
        { name: "Plateau", coverage: 92, vehicles: 50, avgTime: "6 min", status: "excellent" },
        { name: "Marcory", coverage: 88, vehicles: 42, avgTime: "8 min", status: "bon" },
        { name: "Treichville", coverage: 85, vehicles: 35, avgTime: "9 min", status: "bon" },
        { name: "Yopougon", coverage: 82, vehicles: 70, avgTime: "11 min", status: "bon" },
        { name: "Adjamé", coverage: 80, vehicles: 48, avgTime: "12 min", status: "moyen" },
        { name: "Koumassi", coverage: 76, vehicles: 30, avgTime: "14 min", status: "moyen" },
        { name: "Abobo", coverage: 70, vehicles: 38, avgTime: "17 min", status: "moyen" },
        { name: "Port-Bouët", coverage: 66, vehicles: 22, avgTime: "21 min", status: "limite" }
      ],
      stats: { totalVehicles: 395, activeDrivers: 270, coverage: "82%" },
      services: ["Transport VTC", "Livraison Express"]
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-600 bg-green-100 border-green-200";
      case "bon": return "text-blue-600 bg-blue-100 border-blue-200";
      case "moyen": return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "limite": return "text-orange-600 bg-orange-100 border-orange-200";
      default: return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent": return <CheckCircle className="w-4 h-4" />;
      case "bon": return <CheckCircle className="w-4 h-4" />;
      case "moyen": return <AlertCircle className="w-4 h-4" />;
      case "limite": return <Info className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const currentCity = cities[selectedCity as keyof typeof cities];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-r from-primary via-secondary to-accent text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
          <div className="container mx-auto max-w-7xl text-center relative z-10">
            <Badge variant="outline" className="border-white/30 text-white mb-6">
              🗺️ Couverture TAGA
            </Badge>
            <h1 className="text-display-lg mb-6">
              Carte de Couverture
              <br />
              <span className="bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                Abidjan, Côte d'Ivoire
              </span>
            </h1>
            <p className="text-xl mb-8 text-white/90 max-w-3xl mx-auto">
              Découvrez la disponibilité de nos services dans chaque commune d'Abidjan
              (Cocody, Plateau, Yopougon, Marcory…) avec des informations en temps réel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <Navigation className="w-5 h-5 mr-2" />
                Voir Disponibilité
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Clock className="w-5 h-5 mr-2" />
                Temps d'Attente
              </Button>
            </div>
          </div>
        </section>

        {/* City Selector */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <Tabs value={selectedCity} onValueChange={setSelectedCity} className="w-full">
              <div className="text-center mb-12">
                <h2 className="text-display-md mb-4 bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
                  Couverture par commune
                </h2>
                <p className="text-body-lg text-muted-foreground mb-8">
                  Consultez la couverture détaillée de TAGA dans chaque commune d'Abidjan
                </p>

                <TabsList className="grid w-full max-w-xs mx-auto grid-cols-1">
                  <TabsTrigger value="abidjan" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Abidjan
                  </TabsTrigger>
                </TabsList>
              </div>

              {Object.entries(cities).map(([key, city]) => (
                <TabsContent key={key} value={key} className="mt-8">
                  {/* City Stats */}
                  <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <Card className="text-center">
                      <CardContent className="p-6">
                        <Car className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h3 className="text-heading-lg mb-2">{city.stats.totalVehicles}</h3>
                        <p className="text-body-md text-muted-foreground">Véhicules Disponibles</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="text-center">
                      <CardContent className="p-6">
                        <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
                        <h3 className="text-heading-lg mb-2">{city.stats.activeDrivers}</h3>
                        <p className="text-body-md text-muted-foreground">Chauffeurs Actifs</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="text-center">
                      <CardContent className="p-6">
                        <MapPin className="w-12 h-12 text-accent mx-auto mb-4" />
                        <h3 className="text-heading-lg mb-2">{city.stats.coverage}</h3>
                        <p className="text-body-md text-muted-foreground">Couverture Globale</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Services Available */}
                  <Card className="mb-12">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Services Disponibles à {city.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {city.services.map((service, index) => (
                          <Badge key={index} variant="secondary" className="p-3 text-center justify-center">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Zones Coverage */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-primary" />
                        Couverture par Zone - {city.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {city.zones.map((zone, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                              <MapPin className="w-5 h-5 text-primary" />
                              <div>
                                <h4 className="text-heading-sm">{zone.name}</h4>
                                <p className="text-body-sm text-muted-foreground">
                                  {zone.vehicles} véhicules • Temps moyen: {zone.avgTime}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-heading-sm">{zone.coverage}%</div>
                                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-500"
                                    style={{ width: `${zone.coverage}%` }}
                                  ></div>
                                </div>
                              </div>
                              
                              <Badge className={`${getStatusColor(zone.status)} border`}>
                                {getStatusIcon(zone.status)}
                                <span className="ml-1 capitalize">{zone.status}</span>
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        {/* Legend */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Légende des Statuts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 text-center">
                  <div className="space-y-2">
                    <Badge className={`${getStatusColor("excellent")} border w-full justify-center`}>
                      {getStatusIcon("excellent")}
                      <span className="ml-1">Excellent</span>
                    </Badge>
                    <p className="text-body-sm text-muted-foreground">
                      &lt; 10 min d'attente
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Badge className={`${getStatusColor("bon")} border w-full justify-center`}>
                      {getStatusIcon("bon")}
                      <span className="ml-1">Bon</span>
                    </Badge>
                    <p className="text-body-sm text-muted-foreground">
                      10-15 min d'attente
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Badge className={`${getStatusColor("moyen")} border w-full justify-center`}>
                      {getStatusIcon("moyen")}
                      <span className="ml-1">Moyen</span>
                    </Badge>
                    <p className="text-body-sm text-muted-foreground">
                      15-20 min d'attente
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Badge className={`${getStatusColor("limite")} border w-full justify-center`}>
                      {getStatusIcon("limite")}
                      <span className="ml-1">Limité</span>
                    </Badge>
                    <p className="text-body-sm text-muted-foreground">
                      &gt; 20 min d'attente
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary via-secondary to-accent text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-display-md mb-6">Votre Zone n'est Pas Encore Couverte ?</h2>
            <p className="text-xl mb-8 text-white/90">
              Nous étendons constamment notre couverture. Laissez-nous vos coordonnées pour être notifié 
              dès que nous arrivons dans votre quartier !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/support/contact">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  <MapPin className="w-5 h-5 mr-2" />
                  Demander une Extension
                </Button>
              </Link>
              <Link to="/partners/devenir-chauffeur">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Car className="w-5 h-5 mr-2" />
                  Devenir Partenaire
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <ModernFooter />
      </div>
    </PageTransition>
  );
};

export default CarteCouverture;