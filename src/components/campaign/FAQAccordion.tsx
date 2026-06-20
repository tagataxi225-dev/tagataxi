import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const FAQAccordion = () => {
  const faqs = [
    {
      question: 'C\'est vraiment gratuit ?',
      answer: 'Oui ! L\'inscription est 100% gratuite et tu reçois immédiatement tes bonus de bienvenue dans ton compte. Aucun frais caché.'
    },
    {
      question: 'Comment obtenir mes bonus ?',
      answer: 'Dès que tu t\'inscris, tes bonus sont automatiquement ajoutés à ton portefeuille TAGAPay. Tu peux les utiliser immédiatement pour ta première course.'
    },
    {
      question: 'Quelles zones sont couvertes à Kinshasa ?',
      answer: 'TAGA couvre toutes les communes de Kinshasa : Gombe, Ngaliema, Lemba, Bandalungwa, Kalamu, Kasa-Vubu, Lingwala, Barumbu, Kinshasa, Kintambo, Mont-Ngafula, Ngiri-Ngiri, Bumbu, Makala, Kimbanseke, Masina, Ndjili, Matete, Limete, Ngaba, Selembao, Kisenso, et Maluku.'
    },
    {
      question: 'Paiement mobile money accepté ?',
      answer: 'Oui ! Nous acceptons Airtel Money, Orange Money, M-Pesa et Vodacom M-Pesa. Tu peux recharger ton compte en quelques secondes.'
    },
    {
      question: 'Comment fonctionne la tombola ?',
      answer: 'À chaque course ou achat, tu reçois des tickets de tombola gratuits. Des tirages ont lieu quotidiennement avec des prix allant de 1,000 à 100,000 CDF !'
    },
    {
      question: 'Les chauffeurs sont-ils vérifiés ?',
      answer: 'Absolument ! Tous nos chauffeurs passent par une vérification complète : permis de conduire, casier judiciaire, et formation obligatoire. Ta sécurité est notre priorité.'
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ❓ Questions fréquentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Tout ce que tu dois savoir avant de commencer
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
