import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupport } from '@/hooks/useSupport';
import { 
  HelpCircle, 
  Phone, 
  MessageSquare, 
  FileText, 
  Star,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { CongoButton, CongoCard, CongoBadge, CongoGradient } from '@/components/ui/CongoComponents';

interface SupportPanelProps {
  open: boolean;
  onClose: () => void;
}

export const SupportPanel: React.FC<SupportPanelProps> = ({ open, onClose }) => {
  const { 
    loading, 
    metrics, 
    recentTickets, 
    submitTicket, 
    contactEmergency, 
    openFAQ 
  } = useSupport();
  
  const [ticketForm, setTicketForm] = useState({
    type: '' as 'bug' | 'help' | 'feedback' | 'other' | '',
    subject: '',
    description: ''
  });

  const handleSubmitTicket = async () => {
    if (!ticketForm.type || !ticketForm.subject || !ticketForm.description) {
      return;
    }
    
    const success = await submitTicket({
      type: ticketForm.type as 'bug' | 'help' | 'feedback' | 'other',
      subject: ticketForm.subject,
      description: ticketForm.description
    });
    if (success) {
      setTicketForm({ type: '', subject: '', description: '' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'Résolu';
      case 'in_progress':
        return 'En cours';
      default:
        return 'Ouvert';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bug':
        return 'Bug/Problème technique';
      case 'help':
        return 'Aide/Question';
      case 'feedback':
        return 'Feedback/Suggestion';
      default:
        return 'Autre';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto sm:max-w-2xl w-[95vw] sm:w-full">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <HelpCircle className="h-5 w-5 text-congo-blue" />
            Support & Aide
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="help" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger value="help" className="text-xs sm:text-sm data-[state=active]:bg-congo-blue data-[state=active]:text-white">Aide Rapide</TabsTrigger>
            <TabsTrigger value="ticket" className="text-xs sm:text-sm data-[state=active]:bg-congo-blue data-[state=active]:text-white">Nouveau Ticket</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm data-[state=active]:bg-congo-blue data-[state=active]:text-white">Mes Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="help" className="space-y-4">
            {/* Actions rapides */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CongoCard variant="info" className="hover:shadow-md transition-shadow cursor-pointer" onClick={openFAQ}>
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-congo-blue" />
                    <div className="flex-1">
                      <h3 className="font-medium text-white">FAQ</h3>
                      <p className="text-sm text-white/80">Questions fréquentes</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-congo-blue" />
                  </div>
                </CardContent>
              </CongoCard>

              <CongoCard variant="default" className="hover:shadow-md transition-shadow cursor-pointer" onClick={contactEmergency}>
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-8 w-8 text-congo-red" />
                    <div className="flex-1">
                      <h3 className="font-medium text-white">Urgence</h3>
                      <p className="text-sm text-white/80">Support immédiat</p>
                    </div>
                  </div>
                </CardContent>
              </CongoCard>
            </div>

            {/* Statistiques support */}
            <Card className="bg-gradient-congo-subtle border-congo-green/20">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Votre Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-congo-blue">{metrics.totalTickets}</div>
                    <p className="text-sm text-muted-foreground">Total tickets</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-congo-red">{metrics.openTickets}</div>
                    <p className="text-sm text-muted-foreground">En cours</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-congo-green">{metrics.avgResponseTime}</div>
                    <p className="text-sm text-muted-foreground">Réponse moy.</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-congo-yellow">98%</div>
                    <p className="text-sm text-muted-foreground">Satisfaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conseils utiles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conseils Utiles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-congo-blue/10 border border-congo-blue/20 rounded-lg">
                  <Star className="h-5 w-5 text-congo-blue mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Décrivez le problème clairement</p>
                    <p className="text-sm text-muted-foreground">Plus d'infos = résolution plus rapide</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-congo-blue/10 border border-congo-blue/20 rounded-lg">
                  <Star className="h-5 w-5 text-congo-blue mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Joignez des captures d'écran</p>
                    <p className="text-sm text-muted-foreground">Les images aident à comprendre le problème</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-congo-blue/10 border border-congo-blue/20 rounded-lg">
                  <Star className="h-5 w-5 text-congo-blue mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Consultez d'abord la FAQ</p>
                    <p className="text-sm text-muted-foreground">La solution existe peut-être déjà</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ticket" className="space-y-4">
            <Card className="bg-gradient-congo-subtle border-congo-blue/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <MessageSquare className="h-5 w-5 text-congo-blue" />
                  Créer un nouveau ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Type de problème</label>
                  <Select value={ticketForm.type} onValueChange={(value) => setTicketForm({...ticketForm, type: value as 'bug' | 'help' | 'feedback' | 'other'})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">Bug/Problème technique</SelectItem>
                      <SelectItem value="help">Aide/Question</SelectItem>
                      <SelectItem value="feedback">Feedback/Suggestion</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sujet</label>
                  <Input
                    placeholder="Résumé du problème"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description détaillée</label>
                  <Textarea
                    placeholder="Décrivez votre problème en détail..."
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                    rows={4}
                  />
                </div>

                <CongoButton 
                  onClick={handleSubmitTicket}
                  disabled={loading || !ticketForm.type || !ticketForm.subject || !ticketForm.description}
                  variant="info"
                  className="w-full"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le ticket'}
                </CongoButton>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="bg-gradient-congo-subtle border-congo-green/20">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Historique des tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {recentTickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun ticket créé</p>
                    <p className="text-sm">Vos demandes de support apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTickets.map((ticket) => (
                      <Card key={ticket.id} className="overflow-hidden bg-congo-blue/10 border border-congo-blue/20">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-1">
                                <h4 className="font-medium text-foreground">{ticket.subject}</h4>
                                <Badge variant="outline" className="text-xs border-congo-blue/40 text-congo-blue">
                                  {getTypeLabel(ticket.type)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {ticket.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Créé le {ticket.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(ticket.status)}
                              <span className="text-sm text-foreground">{getStatusLabel(ticket.status)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};