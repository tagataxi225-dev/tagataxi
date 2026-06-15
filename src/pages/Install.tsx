import { Smartphone, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { StoreButtons } from "@/components/store/StoreButtons";
import { motion } from "framer-motion";

const Install = () => {
  const features = [
    "Transport VTC avec enchères intelligentes",
    "Livraison express moto et véhicule",
    "Marketplace avec paiement sécurisé",
    "Loterie quotidienne avec récompenses",
    "Wallet TembeaPay intégré"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Retour</span>
          </Link>
          <BrandLogo size={32} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-lg mx-auto text-center space-y-8">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Téléchargez Tembea</h1>
            <p className="text-muted-foreground">
              L'application de transport et livraison n°1 en RDC
            </p>
          </motion.div>

          {/* Store Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center"
          >
            <StoreButtons size="lg" layout="vertical" />
          </motion.div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border/40 p-6 text-left"
          >
            <h2 className="font-semibold mb-4">Ce que vous obtenez :</h2>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Cities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-muted-foreground">
              Disponible à Kinshasa, Lubumbashi & Kolwezi
            </span>
          </motion.div>

          {/* Continue without app */}
          <div className="pt-4">
            <Link to="/app/auth">
              <Button variant="ghost" className="text-muted-foreground">
                Continuer sur le web →
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Install;
