import { Button } from "@/components/ui/button";
import { Car, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  const socialLinks = [
    { icon: <Facebook className="w-5 h-5" />, href: "#", label: "Facebook" },
    { icon: <Twitter className="w-5 h-5" />, href: "#", label: "Twitter" },
    { icon: <Instagram className="w-5 h-5" />, href: "#", label: "Instagram" },
    { icon: <Linkedin className="w-5 h-5" />, href: "#", label: "LinkedIn" }
  ];

  const footerLinks = {
    services: [
      "VTC Standard",
      "VTC Luxe", 
      "Trajets Partagés",
      "Livraison Moto",
      "Véhicules Utilitaires"
    ],
    company: [
      "À propos",
      "Notre mission",
      "Carrières",
      "Presse",
      "Partenariats"
    ],
    support: [
      "Centre d'aide",
      "Contact",
      "Signaler un problème",
      "Conditions d'utilisation",
      "Politique de confidentialité"
    ]
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-lg text-white">NTA TECH</div>
                <div className="text-xs text-primary font-semibold">VTC</div>
              </div>
            </div>
            <p className="text-background/80 leading-relaxed">
              Solutions technologiques innovantes pour le transport en Côte d'Ivoire. 
              Nous révolutionnons la mobilité urbaine avec une flotte écologique et des services fiables.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="p-2 bg-background/10 rounded-lg hover:bg-primary transition-colors text-background/80 hover:text-white"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-6 text-white">Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link, index) => (
                <li key={index}>
                  <a href="#" className="text-background/80 hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-lg mb-6 text-white">Entreprise</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href="#" className="text-background/80 hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="font-semibold text-lg mb-6 text-white">Contact & Support</h3>
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-background/80">
                <Phone className="w-5 h-5 text-primary" />
                <span>+225 XX XX XX XX</span>
              </div>
              <div className="flex items-center gap-3 text-background/80">
                <Mail className="w-5 h-5 text-primary" />
                <span>contact@ntatech-vtc.ci</span>
              </div>
              <div className="flex items-center gap-3 text-background/80">
                <MapPin className="w-5 h-5 text-primary" />
                <span>Abidjan, Côte d'Ivoire</span>
              </div>
            </div>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a href="#" className="text-background/80 hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-primary rounded-2xl p-8 mb-12 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Téléchargez l'application NTA TECH VTC
          </h3>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Disponible bientôt sur iOS et Android. Soyez les premiers informés du lancement !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" className="text-lg px-8">
              Notify me - iOS
            </Button>
            <Button variant="secondary" size="lg" className="text-lg px-8">
              Notify me - Android
            </Button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/60 text-sm">
              © 2024 NTA TECH. Tous droits réservés. Entreprise créée en 2019 - Solutions technologiques innovantes.
            </p>
            <div className="flex gap-6 text-sm text-background/60">
              <a href="#" className="hover:text-primary transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-primary transition-colors">CGU</a>
              <a href="#" className="hover:text-primary transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;