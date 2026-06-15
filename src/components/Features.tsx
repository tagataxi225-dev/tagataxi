import { Card, CardContent } from "@/components/ui/card";
import { Shield, Smartphone, Car, Users, CreditCard, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import ecoCarIcon from "@/assets/eco-car-icon.png";
const appIcon = "/kwenda-logo.png";
import driverIcon from "@/assets/driver-icon.png";

const Features = () => {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: <img src={ecoCarIcon} alt={t('features.alt_eco_car')} className="w-12 h-12" />,
      title: t('features.eco_fleet'),
      description: t('features.eco_fleet_desc'),
      color: "text-secondary"
    },
    {
      icon: <img src={appIcon} alt={t('features.alt_mobile_app')} className="w-12 h-12" />,
      title: t('features.smart_geolocation'),
      description: t('features.smart_geolocation_desc'),
      color: "text-primary"
    },
    {
      icon: <img src={driverIcon} alt={t('features.alt_professional_drivers')} className="w-12 h-12" />,
      title: t('features.certified_drivers'),
      description: t('features.certified_drivers_desc'),
      color: "text-accent"
    },
    {
      icon: <CreditCard className="w-12 h-12" />,
      title: t('features.flexible_payments'),
      description: t('features.flexible_payments_desc'),
      color: "text-primary"
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: t('features.shared_rides'),
      description: t('features.shared_rides_desc'),
      color: "text-secondary"
    },
    {
      icon: <Shield className="w-12 h-12" />,
      title: t('features.maximum_security'),
      description: t('features.maximum_security_desc'),
      color: "text-accent"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            {t('features.title_prefix')}{" "}
            <span className="text-primary">{t('features.title_brand')}</span> ?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-elegant transition-all duration-300 border-0 bg-background/50 backdrop-blur-sm hover:-translate-y-2"
            >
              <CardContent className="p-8 text-center">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br from-background to-muted mb-6 ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-gradient-primary rounded-3xl p-8 text-white">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">1000+</div>
              <div className="text-white/80">{t('features.stats_vehicles')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-white/80">{t('features.stats_support')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-white/80">{t('features.stats_eco')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">3 Villes</div>
              <div className="text-white/80">{t('features.stats_cities')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;