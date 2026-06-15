import { UtensilsCrossed, Car } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useEffect } from "react";
import { HeroCampaignSlider } from "./HeroCampaignSlider";
import { motion } from "framer-motion";
import { StoreButtons } from "@/components/store/StoreButtons";

const ModernHeroSimplified = () => {
  const { user } = useAuth();
  const { primaryRole, loading: roleLoading } = useUserRoles();
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
    <section className="relative min-h-[75vh] bg-background overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-accent/4 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="container-section py-8 lg:py-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content Ultra-Épuré */}
          <div className="space-y-6 text-center lg:text-left">
            {/* Logo + Slogan Modernisé */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center lg:items-start gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <BrandLogo size="md" animated withGlow />
              </motion.div>
              
              {/* Slogan avec gradient */}
              <div className="space-y-3">
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Transport • Livraison • Marketplace
                </h1>
                
                {/* Badge animé avec point vert */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-foreground">
                    Kinshasa • Lubumbashi • Kolwezi
                  </span>
                </div>
              </div>
            </motion.div>

            {/* CTAs Pills Modernes */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-center lg:justify-start max-w-sm mx-auto lg:mx-0"
            >
              {/* Bouton Transport - Pill Design */}
              <Link to="/app/auth">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-red-600 to-red-500 px-6 py-3.5 shadow-lg hover:shadow-red-500/50 transition-all duration-300 w-full sm:w-auto"
                >
                  {/* Glassmorphism effect */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative flex items-center justify-center gap-2">
                    <Car className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-[15px] font-semibold text-white tracking-tight">
                      Réserver
                    </span>
                  </div>
                </motion.button>
              </Link>

              {/* Bouton Livraison - Pill Design */}
              <Link to="/food">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3.5 shadow-lg hover:shadow-orange-500/50 transition-all duration-300 w-full sm:w-auto"
                >
                  {/* Glassmorphism effect */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative flex items-center justify-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-[15px] font-semibold text-white tracking-tight">
                      Commander
                    </span>
                  </div>
                </motion.button>
              </Link>
            </motion.div>

            {/* Store Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center lg:justify-start pt-2"
            >
              <StoreButtons size="md" />
            </motion.div>
          </div>

          {/* Campaign Slider */}
          <div className="relative flex items-center justify-center">
            <HeroCampaignSlider />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModernHeroSimplified;
