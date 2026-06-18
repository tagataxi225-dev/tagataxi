import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DriverVerifyEmail = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Logo Tembea */}
        <img
          src="/icons/kwenda-icon.svg"
          alt="TAGA"
          className="w-14 h-14 mb-8"
          onError={(e) => {
            // Fallback texte si l'icône n'est pas trouvée
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Icône email verte */}
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mb-6">
          <Mail className="w-10 h-10 text-green-600 dark:text-green-400" aria-hidden="true" />
        </div>

        {/* Titre + corps */}
        <h1 className="text-2xl font-black text-foreground mb-3">
          Vérifiez votre email
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Un lien de confirmation a été envoyé à votre adresse. Cliquez dessus pour activer votre compte.
        </p>

        {/* CTA */}
        <Button
          type="button"
          onClick={() => navigate('/driver/auth')}
          className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold"
        >
          Retour à la connexion
        </Button>
      </div>
    </div>
  );
};

export default DriverVerifyEmail;
