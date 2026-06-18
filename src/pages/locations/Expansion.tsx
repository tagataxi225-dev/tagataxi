import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Rocket, Users, Building, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";
import { PageTransition } from "@/components/layout/PageTransition";
import { Link } from 'react-router-dom';

const Expansion = () => {
  const currentCities = [
    {
      name: "Kinshasa",
      status: "Opérationnel",
      launch: "2024",
      coverage: "95%",
      drivers: "500+",
      color: "bg-green-500"
    },
    {
      name: "Lubumbashi", 
      status: "En expansion",
      launch: "2024",
      coverage: "60%",
      drivers: "300+",
      color: "bg-blue-500"
    },
    {
      name: "Kolwezi",
      status: "Lancé",
      launch: "2024",
      coverage: "40%", 
      drivers: "150+",
      color: "bg-orange-500"
    }
  ];

  const futureCities = [
    {
      name: "Mbuji-Mayi",
      province: "Kasaï-Oriental",
      population: "2.5M habitants",
      launch: "Q1 2025",
      priority: "Élevée",
      features: ["Transport", "Livraison", "Marketplace"]
    },
    {
      name: "Kisangani",
      province: "Tshopo", 
      population: "1.8M habitants",
      launch: "Q2 2025",
      priority: "Élevée",
      features: ["Transport", "Livraison"]
    },
    {
      name: "Goma",
      province: "Nord-Kivu",
      population: "1.5M habitants", 
      launch: "Q3 2025",
      priority: "Moyenne",
      features: ["Transport", "Livraison", "Cross-border"]
    },
    {
      name: "Kananga",
      province: "Kasaï-Central",
      population: "1.2M habitants",
      launch: "Q4 2025", 
      priority: "Moyenne",
      features: ["Transport", "Livraison"]
    },
    {
      name: "Bukavu",
      province: "Sud-Kivu",
      population: "900K habitants",
      launch: "2026",
      priority: "Normale",
      features: ["Transport", "Tourisme"]
    },
    {
      name: "Matadi",
      province: "Kongo-Central", 
      population: "700K habitants",
      launch: "2026",
      priority: "Normale",
      features: ["Transport", "Port logistics"]
    }
  ];

  const expansionFactors = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Densité population",
      description: "Minimum 500,000 habitants dans l'agglomération"
    },
    {
      icon: <Building className="w-6 h-6" />,
      title: "Activité économique",
      description: "Présence d'entreprises et activité commerciale soutenue"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Infrastructure", 
      description: "Réseau routier et couverture internet suffisants"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Potentiel marché",
      description: "Demande estimée pour nos services de mobilité"
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <ModernHeader />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              Plan d'Expansion TAGA
            </Badge>
            <h1 className="text-display-lg">
              TAGA se déploie dans toute la <span className="text-purple-600">RDC</span>
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Notre vision : connecter toutes les grandes villes de la République Démocratique du Congo 
              avec nos services de transport, livraison et marketplace d'ici 2026.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Link to="/support/contact">Demander TAGA dans ma ville</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="#roadmap">Voir la roadmap</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Current Operations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Nos villes actuelles</h2>
            <p className="text-body-md text-muted-foreground">
              Où TAGA est déjà opérationnel en République Démocratique du Congo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {currentCities.map((city, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <MapPin className="w-6 h-6 text-purple-600" />
                    <Badge className={`${city.color} text-white`}>
                      {city.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{city.name}</CardTitle>
                  <CardDescription>Lancé en {city.launch}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{city.coverage}</div>
                      <div className="text-xs text-muted-foreground">Couverture</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{city.drivers}</div>
                      <div className="text-xs text-muted-foreground">Chauffeurs</div>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link to={`/locations/${city.name.toLowerCase()}`}>
                      Voir détails <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Expansion Roadmap */}
      <section id="roadmap" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Prochaines villes</h2>
            <p className="text-body-md text-muted-foreground">
              Notre plan d'expansion pour les 24 prochains mois
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {futureCities.map((city, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Rocket className="w-6 h-6 text-purple-600" />
                    <Badge variant={
                      city.priority === "Élevée" ? "destructive" :
                      city.priority === "Moyenne" ? "default" : "secondary"
                    }>
                      {city.priority}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{city.name}</CardTitle>
                  <CardDescription>{city.province} • {city.population}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Lancement prévu: {city.launch}</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Services prévus :</h4>
                    <div className="flex flex-wrap gap-1">
                      {city.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/support/contact">Me notifier du lancement</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Expansion Criteria */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Critères d'expansion</h2>
            <p className="text-body-md text-muted-foreground">
              Comment nous sélectionnons nos prochaines destinations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {expansionFactors.map((factor, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto text-purple-600">
                    {factor.icon}
                  </div>
                  <h3 className="font-semibold">{factor.title}</h3>
                  <p className="text-sm text-muted-foreground">{factor.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Timeline d'expansion</h2>
            <p className="text-body-md text-muted-foreground">
              Notre feuille de route détaillée 2024-2026
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[
                {
                  period: "2024 Q4",
                  title: "Consolidation villes actuelles",
                  description: "Optimisation des services à Kinshasa, Lubumbashi et Kolwezi",
                  status: "En cours",
                  color: "bg-green-500"
                },
                {
                  period: "2025 Q1",
                  title: "Lancement Mbuji-Mayi",
                  description: "Ouverture transport et livraison dans la capitale du Kasaï-Oriental", 
                  status: "Planifié",
                  color: "bg-blue-500"
                },
                {
                  period: "2025 Q2", 
                  title: "Expansion Kisangani",
                  description: "Services de base dans la capitale de la Tshopo",
                  status: "Planifié",
                  color: "bg-blue-500"
                },
                {
                  period: "2025 Q3-Q4",
                  title: "Goma et Kananga",
                  description: "Déploiement simultané dans deux provinces stratégiques",
                  status: "Prévu",
                  color: "bg-orange-500"
                },
                {
                  period: "2026",
                  title: "Bukavu et Matadi",
                  description: "Finalisation du maillage territorial principal",
                  status: "Objectif",
                  color: "bg-purple-500"
                }
              ].map((milestone, index) => (
                <div key={index} className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className={`w-4 h-4 ${milestone.color} rounded-full`}></div>
                  </div>
                  <div className="flex-1">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{milestone.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{milestone.period}</Badge>
                            <Badge className={milestone.color}>{milestone.status}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Opportunities */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-6 h-6 text-purple-600" />
                  Opportunités de partenariat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">🤝 Partenaires locaux recherchés</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Entrepreneurs avec connaissance locale</li>
                      <li>• Entreprises de transport existantes</li>
                      <li>• Réseaux de distribution</li>
                      <li>• Investisseurs régionaux</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">🏛️ Collaborations institutionnelles</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Gouvernements provinciaux</li>
                      <li>• Chambres de commerce</li>
                      <li>• Universités locales</li>
                      <li>• ONG de développement</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4 border-t text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Votre ville n'est pas dans nos plans immédiats ? Contactez-nous pour explorer les possibilités.
                  </p>
                  <Button asChild>
                    <Link to="/support/contact">Proposer un partenariat</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Vision */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-heading-xl">Notre vision d'impact</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">10+</div>
              <div className="text-sm font-medium">Villes connectées</div>
              <div className="text-xs text-muted-foreground">D'ici 2026</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">50K+</div>
              <div className="text-sm font-medium">Emplois créés</div>
              <div className="text-xs text-muted-foreground">Chauffeurs et livreurs</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">5M+</div>
              <div className="text-sm font-medium">Utilisateurs actifs</div>
              <div className="text-xs text-muted-foreground">À travers la RDC</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">100M+</div>
              <div className="text-sm font-medium">Courses réalisées</div>
              <div className="text-xs text-muted-foreground">Impact mobilité</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-heading-xl">Faites partie de l'expansion TAGA</h2>
          <p className="text-body-lg opacity-90 max-w-2xl mx-auto">
            Votre ville mérite nos services ? Contactez-nous pour accélérer son arrivée dans votre région.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="secondary" size="lg">
              <Link to="/support/contact">Demander TAGA dans ma ville</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-purple-500">
              <Link to="/partners/programme-partenaire">Devenir partenaire</Link>
            </Button>
          </div>
        </div>
      </section>

        <ModernFooter />
      </div>
    </PageTransition>
  );
};

export default Expansion;