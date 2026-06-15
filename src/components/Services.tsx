import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Bike, Truck, Crown, Users, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Services = () => {
  const { t } = useLanguage();
  
  const services = [
    {
      icon: <Car className="w-8 h-8" />,
      title: t('services.vtc_standard'),
      description: t('services.vtc_standard_desc'),
      price: t('services.vtc_standard_price'),
      features: [t('services.vtc_standard_feat1'), t('services.vtc_standard_feat2'), t('services.vtc_standard_feat3')],
      color: "border-primary/20 hover:border-primary/40"
    },
    {
      icon: <Crown className="w-8 h-8" />,
      title: t('services.vtc_luxe'),
      description: t('services.vtc_luxe_desc'),
      price: t('services.vtc_luxe_price'),
      features: [t('services.vtc_luxe_feat1'), t('services.vtc_luxe_feat2'), t('services.vtc_luxe_feat3')],
      color: "border-accent/20 hover:border-accent/40",
      popular: true
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t('services.shared_rides'),
      description: t('services.shared_rides_desc'),
      price: t('services.shared_rides_price'),
      features: [t('services.shared_rides_feat1'), t('services.shared_rides_feat2'), t('services.shared_rides_feat3')],
      color: "border-secondary/20 hover:border-secondary/40"
    },
    {
      icon: <Bike className="w-8 h-8" />,
      title: t('services.moto_delivery'),
      description: t('services.moto_delivery_desc'),
      price: t('services.moto_delivery_price'),
      features: [t('services.moto_delivery_feat1'), t('services.moto_delivery_feat2'), t('services.moto_delivery_feat3')],
      color: "border-primary/20 hover:border-primary/40"
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: t('services.utility_vehicles'),
      description: t('services.utility_vehicles_desc'),
      price: t('services.utility_vehicles_price'),
      features: [t('services.utility_vehicles_feat1'), t('services.utility_vehicles_feat2'), t('services.utility_vehicles_feat3')],
      color: "border-secondary/20 hover:border-secondary/40"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: t('services.advance_booking'),
      description: t('services.advance_booking_desc'),
      price: t('services.advance_booking_price'),
      features: [t('services.advance_booking_feat1'), t('services.advance_booking_feat2'), t('services.advance_booking_feat3')],
      color: "border-accent/20 hover:border-accent/40"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            {t('services.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className={`relative group hover:shadow-elegant transition-all duration-300 ${service.color} hover:-translate-y-1`}
            >
              {service.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {t('services.popular')}
                  </span>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg text-primary group-hover:scale-110 transition-transform">
                    {service.icon}
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </div>
                <p className="text-muted-foreground">{service.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold text-primary">{service.price}</div>
                
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full group-hover:scale-105 transition-transform" 
                  variant={service.popular ? "hero" : "outline"}
                >
                  {t('services.book_now')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-muted/50 to-background border rounded-3xl p-12">
            <h3 className="text-3xl font-bold mb-4">
              {t('services.cta_title')}
            </h3>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('services.cta_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="text-lg px-8 py-6">
                {t('services.download_app')}
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                {t('services.become_driver_partner')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;