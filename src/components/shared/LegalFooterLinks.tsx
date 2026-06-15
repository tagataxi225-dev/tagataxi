import { Link } from 'react-router-dom';
import { FileText, Shield } from 'lucide-react';

export const LegalFooterLinks = () => {
  return (
    <div className="mt-6 mb-4">
      {/* Links container with glass-morphism */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 py-4 px-6 text-xs text-muted-foreground bg-muted/30 backdrop-blur-sm rounded-2xl border border-border/20">
        <Link 
          to="/legal/terms" 
          className="flex items-center gap-2 hover:text-primary transition-colors group"
        >
          <FileText className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
          <span>Conditions d'utilisation</span>
        </Link>
        
        <span className="hidden sm:block text-muted-foreground/30">•</span>
        
        <Link 
          to="/legal/privacy" 
          className="flex items-center gap-2 hover:text-primary transition-colors group"
        >
          <Shield className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
          <span>Politique de confidentialité</span>
        </Link>
      </div>
    </div>
  );
};
