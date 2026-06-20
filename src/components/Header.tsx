import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, UtensilsCrossed } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { StoreButtons } from "@/components/store/StoreButtons";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();

  const navItems = [
    { label: t('nav.home'), href: "#accueil" },
    { label: t('nav.services'), href: "#services" },
    { label: t('nav.about'), href: "#avantages" },
    { label: t('nav.contact'), href: "#contact" }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <BrandLogo size={32} className="rounded-lg" alt="TAGA — logo" />
            <span className="sr-only">TAGA</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/client">{t('nav.client')}</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/chauffeur">{t('nav.driver')}</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/restaurant/auth">
                <UtensilsCrossed className="h-4 w-4 mr-1" />
                Restaurant
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/admin">{t('nav.admin')}</a>
            </Button>
            <StoreButtons size="sm" showLabels={false} />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-4">
              {navItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-4 border-t border-border/50 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>+225 XX XX XX XX XX</span>
                </div>
                <StoreButtons size="sm" layout="vertical" />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;