import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, Users, TrendingUp, Heart } from "lucide-react";
import { useState, useEffect } from "react";

const TestimonialsSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Marie Kalala",
      role: "Étudiante",
      location: "Gombe, Kinshasa",
      content: "Tembea Taxi a révolutionné mes déplacements ! Fini les négociations interminables avec les taxis. L'app est simple, les prix transparents et je peux payer avec mon Airtel Money.",
      rating: 5,
      service: "Transport VTC",
      avatar: "👩🏿‍🎓",
      verified: true
    },
    {
      name: "Jean-Baptiste Mukendi",
      role: "Chauffeur Partenaire",
      location: "Lubumbashi, Haut-Katanga",
      content: "Tembea m'a ouvert de nouveaux horizons à Lubumbashi ! Les revenus sont stables et je peux maintenant subvenir aux besoins de ma famille. L'équipe support est fantastique.",
      rating: 5,
      service: "Partenaire Chauffeur",
      avatar: "👨🏿‍💼",
      verified: true
    },
    {
      name: "Grâce Nzuzi",
      role: "Commerçante",
      location: "Kolwezi, Lualaba",
      content: "Depuis Kolwezi, je vends maintenant dans toute la province ! Tembea Shop m'a connectée à des clients de Lubumbashi et même Kinshasa. Un succès incroyable !",
      rating: 5,
      service: "Marketplace",
      avatar: "👩🏿‍💼",
      verified: true
    },
    {
      name: "Patient Mbemba",
      role: "Entrepreneur",
      location: "Ngaliema, Kinshasa",
      content: "La tombola Tembea, c'est génial ! J'ai déjà gagné 50 000 CDF le mois dernier. En plus des courses pratiques, on peut gagner de l'argent. Une vraie innovation !",
      rating: 5,
      service: "Tembea Tombola",
      avatar: "👨🏿‍💻",
      verified: true
    },
    {
      name: "Solange Kongo",
      role: "Mère de famille",
      location: "Masina, Kinshasa",
      content: "Avec Tembea, j'envoie mes courses et mes documents en livraison express. Le suivi en temps réel me rassure totalement. Service impeccable et tarifs abordables !",
      rating: 5,
      service: "Livraison Express",
      avatar: "👩🏿‍🍳",
      verified: true
    }
  ];

  const stats = [
    { icon: <Users className="w-6 h-6" />, value: "10K+", label: "Utilisateurs actifs", color: "text-primary" },
    { icon: <Star className="w-6 h-6" />, value: "4.9/5", label: "Note moyenne", color: "text-secondary" },
    { icon: <TrendingUp className="w-6 h-6" />, value: "95%", label: "Taux satisfaction", color: "text-accent" },
    { icon: <Heart className="w-6 h-6" />, value: "100%", label: "Recommandent", color: "text-primary" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="border-primary/30 text-primary">
            💬 Témoignages Authentiques
          </Badge>
          <h2 className="text-display-md bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
            Ce que disent nos utilisateurs
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
            Découvrez comment Tembea Taxi transforme la vie quotidienne dans les 3 grandes villes du Congo :
            Kinshasa, Lubumbashi et Kolwezi.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className={`inline-flex p-3 rounded-xl bg-muted/50 ${stat.color} mb-4`}>
                  {stat.icon}
                </div>
                <div className="text-heading-lg font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Testimonial Carousel */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Featured Testimonial */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-primary to-primary-glow text-white shadow-2xl">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-4xl">{testimonials[currentTestimonial].avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-heading-sm">{testimonials[currentTestimonial].name}</h3>
                      {testimonials[currentTestimonial].verified && (
                        <Badge variant="secondary" className="text-xs">✓ Vérifié</Badge>
                      )}
                    </div>
                    <p className="text-white/80 text-sm">{testimonials[currentTestimonial].role}</p>
                    <p className="text-white/60 text-xs">{testimonials[currentTestimonial].location}</p>
                  </div>
                  <Quote className="w-8 h-8 text-white/50" />
                </div>

                <p className="text-body-md mb-6 leading-relaxed">
                  "{testimonials[currentTestimonial].content}"
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current text-yellow-400" />
                    ))}
                  </div>
                  <Badge variant="outline" className="border-white/30 text-white">
                    {testimonials[currentTestimonial].service}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Testimonial Navigation */}
          <div className="space-y-4">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all duration-300 ${
                  index === currentTestimonial
                    ? 'border-primary/50 shadow-md scale-105'
                    : 'border-border/30 hover:border-primary/30'
                }`}
                onClick={() => setCurrentTestimonial(index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{testimonial.avatar}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Service Categories Reviews */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-heading-sm mb-2">Transport VTC</h3>
              <div className="flex justify-center items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">4.9/5</span>
              </div>
              <p className="text-sm text-muted-foreground">
                "Service rapide et fiable. Les chauffeurs sont courtois et les véhicules propres."
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-heading-sm mb-2">Livraison Express</h3>
              <div className="flex justify-center items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">4.8/5</span>
              </div>
              <p className="text-sm text-muted-foreground">
                "Livraisons ultra-rapides ! Mon colis est arrivé en 20 minutes. Impressionnant !"
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-4xl mb-4">🛍️</div>
              <h3 className="text-heading-sm mb-2">Marketplace</h3>
              <div className="flex justify-center items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">4.7/5</span>
              </div>
              <p className="text-sm text-muted-foreground">
                "Large choix de produits avec livraison intégrée. Achats sécurisés et pratiques."
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;