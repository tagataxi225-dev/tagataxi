import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
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
          <h1 className="text-3xl font-bold">Politique de Confidentialité</h1>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Collecte des données</h2>
            <p className="text-muted-foreground">
              Tembea collecte les données personnelles nécessaires à la fourniture de ses services : 
              nom, email, numéro de téléphone, localisation GPS pendant les trajets.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Utilisation des données</h2>
            <p className="text-muted-foreground">
              Vos données sont utilisées pour :
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1 text-muted-foreground">
              <li>Traiter vos commandes et paiements</li>
              <li>Améliorer nos services</li>
              <li>Vous envoyer des notifications importantes</li>
              <li>Assurer la sécurité de la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Partage des données</h2>
            <p className="text-muted-foreground">
              Vos données peuvent être partagées avec :
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1 text-muted-foreground">
              <li>Les chauffeurs/livreurs assignés à votre commande</li>
              <li>Les prestataires de paiement mobile money</li>
              <li>Les autorités en cas de demande légale</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Géolocalisation</h2>
            <p className="text-muted-foreground">
              La géolocalisation est utilisée uniquement pendant les courses actives pour optimiser 
              le service. Vous pouvez désactiver la localisation, mais certaines fonctionnalités 
              seront limitées.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Sécurité des données</h2>
            <p className="text-muted-foreground">
              Nous utilisons des protocoles de sécurité standards (SSL, chiffrement) pour protéger 
              vos données. Aucune carte bancaire n'est stockée sur nos serveurs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Vos droits</h2>
            <p className="text-muted-foreground">
              Vous disposez d'un droit d'accès, de rectification et de suppression de vos données 
              personnelles. Contactez-nous à support@tembea.app pour exercer ces droits.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Cookies</h2>
            <p className="text-muted-foreground">
              Tembea utilise des cookies essentiels au fonctionnement du site (authentification, 
              préférences). Aucun cookie publicitaire tiers n'est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question relative à la protection de vos données, contactez-nous à 
              privacy@tembea.app
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

export default Privacy;
