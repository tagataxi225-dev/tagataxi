import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Star, MapPin, Clock, Car, ArrowRight, Zap, Users, UtensilsCrossed } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import { HeroCampaignSlider } from "./HeroCampaignSlider";

const ModernHero = () => {
  const { user } = useAuth();
  const { primaryRole, loading: roleLoading } = useUserRoles();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!roleLoading && user && primaryRole) {
      switch (primaryRole) {
        case 'client':
          navigate("/app/client");
          break;
        case 'driver':
          navigate("/app/chauffeur");
          break;
        case 'partner':
          navigate("/app/partenaire");
          break;
        case 'admin':
          navigate("/operatorx/admin");
          break;
      }
    }
  }, [user, primaryRole, roleLoading, navigate]);

  return (
    <section className="relative min-h-screen bg-background overflow-hidden">
      {/* Soft Modern Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-secondary/3 rounded-full blur-2xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-accent/4 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-12 h-12 bg-primary/3 rounded-full blur-xl animate-float" style={{animationDelay: '0.5s'}}></div>
      </div>
      
      <div className="container-section py-8 sm:py-12 lg:py-20 relative z-10">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-12 items-center min-h-[85vh]">
          {/* Content */}
          <div className="space-y-fluid animate-fade-up order-2 lg:order-1">
            {/* Brand Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left stagger-1">
              <div className="interactive-scale">
                <BrandLogo size={56} className="sm:w-16 sm:h-16 lg:w-20 lg:h-20" />
              </div>
              <div className="space-y-2">
                <h1 className="text-display-md bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent animate-gradient">
                  {t('hero.kwenda_taxi')}
                </h1>
                <p className="text-muted-foreground text-body-md">{t('hero.made_in_rdc')}</p>
              </div>
            </div>

            <div className="space-y-fluid">
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 sm:gap-4 text-primary stagger-2">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current animate-pulse" />
                <Badge variant="outline" className="border-primary/30 text-primary text-sm px-4 py-2 bg-primary/5 animate-glow-pulse">
                  {t('hero.innovation_excellence')}
                </Badge>
                <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current animate-pulse" style={{animationDelay: '0.5s'}} />
              </div>
              
              <h2 className="text-display-lg leading-tight text-center lg:text-left stagger-3">
                Transport, livraison, food et plus à Kinshasa, Lubumbashi & Kolwezi
              </h2>
              
              <p className="text-2xl font-semibold text-primary text-center lg:text-left stagger-4">
                Courses abordables tous les jours.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 stagger-5">
              <div className="glass rounded-xl p-4 text-center group hover:bg-primary/5 transition-all duration-300 interactive-scale">
                <MapPin className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-heading-sm">{t('features.stats_cities')}</div>
                <div className="text-caption text-muted-foreground">{t('hero.location')}</div>
              </div>
              <div className="glass rounded-xl p-4 text-center group hover:bg-secondary/5 transition-all duration-300 interactive-scale">
                <Clock className="w-6 h-6 text-secondary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-heading-sm">{t('hero.available_24_7')}</div>
                <div className="text-caption text-muted-foreground">{t('features.stats_support')}</div>
              </div>
              <div className="glass rounded-xl p-4 text-center group hover:bg-accent/5 transition-all duration-300 interactive-scale">
                <Zap className="w-6 h-6 text-accent mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-heading-sm">{t('hero.kwenda_pay')}</div>
                <div className="text-caption text-muted-foreground">{t('payment.method')}</div>
              </div>
              <div className="glass rounded-xl p-4 text-center group hover:bg-primary/5 transition-all duration-300 interactive-scale">
                <Users className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-heading-sm">{t('hero.customer_service')}</div>
                <div className="text-caption text-muted-foreground">{t('features.stats_support')}</div>
              </div>
            </div>

            {/* Restaurant Partner Link */}
            <div className="stagger-6">
              <Link to="/restaurant/auth">
                <Button variant="outline" className="w-full lg:w-auto gap-2 group">
                  <UtensilsCrossed className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Devenir Restaurant Partenaire
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>


          </div>

          {/* Hero Campaign Slider - Dynamic Carousel */}
          <div className="relative animate-scale-fade order-1 lg:order-2 flex items-center justify-center px-4 lg:px-8">
            <HeroCampaignSlider />
            
            {/* Subtle Decorative Background Elements */}
            <div className="absolute -top-20 -left-20 w-32 h-32 lg:w-40 lg:h-40 bg-primary/6 rounded-full blur-3xl animate-float pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 lg:w-48 lg:h-48 bg-red-500/8 rounded-full blur-3xl animate-float pointer-events-none" style={{animationDelay: '2s'}}></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModernHero;