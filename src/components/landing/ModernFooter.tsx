import { APP_CONFIG } from "@/config/appConfig";
import { Separator } from "@/components/ui/separator";
import { 
  Car, MapPin, Phone, Mail, Clock, 
  Facebook, Twitter, Instagram, Youtube,
  Users, Store, Package, Heart, ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { StoreButtons } from "@/components/store/StoreButtons";

const ModernFooter = () => {
  const footerSections = [
    {
      title: "Services",
      links: [
        { name: "Taxi VTC", href: "/app/auth?service=transport", icon: <Car className="w-4 h-4" /> },
        { name: "Livraison Express", href: "/app/auth?service=delivery", icon: <Package className="w-4 h-4" /> },
        { name: "Location Véhicules", href: "/app/auth?service=rental", icon: <Car className="w-4 h-4" /> },
        { name: "Marketplace", href: "/marketplace", icon: <Store className="w-4 h-4" /> },
        { name: "Tembea Tombola", href: "/app/auth?service=lottery", icon: <Heart className="w-4 h-4" /> }
      ]
    },
    {
      title: "Partenaires",
      links: [
        { name: "Devenir Chauffeur", href: "/driver/auth", icon: <Users className="w-4 h-4" /> },
        { name: "Louer mon Véhicule", href: "/partner/auth", icon: <Car className="w-4 h-4" /> },
        { name: "Devenir Livreur", href: "/driver/auth", icon: <Package className="w-4 h-4" /> },
        { name: "Vendre en ligne", href: "/restaurant/auth", icon: <Store className="w-4 h-4" /> },
        { name: "Programme Partenaire", href: "/partner/auth", icon: <Users className="w-4 h-4" /> }
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Centre d'aide", href: "/support/help-center", icon: <Phone className="w-4 h-4" /> },
        { name: "Nous contacter", href: "/support/contact", icon: <Mail className="w-4 h-4" /> },
        { name: "FAQ", href: "/support/faq", icon: <Heart className="w-4 h-4" /> },
        { name: "Signaler un problème", href: "/support/signaler-probleme", icon: <Phone className="w-4 h-4" /> },
        { name: "Sécurité", href: "/support/contact", icon: <Phone className="w-4 h-4" /> }
      ]
    },
    {
      title: "Zones de Service",
      links: [
        { name: "Kinshasa", href: "/locations/kinshasa", icon: <MapPin className="w-4 h-4" /> },
        { name: "Lubumbashi", href: "/locations/lubumbashi", icon: <MapPin className="w-4 h-4" /> },
        { name: "Kolwezi", href: "/locations/kolwezi", icon: <MapPin className="w-4 h-4" /> },
        { name: "Abidjan", href: "/locations/abidjan", icon: <MapPin className="w-4 h-4" /> },
        { name: "Carte de couverture", href: "/locations/coverage-map", icon: <ExternalLink className="w-4 h-4" /> }
      ]
    }
  ];

  const socialLinks = [
    { name: "Facebook", icon: <Facebook className="w-5 h-5" />, href: "#", color: "hover:text-blue-600" },
    { name: "Twitter", icon: <Twitter className="w-5 h-5" />, href: "#", color: "hover:text-blue-400" },
    { name: "Instagram", icon: <Instagram className="w-5 h-5" />, href: "#", color: "hover:text-pink-600" },
    { name: "YouTube", icon: <Youtube className="w-5 h-5" />, href: "#", color: "hover:text-red-600" }
  ];

  const legalLinks = [
    { name: "Conditions d'utilisation", href: "/legal/terms" },
    { name: "Politique de confidentialité", href: "/legal/privacy" },
    { name: "Cookies", href: "/legal/cookies" },
    { name: "Mentions légales", href: "/legal/legal-notice" }
  ];

  return (
    <footer className="bg-gradient-to-b from-muted/30 to-background border-t border-border/50">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-4">
              <BrandLogo size={48} />
              <div>
                <h3 className="text-heading-sm">Tembea Taxi</h3>
                <p className="text-sm text-muted-foreground">🇨🇩 Made in Congo</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              L'application de transport intelligent qui révolutionne la mobilité en Afrique. 
              Transport avec enchères, livraison, marketplace et tombola en une seule plateforme.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Kinshasa, République Démocratique du Congo</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-secondary" />
                <span>Support 24h/24, 7j/7</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-accent" />
                <span>08 58 04 04 00</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className={`p-2 rounded-lg bg-muted/50 transition-all duration-300 ${social.color} hover:scale-110`}
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Store Buttons */}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-3">Téléchargez l'application</p>
              <StoreButtons size="sm" layout="vertical" />
            </div>
          </div>

          {/* Footer Links */}
          <div className="lg:col-span-4 grid md:grid-cols-4 gap-8">
            {footerSections.map((section) => (
              <div key={section.title} className="space-y-4">
                <h4 className="text-heading-sm">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                      >
                        <span className="group-hover:scale-110 transition-transform">
                          {link.icon}
                        </span>
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Separator className="bg-border/30" />

      {/* Bottom Footer */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              © 2026 Tembea Taxi. Tous droits réservés.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Conçu avec ❤️ pour l'Afrique
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {legalLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="text-center md:text-right">
            <p className="text-xs text-muted-foreground">
              Version {APP_CONFIG.version} • Produit{" "}
              <a href="https://itec-sarlu.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                ITEC
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ModernFooter;