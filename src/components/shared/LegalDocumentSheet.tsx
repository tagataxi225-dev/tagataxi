import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, FileText, Shield, Scale, Users, CreditCard, AlertTriangle, RefreshCw, MapPin, Lock, Cookie, Mail, Eye, Database, Share2 } from 'lucide-react';

interface LegalDocumentSheetProps {
  type: 'terms' | 'privacy' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LegalDocumentSheet = ({ type, open, onOpenChange }: LegalDocumentSheetProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader className="flex items-center justify-between border-b border-border/40 pb-3 px-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              {type === 'terms' ? (
                <Scale className="h-5 w-5 text-primary" />
              ) : (
                <Shield className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <DrawerTitle className="text-base font-semibold text-left">
                {type === 'terms' ? "Conditions Générales d'Utilisation" : 'Politique de Confidentialité'}
              </DrawerTitle>
              <p className="text-xs text-muted-foreground text-left mt-0.5">
                {type === 'terms' ? 'TAGA — Transport & Livraison' : 'Protection de vos données personnelles'}
              </p>
            </div>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 pb-10" style={{ maxHeight: 'calc(90dvh - 90px)' }}>
          {type === 'terms' ? <TermsContent /> : <PrivacyContent />}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

const Section = ({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) => (
  <section className="space-y-2">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-primary shrink-0" />}
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
    <div className="text-sm text-muted-foreground leading-relaxed pl-6">{children}</div>
  </section>
);

const TermsContent = () => (
  <div className="space-y-5 py-4">
    <Section title="1. Objet" icon={FileText}>
      <p>Les présentes conditions générales d'utilisation (CGU) régissent l'utilisation de la plateforme TAGA, service de transport et de livraison en République Démocratique du Congo.</p>
    </Section>
    <Section title="2. Acceptation des conditions" icon={Scale}>
      <p>En utilisant les services TAGA, vous acceptez sans réserve les présentes CGU. L'utilisation continue de la plateforme vaut acceptation des modifications éventuelles.</p>
    </Section>
    <Section title="3. Services proposés" icon={MapPin}>
      <p>TAGA propose des services de transport de personnes (VTC, moto-taxi) et de livraison de colis dans les villes de Kinshasa, Lubumbashi et Kolwezi.</p>
    </Section>
    <Section title="4. Inscription et compte utilisateur" icon={Users}>
      <p>L'utilisation des services nécessite la création d'un compte avec des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants.</p>
    </Section>
    <Section title="5. Tarification" icon={CreditCard}>
      <p>Les tarifs sont affichés avant confirmation de la commande. Des frais supplémentaires peuvent s'appliquer en cas de surge pricing dans les zones à forte demande.</p>
    </Section>
    <Section title="6. Responsabilités" icon={AlertTriangle}>
      <p>TAGA agit comme intermédiaire entre clients et prestataires (chauffeurs, livreurs). Nous ne sommes pas responsables des dommages survenus pendant le trajet.</p>
    </Section>
    <Section title="7. Annulation et remboursement" icon={RefreshCw}>
      <p>Les annulations gratuites sont possibles dans les 2 minutes suivant la commande. Au-delà, des frais d'annulation peuvent s'appliquer.</p>
    </Section>
    <Section title="8. Modification des CGU" icon={FileText}>
      <p>TAGA se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication.</p>
    </Section>
    <p className="text-xs text-muted-foreground/60 pt-3 border-t border-border/30">
      Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
    </p>
  </div>
);

const PrivacyContent = () => (
  <div className="space-y-5 py-4">
    <Section title="1. Collecte des données" icon={Database}>
      <p>TAGA collecte les données personnelles nécessaires à la fourniture de ses services : nom, email, numéro de téléphone, localisation GPS pendant les trajets.</p>
    </Section>
    <Section title="2. Utilisation des données" icon={Eye}>
      <p>Vos données sont utilisées pour :</p>
      <ul className="list-disc ml-4 mt-1.5 space-y-1">
        <li>Traiter vos commandes et paiements</li>
        <li>Améliorer nos services</li>
        <li>Vous envoyer des notifications importantes</li>
        <li>Assurer la sécurité de la plateforme</li>
      </ul>
    </Section>
    <Section title="3. Partage des données" icon={Share2}>
      <p>Vos données peuvent être partagées avec :</p>
      <ul className="list-disc ml-4 mt-1.5 space-y-1">
        <li>Les chauffeurs/livreurs assignés à votre commande</li>
        <li>Les prestataires de paiement mobile money</li>
        <li>Les autorités en cas de demande légale</li>
      </ul>
    </Section>
    <Section title="4. Géolocalisation" icon={MapPin}>
      <p>La géolocalisation est utilisée uniquement pendant les courses actives pour optimiser le service. Vous pouvez désactiver la localisation, mais certaines fonctionnalités seront limitées.</p>
    </Section>
    <Section title="5. Sécurité des données" icon={Lock}>
      <p>Nous utilisons des protocoles de sécurité standards (SSL, chiffrement) pour protéger vos données. Aucune carte bancaire n'est stockée sur nos serveurs.</p>
    </Section>
    <Section title="6. Vos droits" icon={Shield}>
      <p>Vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Contactez-nous à support@tagago.app pour exercer ces droits.</p>
    </Section>
    <Section title="7. Cookies" icon={Cookie}>
      <p>TAGA utilise des cookies essentiels au fonctionnement du site (authentification, préférences). Aucun cookie publicitaire tiers n'est utilisé.</p>
    </Section>
    <Section title="8. Contact" icon={Mail}>
      <p>Pour toute question relative à la protection de vos données, contactez-nous à privacy@tagago.app</p>
    </Section>
    <p className="text-xs text-muted-foreground/60 pt-3 border-t border-border/30">
      Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
    </p>
  </div>
);
