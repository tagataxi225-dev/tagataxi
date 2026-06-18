import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Car, Users, Store, Package, Download, 
  ArrowRight, Smartphone, Star, Zap, Heart
} from "lucide-react";
import { Link } from "react-router-dom";
import { InstallButton } from "@/components/pwa/InstallButton";

const CTASection = () => {
  const userTypes = [
    {
      icon: <Car className="w-8 h-8" />,
      title: "Pour les Clients",
      description: "Commandez vos courses, livraisons et découvrez notre marketplace",
      benefits: ["Transport immédiat", "Livraison express", "Achats sécurisés", "Tombola gratuite"],
      cta: "Commencer maintenant",
      gradient: "from-red-500 via-red-600 to-pink-600",
      popular: true
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Pour les Chauffeurs / Livreurs",
      description: "Rejoignez notre réseau et augmentez vos revenus facilement",
      benefits: ["Revenus réguliers", "Flexibilité totale", "Support 24/7", "Formation gratuite"],
      cta: "Devenir chauffeur",
      gradient: "from-orange-500 via-amber-600 to-yellow-600"
    }
  ];

  const downloadOptions = [
    {
      platform: "Android",
      icon: "📱",
      available: true,
      note: "Installation instantanée"
    },
    {
      platform: "iOS",
      icon: "📲", 
      available: true,
      note: "Ajout à l'écran d'accueil"
    },
    {
      platform: "Web App",
      icon: "🌐",
      available: true,
      note: "Accès direct"
    }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto max-w-7xl">
        {/* Main CTA Header */}
        <div className="text-center mb-16 space-y-6">
          <Badge variant="outline" className="border-primary/30 text-primary text-lg px-6 py-2">
            🚀 Rejoignez l'aventure TAGA !
          </Badge>
          <h2 className="text-display-lg bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
            Prêt à transformer votre
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              expérience à Kinshasa ?
            </span>
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
            Que vous soyez client ou chauffeur, TAGA Taxi a la solution parfaite pour vous. 
            Rejoignez dès aujourd'hui la communauté qui révolutionne Kinshasa, Lubumbashi et Kolwezi !
          </p>
        </div>

        {/* User Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12 lg:mb-16 max-w-4xl mx-auto">
          {userTypes.map((userType, index) => (
            <Card 
              key={index}
              className={`relative group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 touch-manipulation ${
                userType.popular ? 'border-primary/50 shadow-lg' : 'border-border/30'
              }`}
            >
              {userType.popular && (
                <div className="absolute -top-3 lg:-top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-primary-glow text-white shadow-lg text-xs lg:text-sm px-2 lg:px-3">
                    ⭐ Plus Populaire
                  </Badge>
                </div>
              )}

              <CardContent className="p-6 lg:p-8 text-center">
                <div className={`inline-flex p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-gradient-to-br ${userType.gradient} text-white mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="w-6 h-6 lg:w-8 lg:h-8">
                    {userType.icon}
                  </div>
                </div>

                <h3 className="text-lg lg:text-heading-lg mb-3 lg:mb-4 group-hover:text-primary transition-colors">
                  {userType.title}
                </h3>
                
                <p className="text-sm lg:text-body-md text-muted-foreground mb-4 lg:mb-6 leading-relaxed">
                  {userType.description}
                </p>

                <div className="space-y-2 lg:space-y-3 mb-6 lg:mb-8">
                  {userType.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-primary rounded-full flex-shrink-0"></div>
                      <span className="text-left">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Link to="/app/auth">
                  <Button 
                    className={`w-full group-hover:scale-105 transition-all duration-300 bg-gradient-to-r ${userType.gradient} hover:shadow-glow min-h-[48px] text-sm lg:text-base`}
                    size="lg"
                  >
                    {userType.cta}
                    <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Download Section */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 mb-12 lg:mb-16">
          <div className="text-center mb-6 lg:mb-8">
            <h3 className="text-xl lg:text-heading-lg mb-3 lg:mb-4 flex flex-col sm:flex-row items-center justify-center gap-2 lg:gap-3">
              <Download className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
              <span>Téléchargez l'application TAGA Taxi</span>
            </h3>
            <p className="text-sm lg:text-body-md text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Accédez à tous nos services directement depuis votre smartphone. 
              Interface intuitive et optimisée pour les connexions congolaises.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {downloadOptions.map((option, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 touch-manipulation">
                <CardContent className="p-4 lg:p-6">
                  <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">{option.icon}</div>
                  <h4 className="text-base lg:text-heading-sm mb-2">{option.platform}</h4>
                  <p className="text-xs lg:text-sm text-muted-foreground mb-3 lg:mb-4">{option.note}</p>
                  {option.platform === "Web App" ? (
                    <Link to="/app/auth">
                      <Button 
                        variant="default"
                        className="w-full min-h-[44px] text-sm lg:text-base"
                        size="lg"
                      >
                        Lancer l'app
                      </Button>
                    </Link>
                  ) : (
                    <InstallButton 
                      platform={option.platform === "Android" ? "android" : "ios"}
                      variant="default"
                      size="lg"
                      className="w-full min-h-[44px] text-sm lg:text-base"
                      showText
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <p className="text-xs lg:text-sm text-muted-foreground mb-3 lg:mb-4">
              📱 Installation gratuite - Fonctionne hors ligne
            </p>
            <Link to="/install">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow min-h-[48px] text-sm lg:text-base">
                <Download className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                Installer l'application
                <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Final CTA */}
        <Card className="bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-2xl">
          <CardContent className="p-6 lg:p-12 text-center">
            <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-2 lg:gap-4 mb-4 lg:mb-6">
                <Heart className="w-6 h-6 lg:w-8 lg:h-8 animate-pulse" />
                <h3 className="text-xl lg:text-display-sm">Fait avec ❤️ au Congo</h3>
                <Heart className="w-6 h-6 lg:w-8 lg:h-8 animate-pulse" />
              </div>
              
              <p className="text-base lg:text-xl mb-6 lg:mb-8 leading-relaxed">
                TAGA Taxi n'est pas juste une application, c'est un mouvement pour moderniser 
                le transport et le commerce au Congo RDC. Ensemble, construisons l'avenir de Kinshasa, Lubumbashi et Kolwezi !
              </p>

              <div className="flex flex-col gap-3 lg:gap-4 justify-center">
                <Link to="/app/auth">
                  <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4 min-h-[48px] w-full sm:w-auto">
                    <Zap className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                    Rejoindre maintenant
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4 min-h-[48px] w-full sm:w-auto">
                  <Star className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                  En savoir plus
                </Button>
              </div>

              <div className="pt-6 lg:pt-8 border-t border-white/20">
                <p className="text-white/80 text-xs lg:text-sm">
                  🇨🇩 Proudly made in Democratic Republic of Congo • Support local innovation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CTASection;