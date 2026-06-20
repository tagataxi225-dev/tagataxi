/**
 * 🆘 Modal de support chauffeur
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  MessageCircle, 
  FileText, 
  HelpCircle,
  ChevronRight,
  Phone,
  Mail
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FAQ_ITEMS = [
  {
    question: "Comment activer mon service en ligne?",
    answer: "Allez dans l'onglet 'Activité', puis appuyez sur le bouton 'Passer en ligne'. Assurez-vous que votre localisation est activée."
  },
  {
    question: "Quand reçois-je mes paiements?",
    answer: "Les paiements sont crédités instantanément dans votre wallet TAGAPay après chaque course complétée."
  },
  {
    question: "Comment recharger mon wallet?",
    answer: "Allez dans 'Wallet' puis cliquez sur 'Recharger'. Choisissez votre moyen de paiement et suivez les instructions."
  },
  {
    question: "Que faire si un client annule?",
    answer: "Si l'annulation est faite après votre acceptation, vous recevrez automatiquement des frais d'annulation selon votre plan."
  }
];

export const SupportModal = ({ open, onOpenChange }: SupportModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Pour l'instant, on simule la création du ticket
      // La table support_tickets sera créée dans une migration future
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Ticket créé",
        description: "Notre équipe vous répondra dans les 24h",
      });

      setSubject('');
      setMessage('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Ticket error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le ticket",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Support & Assistance
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq">
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="ticket">
              <FileText className="w-4 h-4 mr-2" />
              Ticket
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Phone className="w-4 h-4 mr-2" />
              Contact
            </TabsTrigger>
          </TabsList>

          {/* FAQ */}
          <TabsContent value="faq" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Questions fréquemment posées
            </p>
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          {/* Créer un ticket */}
          <TabsContent value="ticket" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Décrivez votre problème en détail
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sujet</Label>
                <Input
                  placeholder="Ex: Problème de paiement"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Décrivez votre problème en détail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleSubmitTicket}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Créer le ticket
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Contact direct */}
          <TabsContent value="contact" className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Contactez-nous directement
            </p>

            <div className="space-y-3">
              <Card className="p-4 hover:bg-accent cursor-pointer transition-colors">
                <a href="tel:+243123456789" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Appelez-nous</p>
                      <p className="text-sm text-muted-foreground">+243 123 456 789</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </a>
              </Card>

              <Card className="p-4 hover:bg-accent cursor-pointer transition-colors">
                <a href="mailto:support@tagago.app" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">support@tagago.app</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </a>
              </Card>

              <Card className="p-4 hover:bg-accent cursor-pointer transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Chat en direct</p>
                      <p className="text-sm text-muted-foreground">Disponible 24/7</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
