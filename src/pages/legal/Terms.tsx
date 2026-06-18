import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="bg-card rounded-lg shadow-lg p-6 md:p-8 space-y-6">
          <h1 className="text-3xl font-bold">Conditions Générales d'Utilisation</h1>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Objet</h2>
            <p className="text-muted-foreground">
              Les présentes conditions générales d'utilisation (CGU) régissent l'utilisation 
              de la plateforme TAGA, service de transport et de livraison en République 
              Démocratique du Congo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Acceptation des conditions</h2>
            <p className="text-muted-foreground">
              En utilisant les services TAGA, vous acceptez sans réserve les présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Services proposés</h2>
            <p className="text-muted-foreground">
              TAGA propose des services de transport de personnes (VTC, moto-taxi) et de 
              livraison de colis dans les villes de Kinshasa, Lubumbashi et Kolwezi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Inscription et compte utilisateur</h2>
            <p className="text-muted-foreground">
              L'utilisation des services nécessite la création d'un compte avec des informations 
              exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Tarification</h2>
            <p className="text-muted-foreground">
              Les tarifs sont affichés avant confirmation de la commande. Des frais supplémentaires 
              peuvent s'appliquer en cas de surge pricing dans les zones à forte demande.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Responsabilités</h2>
            <p className="text-muted-foreground">
              TAGA agit comme intermédiaire entre clients et prestataires (chauffeurs, livreurs). 
              Nous ne sommes pas responsables des dommages survenus pendant le trajet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Annulation et remboursement</h2>
            <p className="text-muted-foreground">
              Les annulations gratuites sont possibles dans les 2 minutes suivant la commande. 
              Au-delà, des frais d'annulation peuvent s'appliquer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Modification des CGU</h2>
            <p className="text-muted-foreground">
              TAGA se réserve le droit de modifier les présentes CGU à tout moment. 
              Les modifications entrent en vigueur dès leur publication.
            </p>
          </section>

          <div className="text-sm text-muted-foreground pt-4 border-t">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
