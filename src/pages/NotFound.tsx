import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background pt-safe-top pb-safe-bottom px-6">
      <div className="text-center space-y-6 max-w-sm">
        {/* Big 404 */}
        <h1 className="text-8xl font-black text-primary/20 leading-none">404</h1>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Page introuvable</h2>
          <p className="text-sm text-muted-foreground">
            La page <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{location.pathname}</span> n'existe pas.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button asChild className="w-full gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
            Page précédente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
