import { Button } from "@/components/ui/button";
import { Play, Star, MapPin, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/hero-vtc.jpg";

const Hero = () => {
  const { t } = useLanguage();
  
  return (
    <section className="relative min-h-screen bg-background overflow-hidden">
      {/* Soft Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-primary/3"></div>
      </div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Star className="w-4 h-4 fill-current" />
                <span>{t('hero.innovation_excellence')}</span>
                <Star className="w-4 h-4 fill-current" />
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent leading-tight">
                {t('hero.kwenda_taxi')}
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                {t('hero.tagline')}
              </p>
            </div>

            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{t('hero.location')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 text-secondary" />
                <span>{t('hero.available_24_7')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="text-lg px-8 py-6">
                {t('hero.start_now')}
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 group">
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {t('hero.view_demo')}
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">4+</div>
                <div className="text-sm text-muted-foreground">{t('hero.transport_types')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">24/7</div>
                <div className="text-sm text-muted-foreground">{t('hero.customer_service')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">100%</div>
                <div className="text-sm text-muted-foreground">{t('hero.kwenda_pay')}</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative z-10">
              <img 
                src={heroImage} 
                alt={t('hero.alt_text')}
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              
              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-gradient-success text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold">
                {t('hero.made_in_rdc')}
              </div>
            </div>
            
            {/* Soft Decorative Elements */}
            <div className="absolute -top-8 -left-8 w-16 h-16 bg-primary/5 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-secondary/4 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;