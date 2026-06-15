import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, Phone, Mail, HelpCircle } from 'lucide-react';
import { ModernHeader } from "@/components/home/ModernHeader";
import ModernFooter from "@/components/landing/ModernFooter";
import { PageTransition } from "@/components/layout/PageTransition";
import { Link } from 'react-router-dom';

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const faqCategories = [
    {
      title: "Général & Compte",
      icon: <HelpCircle className="w-5 h-5" />,
      questions: [
        {
          q: "Comment créer un compte Tembea ?",
          a: "Téléchargez l'app Tembea, choisissez votre type de compte (Client, Chauffeur, Partenaire) et suivez les étapes d'inscription. Vous devez fournir un numéro de téléphone valide et une pièce d'identité."
        },
        {
          q: "Tembea est-il disponible dans toute la RDC ?",
          a: "Actuellement, Tembea est disponible à Kinshasa, Lubumbashi et Kolwezi. Nous prévoyons d'étendre à d'autres villes bientôt."
        },
        {
          q: "Comment modifier mes informations personnelles ?",
          a: "Allez dans Paramètres > Profil dans l'app. Vous pouvez modifier votre nom, photo, numéro de téléphone et adresse email."
        },
        {
          q: "Comment supprimer mon compte ?",
          a: "Contactez notre support via l'app ou envoyez un email à contact@kwendataxi.com avec votre demande de suppression."
        }
      ]
    },
    {
      title: "Transport & Courses",
      icon: <HelpCircle className="w-5 h-5" />,
      questions: [
        {
          q: "Comment commander une course ?",
          a: "Ouvrez l'app, entrez votre destination, choisissez le type de véhicule (taxi-bus, moto-taxi, VTC privé) et confirmez votre commande."
        },
        {
          q: "Combien coûte une course ?",
          a: "Les tarifs varient selon la distance, le type de véhicule et l'heure. L'app vous montre le prix estimé avant de confirmer."
        },
        {
          q: "Puis-je annuler une course ?",
          a: "Oui, vous pouvez annuler jusqu'à 2 minutes après la commande sans frais. Au-delà, des frais d'annulation peuvent s'appliquer."
        },
        {
          q: "Comment payer ma course ?",
          a: "Vous pouvez payer en espèces, avec votre portefeuille TembeaPay ou via mobile money (Orange Money, Airtel Money)."
        }
      ]
    },
    {
      title: "Livraison",
      icon: <HelpCircle className="w-5 h-5" />,
      questions: [
        {
          q: "Quels types de colis puis-je envoyer ?",
          a: "Nous livrons documents, petits colis, nourriture, et gros colis. Les objets dangereux, illégaux ou périssables sont interdits."
        },
        {
          q: "Combien de temps prend une livraison ?",
          a: "Flash (30-60min), Flex (2-4h), Maxicharge (4-8h). Les délais dépendent de la distance et du trafic."
        },
        {
          q: "Comment suivre mon colis ?",
          a: "Utilisez le numéro de suivi dans l'app pour voir la position en temps réel de votre livreur."
        },
        {
          q: "Que faire si mon colis est endommagé ?",
          a: "Signalez immédiatement via l'app. Nous enquêtons et vous remboursons selon notre politique de garantie."
        }
      ]
    },
    {
      title: "Portefeuille & Paiements",
      icon: <HelpCircle className="w-5 h-5" />,
      questions: [
        {
          q: "Comment recharger mon portefeuille TembeaPay ?",
          a: "Via mobile money, carte bancaire, ou en espèces dans nos points de vente partenaires."
        },
        {
          q: "Comment retirer de l'argent ?",
          a: "Allez dans Portefeuille > Retirer, choisissez mobile money ou virement bancaire. Minimum 5,000 FC."
        },
        {
          q: "Quels sont les frais de transaction ?",
          a: "2% pour les rechargements par carte, 1% pour les retraits mobile money. Aucun frais entre portefeuilles Tembea."
        },
        {
          q: "Mon paiement a échoué, que faire ?",
          a: "Vérifiez votre solde et réessayez. Si le problème persiste, contactez notre support."
        }
      ]
    },
    {
      title: "Chauffeurs",
      icon: <HelpCircle className="w-5 h-5" />,
      questions: [
        {
          q: "Comment devenir chauffeur Tembea ?",
          a: "Vous devez avoir 21+ ans, un permis valide, un véhicule/moto en bon état et passer notre vérification de sécurité."
        },
        {
          q: "Combien gagne un chauffeur ?",
          a: "Les revenus varient : 80,000-150,000 FC/mois (temps partiel) à 200,000-400,000 FC/mois (temps plein)."
        },
        {
          q: "Quand suis-je payé ?",
          a: "Paiements hebdomadaires chaque lundi dans votre portefeuille TembeaPay."
        },
        {
          q: "Puis-je choisir mes horaires ?",
          a: "Oui, vous travaillez quand vous voulez. Plus vous êtes actif, plus vous gagnez."
        }
      ]
    },
    {
      title: "Sécurité",
      icon: <HelpCircle className="w-5 h-5" />,
      questions: [
        {
          q: "Comment Tembea assure la sécurité ?",
          a: "Vérification de tous les chauffeurs, tracking GPS en temps réel, assurance courses, et support d'urgence 24h/24."
        },
        {
          q: "Que faire en cas d'urgence ?",
          a: "Utilisez le bouton SOS dans l'app ou appelez le 08 58 04 04 00. Nous contactons immédiatement les secours."
        },
        {
          q: "Mes données sont-elles protégées ?",
          a: "Oui, nous respectons la confidentialité et ne partageons vos données qu'avec votre consentement."
        },
        {
          q: "Comment signaler un chauffeur ?",
          a: "Dans l'historique des courses, cliquez sur 'Signaler' et décrivez le problème. Nous enquêtons sous 24h."
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <ModernHeader />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              Centre d'aide
            </Badge>
            <h1 className="text-display-lg">
              Questions fréquemment posées
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Trouvez rapidement les réponses à vos questions sur Tembea
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher dans la FAQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact Options */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/support/contact" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat en direct
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="tel:+243858040400" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +243 858 040 400
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:contact@kwendataxi.com" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {searchTerm && (
            <div className="mb-8">
              <p className="text-muted-foreground">
                {filteredCategories.reduce((total, cat) => total + cat.questions.length, 0)} résultat(s) pour "{searchTerm}"
              </p>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-12">
            {(searchTerm ? filteredCategories : faqCategories).map((category, categoryIndex) => (
              <Card key={categoryIndex} className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {category.icon}
                    {category.title}
                  </CardTitle>
                  <CardDescription>
                    {category.questions.length} question(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq, faqIndex) => (
                      <AccordionItem key={faqIndex} value={`item-${categoryIndex}-${faqIndex}`}>
                        <AccordionTrigger className="text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          {searchTerm && filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Aucun résultat trouvé pour "{searchTerm}"
              </p>
              <Button onClick={() => setSearchTerm('')}>
                Effacer la recherche
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div>
              <h2 className="text-heading-xl mb-4">Vous ne trouvez pas votre réponse ?</h2>
              <p className="text-body-md text-muted-foreground">
                Notre équipe de support est là pour vous aider 24h/24, 7j/7
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <MessageCircle className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Chat en direct</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Discutez avec notre équipe
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/support/contact">Commencer</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <Phone className="w-8 h-8 text-secondary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Téléphone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Appelez-nous directement
                  </p>
                  <Button asChild variant="outline">
                    <a href="tel:+243858040400">+243 858 040 400</a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <Mail className="w-8 h-8 text-accent mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Écrivez-nous votre question
                  </p>
                  <Button asChild variant="outline">
                    <a href="mailto:contact@kwendataxi.com">Envoyer</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

        <ModernFooter />
      </div>
    </PageTransition>
  );
};

export default FAQ;