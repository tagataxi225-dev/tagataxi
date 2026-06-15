import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, MessageCircle, Mail, HelpCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

const FAQ_ITEMS = [
  { q: 'Comment mettre à jour mon véhicule ?', a: 'Allez dans Activité > Mes véhicules' },
  { q: 'Comment retirer mes gains ?', a: 'Allez dans Wallet > Retirer' },
  { q: 'Que faire en cas d\'accident ?', a: 'Contactez immédiatement le support au +243 XXX XXX XXX' },
];

export const SupportPanel: React.FC = () => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    toast.success('Message envoyé ! Nous vous répondrons sous 24h');
    setMessage('');
    setSubject('');
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="h-5 w-5" />
            <span className="font-semibold">Support Client</span>
          </div>
          <p className="text-sm opacity-90">
            Nous sommes là pour vous aider 24/7
          </p>
        </CardContent>
      </Card>

      {/* Contacts rapides */}
      <div className="grid grid-cols-3 gap-3">
        <Button variant="outline" className="flex-col h-auto py-4">
          <Phone className="h-5 w-5 mb-2 text-green-600" />
          <span className="text-xs">Appeler</span>
        </Button>
        <Button variant="outline" className="flex-col h-auto py-4">
          <MessageCircle className="h-5 w-5 mb-2 text-blue-600" />
          <span className="text-xs">WhatsApp</span>
        </Button>
        <Button variant="outline" className="flex-col h-auto py-4">
          <Mail className="h-5 w-5 mb-2 text-purple-600" />
          <span className="text-xs">Email</span>
        </Button>
      </div>

      {/* Formulaire de contact */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Sujet</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Problème de paiement"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre problème..."
              rows={4}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Envoyer le message
          </Button>
        </CardContent>
      </Card>

      {/* FAQ */}
      <div>
        <h3 className="font-semibold mb-3">Questions fréquentes</h3>
        <div className="space-y-2">
          {FAQ_ITEMS.map((faq, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-1">{faq.q}</h4>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Numéros d'urgence */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Urgence
          </h4>
          <p className="text-sm text-red-800">
            En cas d'urgence (accident, agression) :<br />
            <strong className="text-lg">+243 XXX XXX XXX</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
