import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

const TESTIMONIAL = {
  name: "Marie K.",
  role: "Cliente régulière",
  city: "Kinshasa",
  text: "Avec le système d'enchères, je choisis le chauffeur qui me propose le meilleur tarif. Service transparent et fiable!",
  rating: 5,
};

const SocialProofSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container-section space-y-12">
        {/* Stats horizontales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up">
          <div className="text-center space-y-1">
            <div className="text-display-sm text-primary font-bold">12K+</div>
            <div className="text-body-sm text-muted-foreground">Utilisateurs</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-display-sm text-primary font-bold flex items-center justify-center gap-1">
              4.8 <Star className="w-6 h-6 fill-current text-yellow-500" />
            </div>
            <div className="text-body-sm text-muted-foreground">Note moyenne</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-display-sm text-primary font-bold">4</div>
            <div className="text-body-sm text-muted-foreground">Villes actives</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-display-sm text-primary font-bold">500+</div>
            <div className="text-body-sm text-muted-foreground">Chauffeurs</div>
          </div>
        </div>

        {/* Témoignage unique */}
        <Card className="relative overflow-hidden glass border-primary/20 max-w-2xl mx-auto">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-5">
              <Badge className="bg-gradient-to-r from-primary to-accent text-white px-5 py-1.5">
                ⭐ Témoignage client
              </Badge>
              <div className="flex gap-1">
                {[...Array(TESTIMONIAL.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current text-yellow-500" />
                ))}
              </div>
              <p className="text-body-lg text-foreground leading-relaxed">
                "{TESTIMONIAL.text}"
              </p>
              <div>
                <div className="font-semibold text-heading-sm">{TESTIMONIAL.name}</div>
                <div className="text-sm text-muted-foreground">
                  {TESTIMONIAL.role} • {TESTIMONIAL.city}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SocialProofSection;
